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
    Platform, ActivityIndicator
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getAllJobs} from "@/libs/owner/jobs/get-jobs";
import {Job} from "@/libs/types/job";
import {CreateJobModal} from "@/components/modals/owner/create-job";

const STATUS_OPTIONS = ['Todos', 'pendiente', 'en proceso', 'finalizado'];

export default function JobsScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';

    const [isModalVisible, setModalVisible] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    const fetchData = async (force = false) => {
        try {
            const response = await getAllJobs(force);
            setJobs(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Error al cargar trabajos:", error);
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

    const filteredJobs = useMemo(() => {
        const priority: Record<string, number> = {
            'en proceso': 1,
            'pendiente': 2,
            'finalizado': 3
        };

        return jobs.filter(job => {
            const matchesSearch =
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.address.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                selectedStatus === 'Todos' ||
                job.status?.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            const priorityA = priority[a.status?.toLowerCase()] || 99;
            const priorityB = priority[b.status?.toLowerCase()] || 99;
            return priorityA - priorityB;
        });
    }, [jobs, searchQuery, selectedStatus]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pendiente':
                return '#f59e0b';
            case 'en proceso':
                return '#0a7ea4';
            case 'finalizado':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    const renderJobItem = ({item}: { item: Job }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: "/jobs/[id]",
                params: {id: item.id}
            } as any)}>
            <View style={[
                styles.card,
                {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff'}
            ]}>
                <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.jobTitle} numberOfLines={1}>
                        {item.title}
                    </ThemedText>
                    <View style={[styles.badge, {backgroundColor: getStatusColor(item.status)}]}>
                        <ThemedText style={styles.badgeText}>{item.status}</ThemedText>
                    </View>
                </View>

                <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={14} color={isDark ? "#aaa" : "#666"}/>
                    <ThemedText style={styles.addressText} numberOfLines={1}>
                        {item.address}
                    </ThemedText>
                </View>

                <View style={styles.cardFooter}>
                    <ThemedText style={styles.footerInfo}>Ver detalles</ThemedText>
                    <Ionicons name="arrow-forward" size={14} color="#0a7ea4"/>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                {/* Header Fijo */}
                <View style={styles.header}>
                    <ThemedText type="title" style={styles.headerTitle}>Trabajos</ThemedText>

                    <View style={[styles.searchContainer, {backgroundColor: isDark ? '#1c1c1e' : '#f0f2f5'}]}>
                        <Ionicons name="search" size={18} color="#8e8e93"/>
                        <TextInput
                            placeholder="Buscar por nombre o dirección..."
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

                {/* Filtros Horizontales */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                    >
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
                                    selectedStatus === status && styles.filterTextActive,
                                ]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Lista Principal */}
                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderJobItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0a7ea4"
                        />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="clipboard-outline" size={60} color={isDark ? "#333" : "#ccc"}/>
                                <ThemedText style={styles.emptyText}>
                                    {searchQuery || selectedStatus !== 'Todos'
                                        ? "No hay resultados para esta búsqueda."
                                        : "No hay trabajos registrados."}
                                </ThemedText>
                            </View>
                        ) : (
                            <ActivityIndicator size="small" color="#0a7ea4" style={{marginTop: 20}}/>
                        )
                    }
                />

                <CreateJobModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => fetchData(true)}
                />

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color="#fff"/>
                </TouchableOpacity>
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
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 46,
        marginBottom: 10,
        gap: 10
    },
    searchInput: {flex: 1, fontSize: 15},

    filterWrapper: {paddingVertical: 10},
    filterContainer: {paddingHorizontal: 20, gap: 10},
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    filterChipActive: {backgroundColor: '#0a7ea4'},
    filterText: {fontSize: 13, fontWeight: '600', opacity: 0.6},
    filterTextActive: {color: '#fff', opacity: 1},

    listContent: {padding: 20, paddingBottom: 100},
    card: {
        padding: 18,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
        ...Platform.select({
            ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8},
            android: {elevation: 2}
        })
    },
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
    jobTitle: {fontSize: 17, flex: 1, marginRight: 10},
    badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6},
    badgeText: {color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase'},
    addressRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15},
    addressText: {opacity: 0.5, fontSize: 13, flex: 1},
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(150, 150, 150, 0.05)',
        paddingTop: 12,
        gap: 5
    },
    footerInfo: {fontSize: 12, color: '#0a7ea4', fontWeight: '600'},

    emptyContainer: {alignItems: 'center', marginTop: 80, opacity: 0.8},
    emptyText: {textAlign: 'center', marginTop: 15, opacity: 0.5, fontSize: 14, paddingHorizontal: 40},

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