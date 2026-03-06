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
    useColorScheme
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {CreateContactModal} from "@/components/modals/owner/create-contact";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getAllContacts} from "@/libs/owner/contacts/get-contacts";
import {Contact} from "@/libs/types/contact";
import {useRouter} from "expo-router";

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
            <ThemedView style={styles.card}>
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
                            {item.neighborhood || 'Sin colonia'} • {item.address_line_1}
                        </ThemedText>
                    </View>
                    <TouchableOpacity style={styles.callButton} onPress={() => makeCall(item.phone)}>
                        <Ionicons name="call" size={20} color="#fff"/>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{flex: 1}}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.headerTitle}>Directorio de Clientes</ThemedText>

                <View
                    style={[styles.searchContainer, {backgroundColor: isDark ? '#1c1c1e' : 'rgba(150, 150, 150, 0.1)'}]}>
                    <Ionicons name="search" size={20} color="#8e8e93" style={{marginRight: 10}}/>
                    <TextInput
                        placeholder="Buscar por nombre..."
                        placeholderTextColor="#8e8e93"
                        style={[styles.searchInput, {color: isDark ? '#fff' : '#000'}]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Chips de Colonia */}
                <View style={{marginBottom: 15}}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>}
                    ListEmptyComponent={
                        !loading ? <ThemedText style={styles.emptyText}>No se encontraron contactos.</ThemedText> : null
                    }
                />
                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={30} color="#fff"/>
                </TouchableOpacity>
                <CreateContactModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => fetchData(true)}
                />
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, paddingHorizontal: 16},
    headerTitle: {marginTop: 15, marginBottom: 15, fontSize: 30},
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 12,
        marginBottom: 15
    },
    searchInput: {flex: 1, fontSize: 16},
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        marginRight: 8
    },
    activeChip: {backgroundColor: '#0a7ea4'},
    filterText: {fontSize: 13, opacity: 0.8},
    activeFilterText: {color: '#fff', fontWeight: 'bold'},
    listContent: {paddingBottom: 20},
    card: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)'
    },
    cardHeader: {flexDirection: 'row', alignItems: 'center'},
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
    infoContainer: {flex: 1},
    nameText: {fontSize: 16},
    addressText: {fontSize: 12, opacity: 0.6, marginTop: 2},
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {textAlign: 'center', marginTop: 40, opacity: 0.5},
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 65,
        height: 65,
        borderRadius: 20,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 5,
    }
});