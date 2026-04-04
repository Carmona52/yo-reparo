import {useState, useEffect, useCallback, useMemo} from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
    Linking,
    TouchableOpacity,
    TextInput,
    ScrollView,
    useColorScheme,
    Platform,
    ActivityIndicator
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

import {CreateContactModal} from "@/components/modals/owner/create-contact";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getAllContacts} from "@/libs/owner/contacts/get-contacts";
import {Contact} from "@/libs/types/contact";

export default function ContactsScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos');
    const [modalVisible, setModalVisible] = useState(false);

    const fetchData = async (force = false) => {
        try {
            const response = await getAllContacts(force);
            setContacts(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error al cargar contactos:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const neighborhoods = useMemo(() => {
        const unique = Array.from(new Set(contacts.map(c => c.neighborhood).filter(Boolean)));
        return ['Todos', ...unique.sort()];
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesNeighborhood = selectedNeighborhood === 'Todos' || contact.neighborhood === selectedNeighborhood;
            return matchesSearch && matchesNeighborhood;
        });
    }, [contacts, searchQuery, selectedNeighborhood]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, []);

    const makeCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const renderContactItem = ({item}: { item: Contact }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                router.push({
                    pathname: "/(owner)/contactos/[id]",
                    params: {id: item.id}
                } as any);
            }}
        >
            <View style={[styles.card, {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff'}]}>
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
                        <ThemedText style={styles.addressText} numberOfLines={1}>
                            <Ionicons name="location" size={10} color="#0a7ea4"/> {item.neighborhood || 'Sin colonia'}
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => makeCall(item.phone)}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="call" size={18} color="#fff"/>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                {/* Header Section */}
                <View style={styles.header}>
                    <ThemedText type="title" style={styles.headerTitle}>Clientes</ThemedText>

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

                {/* Filtros de Colonias */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                    >
                        {neighborhoods.map(nb => (
                            <TouchableOpacity
                                key={nb}
                                onPress={() => setSelectedNeighborhood(nb)}
                                style={[styles.filterChip, selectedNeighborhood === nb && styles.activeChip]}
                            >
                                <ThemedText
                                    style={[styles.filterText, selectedNeighborhood === nb && styles.activeFilterText]}>
                                    {nb}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredContacts}
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
                                <ThemedText style={styles.emptyText}>No se encontraron clientes en esta
                                    zona.</ThemedText>
                            </View>
                        ) : (
                            <ActivityIndicator size="small" color="#0a7ea4" style={{marginTop: 20}}/>
                        )
                    }
                />

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-add" size={26} color="#fff"/>
                </TouchableOpacity>

                <CreateContactModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => fetchData(true)}
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {paddingHorizontal: 20, paddingTop: 10},
    headerTitle: {fontSize: 28, marginBottom: 15},
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 46,
        borderRadius: 12,
        marginBottom: 10,
        gap: 10
    },
    searchInput: {flex: 1, fontSize: 15},

    filterWrapper: {paddingVertical: 10},
    filterContainer: {paddingHorizontal: 20, gap: 8},
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    activeChip: {backgroundColor: '#0a7ea4'},
    filterText: {fontSize: 13, opacity: 0.6, fontWeight: '600'},
    activeFilterText: {color: '#fff', opacity: 1},

    listContent: {padding: 20, paddingBottom: 100},
    card: {
        padding: 15,
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
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(10, 126, 164, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    avatarText: {color: '#0a7ea4', fontWeight: 'bold', fontSize: 16},
    infoContainer: {flex: 1},
    nameText: {fontSize: 17, marginBottom: 2},
    addressText: {fontSize: 13, opacity: 0.5},
    callButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
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