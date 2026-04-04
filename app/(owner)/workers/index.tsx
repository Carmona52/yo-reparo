import {useState, useEffect, useCallback, useMemo} from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
    Linking,
    TouchableOpacity,
    TextInput,
    useColorScheme,
    Platform,
    ActivityIndicator
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
            <View style={[
                styles.card,
                {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff'}
            ]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.avatar, {backgroundColor: isDark ? '#0a7ea4' : '#e1f5fe'}]}>
                        <ThemedText style={[styles.avatarText, {color: isDark ? '#fff' : '#0a7ea4'}]}>
                            {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </ThemedText>
                    </View>

                    <View style={styles.infoContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.nameText}>
                            {item.name}
                        </ThemedText>
                        <View
                            style={[styles.roleTag, {backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : 'rgba(10, 126, 164, 0.08)'}]}>
                            <ThemedText style={styles.roleText}>{item.role || 'Colaborador'}</ThemedText>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        {item.phone && (
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => makeCall(item.phone)}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="call" size={18} color="#fff"/>
                            </TouchableOpacity>
                        )}
                        <Ionicons name="chevron-forward" size={20} color="#ccc" style={{marginLeft: 10}}/>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={28} color={isDark ? "#fff" : "#333"}/>
                        </TouchableOpacity>
                        <ThemedText type="title" style={styles.headerTitle}>Equipo</ThemedText>
                    </View>

                    <View style={[styles.searchContainer, {backgroundColor: isDark ? '#1c1c1e' : '#f0f2f5'}]}>
                        <Ionicons name="search" size={18} color="#8e8e93"/>
                        <TextInput
                            placeholder="Buscar por nombre..."
                            placeholderTextColor="#8e8e93"
                            style={[styles.searchInput, {color: isDark ? '#fff' : '#000'}]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#8e8e93"/>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Lista de Personal */}
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
                                <Ionicons name="people-outline" size={60} color={isDark ? "#333" : "#ccc"}/>
                                <ThemedText style={styles.emptyText}>No hay personal registrado aún.</ThemedText>
                            </View>
                        ) : (
                            <ActivityIndicator size="small" color="#0a7ea4" style={{marginTop: 20}}/>
                        )
                    }
                />

                {/* FAB */}
                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.8}
                    onPress={() => router.push("/(owner)/workers/create-worker")}>
                    <Ionicons name="person-add" size={26} color="#fff"/>
                </TouchableOpacity>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {paddingHorizontal: 20, paddingTop: 10},
    headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    headerTitle: {fontSize: 28},

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 48,
        borderRadius: 14,
        marginBottom: 10,
        gap: 10
    },
    searchInput: {flex: 1, fontSize: 15},

    listContent: {padding: 20, paddingBottom: 100},
    card: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
        ...Platform.select({
            ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8},
            android: {elevation: 2}
        })
    },
    cardHeader: {flexDirection: 'row', alignItems: 'center'},
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {fontWeight: 'bold', fontSize: 18},
    infoContainer: {flex: 1},
    nameText: {fontSize: 17, fontWeight: '700', marginBottom: 4},
    roleTag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    roleText: {fontSize: 10, color: '#0a7ea4', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5},

    actionButtons: {flexDirection: 'row', alignItems: 'center'},
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    emptyContainer: {alignItems: 'center', marginTop: 80, opacity: 0.8},
    emptyText: {textAlign: 'center', marginTop: 15, opacity: 0.5, fontSize: 14},

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0a7ea4',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    }
});