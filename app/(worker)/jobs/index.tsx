import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getWorkerJobs } from "@/libs/workers/get-jobs";
import { Job } from "@/libs/types/job";

const STATUS_OPTIONS = ['Todos', 'en proceso', 'pendiente', 'finalizado'];

export default function JobsScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    const fetchData = useCallback(async (force = false) => {
        try {
            const response = await getWorkerJobs(force);
            setJobs(Array.isArray(response) ? response : response.jobs || []);
        } catch (error) {
            console.error("Error al cargar trabajos:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [fetchData]);

    const filteredJobs = useMemo(() => {
        const priority: Record<string, number> = {
            'en proceso': 1,
            'pendiente': 2,
            'finalizado': 3
        };

        return jobs
            .filter(job => {
                const matchesSearch =
                    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    job.address?.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesStatus =
                    selectedStatus === 'Todos' ||
                    job.status?.toLowerCase() === selectedStatus.toLowerCase();

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const priorityA = priority[a.status?.toLowerCase()] || 99;
                const priorityB = priority[b.status?.toLowerCase()] || 99;
                return priorityA - priorityB;
            });
    }, [jobs, searchQuery, selectedStatus]);

    const getStatusColor = (status: string) => {
        const colors = {
            'pendiente': '#f59e0b',
            'en proceso': '#0a7ea4',
            'finalizado': '#10b981',
            'default': '#6b7280'
        };
        return colors[status?.toLowerCase() as keyof typeof colors] || colors.default;
    };

    const renderJobItem = ({ item }: { item: Job }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: "/jobs/[id]",
                params: { id: item.id }
            } as any)}>
            <ThemedView style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9' }]}>
                <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.jobTitle} numberOfLines={1}>
                        {item.title}
                    </ThemedText>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <ThemedText style={styles.badgeText}>{item.status}</ThemedText>
                    </View>
                </View>

                <ThemedText style={styles.addressText} numberOfLines={2}>
                    <Ionicons name="location-outline" size={14} /> {item.address}
                </ThemedText>

                <View style={styles.cardFooter}>
                    <ThemedText style={styles.dateText}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={18} color="#0a7ea4" />
                </View>
            </ThemedView>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
            <ThemedView style={{ flex: 1 }}>
                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderJobItem}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.headerWrapper}>
                            <ThemedText type="title" style={styles.headerTitle}>Mis Trabajos</ThemedText>

                            <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0' }]}>
                                <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
                                <TextInput
                                    placeholder="Buscar por título o dirección..."
                                    placeholderTextColor="#8e8e93"
                                    style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color="#8e8e93" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.filterWrapper}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {STATUS_OPTIONS.map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setSelectedStatus(status)}
                                            style={[
                                                styles.filterChip,
                                                selectedStatus === status && styles.filterChipActive
                                            ]}>
                                            <ThemedText style={[
                                                styles.filterText,
                                                selectedStatus === status && styles.filterTextActive
                                            ]}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="clipboard-outline" size={50} color="#ccc" />
                                <ThemedText style={styles.emptyText}>
                                    {searchQuery || selectedStatus !== 'Todos'
                                        ? "Sin resultados para los filtros aplicados."
                                        : "Aún no tienes trabajos asignados."}
                                </ThemedText>
                            </View>
                        ) : null
                    }
                />
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerWrapper: { paddingHorizontal: 16 },
    headerTitle: { marginTop: 15, marginBottom: 15, fontSize: 28 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 15,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16 },
    filterWrapper: { marginBottom: 20 },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        marginRight: 10,
    },
    filterChipActive: { backgroundColor: '#0a7ea4' },
    filterText: { fontSize: 14, fontWeight: '500', opacity: 0.7 },
    filterTextActive: { color: '#fff', opacity: 1 },
    listContent: { paddingBottom: 40, paddingHorizontal: 16 },
    card: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    jobTitle: { fontSize: 17, flex: 1, fontWeight: '700' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    addressText: { opacity: 0.6, fontSize: 13, marginBottom: 12 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)',
        paddingTop: 10
    },
    dateText: { fontSize: 12, opacity: 0.5 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { textAlign: 'center', marginTop: 15, opacity: 0.5, maxWidth: '80%' },
});