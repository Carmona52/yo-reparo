import {useState, useEffect, useCallback, useMemo} from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
    Linking,
    TouchableOpacity,
    TextInput,
    useColorScheme
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getAllWorkers} from "@/libs/owner/workers/get-workers";
import {Worker} from '@/libs/types/worker';

export default function WorkersScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async (force = false) => {
        try {
            const response = await getAllWorkers(force);
            setWorkers(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Error al cargar trabajadores:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, []);

    const filteredWorkers = useMemo(() => {
        return workers.filter(worker =>
            worker.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [workers, searchQuery]);

    const makeCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const renderContactItem = ({item}: { item: Worker }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/workers/${item.id}` as any)}>
            <ThemedView style={[styles.card, {backgroundColor: isDark ? '#1c1c1e' : '#fff'}]}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                        <ThemedText style={styles.avatarText}>
                            {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </ThemedText>
                    </View>

                    <View style={styles.infoContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.nameText}>
                            {item.name}
                        </ThemedText>
                        <View style={styles.roleTag}>
                            <ThemedText style={styles.roleText}>{item.role || 'Trabajador'}</ThemedText>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        {item.phone && (
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => makeCall(item.phone)}
                            >
                                <Ionicons name="call" size={18} color="#fff"/>
                            </TouchableOpacity>
                        )}
                        <Ionicons name="chevron-forward" size={20} color="#ccc" style={{marginLeft: 8}}/>
                    </View>
                </View>
            </ThemedView>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{flex: 1}}>
            <ThemedView style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#333"}/>
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.headerTitle}>Personal</ThemedText>
                </View>

                <View style={[styles.searchContainer, {backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0'}]}>
                    <Ionicons name="search" size={18} color="#8e8e93" style={{marginRight: 10}}/>
                    <TextInput
                        placeholder="Buscar por nombre..."
                        placeholderTextColor="#8e8e93"
                        style={[styles.searchInput, {color: isDark ? '#fff' : '#000'}]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <FlatList
                    data={filteredWorkers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderContactItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={50} color="#ccc"/>
                                <ThemedText style={styles.emptyText}>No hay personal registrado</ThemedText>
                            </View>
                        ) : null
                    }
                />
            </ThemedView>

            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => router.push("/(owner)/workers/create-worker")}>
                <Ionicons name="add" size={30} color="#fff"/>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, paddingHorizontal: 20},
    headerRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 20},
    backBtn: {marginRight: 15},
    headerTitle: {fontSize: 28},

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 15,
        marginBottom: 20,
    },
    searchInput: {flex: 1, fontSize: 16},

    listContent: {paddingBottom: 100},
    card: {
        padding: 15,
        borderRadius: 20,
        marginBottom: 12,
        // Sombra ligera
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardHeader: {flexDirection: 'row', alignItems: 'center'},
    avatar: {
        width: 50, height: 50, borderRadius: 15,
        backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center', marginRight: 15,
    },
    avatarText: {color: '#fff', fontWeight: 'bold', fontSize: 18},
    infoContainer: {flex: 1},
    nameText: {fontSize: 17, fontWeight: '600'},
    roleTag: {
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4
    },
    roleText: {fontSize: 11, color: '#0a7ea4', fontWeight: 'bold', textTransform: 'uppercase'},

    actionButtons: {flexDirection: 'row', alignItems: 'center'},
    callButton: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
    },

    emptyContainer: {alignItems: 'center', marginTop: 60},
    emptyText: {textAlign: 'center', marginTop: 10, opacity: 0.4},

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#0a7ea4',
        width: 60, height: 60, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
    }
});