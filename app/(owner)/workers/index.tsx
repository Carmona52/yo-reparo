import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Linking, TouchableOpacity, TextInput, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getAllWorkers } from "@/libs/owner/workers/get-workers";
import { Worker } from '@/libs/types/worker'


export default function WorkersScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('Todos');

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
        return workers.filter(worker => {
            const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = selectedRole === 'Todos' || worker.role === selectedRole;
            return matchesSearch && matchesRole;
        });
    }, [workers, searchQuery, selectedRole]);

    const makeCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const renderContactItem = ({ item }: { item: Worker }) => (
        <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>
                        {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </ThemedText>
                </View>
                <View style={styles.infoContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.nameText}>{item.name}</ThemedText>
                    <ThemedText style={styles.addressText} numberOfLines={1}>
                        {item.role} • {item.phone}
                    </ThemedText>
                </View>

                {item.phone && (
                    <TouchableOpacity style={styles.callButton} onPress={() => makeCall(item.phone)}>
                        <Ionicons name="call" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.headerTitle}>Trabajadores Registrados</ThemedText>

                <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1c1c1e' : 'rgba(150, 150, 150, 0.1)' }]}>
                    <Ionicons name="search" size={20} color="#8e8e93" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Buscar por nombre..."
                        placeholderTextColor="#8e8e93"
                        style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <FlatList
                    data={filteredWorkers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderContactItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <ThemedText style={styles.emptyText}>No se encontró personal con estos criterios.</ThemedText>
                        ) : null
                    }
                />
            </ThemedView>

            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => router.push("/workers/create-worker")}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16 },
    headerTitle: { marginVertical: 20 },

    // Buscador
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 12,
        marginBottom: 15
    },
    searchInput: { flex: 1, fontSize: 16 },

    // Filtros
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        marginRight: 8,
    },
    activeChip: { backgroundColor: '#0a7ea4' },
    filterText: { fontSize: 14, opacity: 0.8 },
    activeFilterText: { color: '#fff', fontWeight: 'bold', opacity: 1 },

    listContent: { paddingBottom: 100 },
    card: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 45, height: 45, borderRadius: 22.5,
        backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    infoContainer: { flex: 1 },
    nameText: { fontSize: 16 },
    addressText: { fontSize: 13, opacity: 0.6, marginTop: 2 },
    callButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    },
    emptyText: { textAlign: 'center', marginTop: 40, opacity: 0.5 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#0a7ea4',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 999
    }
});