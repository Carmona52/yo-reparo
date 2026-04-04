import {useState, useEffect, useCallback, useMemo} from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Platform
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getWorkerJobs} from "@/libs/workers/get-jobs";
import {Job} from "@/libs/types/job";

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

    const renderJobItem = ({item}: { item: Job }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: "/jobs/[id]",
                params: {id: item.id}
            } as any)}>
            <View style={[styles.card, {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff'}]}>
                <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                        <ThemedText type="defaultSemiBold" style={styles.jobTitle} numberOfLines={1}>
                            {item.title}
                        </ThemedText>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, {backgroundColor: getStatusColor(item.status)}]}/>
                            <ThemedText style={styles.statusText}>{item.status}</ThemedText>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc"/>
                </View>

                <ThemedText style={styles.addressText} numberOfLines={1}>
                    <Ionicons name="location" size={12} color="#0a7ea4"/> {item.address}
                </ThemedText>

                <View style={styles.cardFooter}>
                    <ThemedText style={styles.dateText}>
                        Asignado el {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short'
                    }) : ''}
                    </ThemedText>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderJobItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.headerWrapper}>
                            <ThemedText type="title" style={styles.headerTitle}>Mis Trabajos</ThemedText>

                            <View style={[styles.searchContainer, {backgroundColor: isDark ? '#1c1c1e' : '#f0f2f5'}]}>
                                <Ionicons name="search" size={18} color="#8e8e93"/>
                                <TextInput
                                    placeholder="Buscar trabajo..."
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

                            <View style={styles.filterWrapper}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{gap: 8}}>
                                    {STATUS_OPTIONS.map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setSelectedStatus(status)}
                                            style={[
                                                styles.filterChip,
                                                selectedStatus === status && styles.filterChipActive,
                                                {backgroundColor: selectedStatus === status ? '#0a7ea4' : (isDark ? '#1c1c1e' : '#f0f2f5')}
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
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="construct-outline" size={60} color={isDark ? "#333" : "#ccc"}/>
                                <ThemedText style={styles.emptyText}>
                                    {searchQuery || selectedStatus !== 'Todos'
                                        ? "No hay trabajos que coincidan con tu búsqueda."
                                        : "No tienes trabajos asignados en este momento."}
                                </ThemedText>
                            </View>
                        ) : null
                    }
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    headerWrapper: {paddingHorizontal: 20, paddingTop: 10},
    headerTitle: {marginBottom: 15, fontSize: 28},
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 15,
        gap: 8
    },
    searchInput: {flex: 1, fontSize: 15},
    filterWrapper: {marginBottom: 20},
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    filterChipActive: {
        shadowColor: '#0a7ea4',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    filterText: {fontSize: 13, fontWeight: '600', opacity: 0.6},
    filterTextActive: {color: '#fff', opacity: 1},
    listContent: {paddingBottom: 40},
    card: {
        marginHorizontal: 20,
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
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10},
    jobTitle: {fontSize: 18, fontWeight: '700', marginBottom: 4},
    statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
    statusDot: {width: 8, height: 8, borderRadius: 4},
    statusText: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', opacity: 0.8},
    addressText: {opacity: 0.5, fontSize: 13, marginBottom: 12},
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.08)',
        paddingTop: 10
    },
    dateText: {fontSize: 11, opacity: 0.4, fontWeight: '600'},
    emptyContainer: {alignItems: 'center', marginTop: 80, paddingHorizontal: 40},
    emptyText: {textAlign: 'center', marginTop: 15, opacity: 0.4, fontSize: 15, lineHeight: 22},
});