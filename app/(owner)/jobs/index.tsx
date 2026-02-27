import {useState, useEffect, useCallback, useMemo} from 'react';
import {FlatList, RefreshControl, StyleSheet, View, TextInput, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getAllJobs} from "@/libs/owner/jobs/get-jobs";
import {Job} from "@/libs/types/job";
import {useRouter} from "expo-router";
import {CreateJobModal} from "@/components/modals/owner/create-job";

const STATUS_OPTIONS = ['Todos', 'Pendiente', 'En Progreso', 'Completado'];

export default function JobsScreen() {
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    const fetchData = async () => {
        try {
            const response = await getAllJobs(false);
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
        getAllJobs(true).then(response => {
            setJobs(Array.isArray(response) ? response : response.data || []);
            setRefreshing(false);
        }).catch(error => {
            console.error(error);
            setRefreshing(false);
        });
    }, []);

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.address.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus === 'Todos' || job.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }, [jobs, searchQuery, selectedStatus]);

    const renderJobItem = ({item}: { item: Job }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/jobs/${item.id}` as any)}>
            <ThemedView style={styles.card}>
                <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.jobTitle}>
                        {item.title}
                    </ThemedText>
                    <View style={[styles.badge, {backgroundColor: getStatusColor(item.status)}]}>
                        <ThemedText style={styles.badgeText}>{item.status}</ThemedText>
                    </View>
                </View>

                <ThemedText style={styles.addressText}>{item.address}</ThemedText>

                {item.fecha_cita && (
                    <ThemedText style={styles.dateText}>
                        📅 {new Date(item.fecha_cita).toLocaleDateString()}
                    </ThemedText>
                )}
            </ThemedView>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{flex: 1}}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.headerTitle}>Trabajos Disponibles</ThemedText>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon}/>
                    <TextInput
                        placeholder="Buscar por título o dirección..."
                        placeholderTextColor="#8e8e93"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#8e8e93"/>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.filterWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.filterContainer}>
                        {STATUS_OPTIONS.map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setSelectedStatus(status)}
                                style={[
                                    styles.filterChip,
                                    selectedStatus === status && styles.filterChipActive
                                ]}
                            >
                                <ThemedText style={[
                                    styles.filterText,
                                    selectedStatus === status && styles.filterTextActive
                                ]}>
                                    {status}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderJobItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <ThemedText style={styles.emptyText}>
                                {searchQuery || selectedStatus !== 'Todos'
                                    ? "No se encontraron resultados para tu búsqueda."
                                    : "No hay trabajos asignados por ahora."}
                            </ThemedText>
                        ) : null
                    }
                />

                {/* MODAL DE CREACIÓN */}
                <CreateJobModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={fetchData}
                />

                {/* BOTÓN FLOTANTE (FAB) */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            </ThemedView>
        </SafeAreaView>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Pendiente': return '#f59e0b';
        case 'En Progreso': return '#0a7ea4';
        case 'Completado': return '#10b981';
        default: return '#6b7280';
    }
};

const styles = StyleSheet.create({
    container: {flex: 1, paddingHorizontal: 16, position: 'relative'},
    headerTitle: {marginTop: 20, marginBottom: 10},
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 45,
        marginBottom: 15,
    },
    searchIcon: {marginRight: 8},
    searchInput: {flex: 1, color: '#000', fontSize: 16},

    filterWrapper: {marginBottom: 15},
    filterContainer: {paddingRight: 20},
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    filterText: {fontSize: 14, opacity: 0.8},
    filterTextActive: {color: '#fff', fontWeight: 'bold', opacity: 1},

    listContent: {paddingBottom: 100},
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
    jobTitle: {fontSize: 18, flex: 1, marginRight: 8},
    badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6},
    badgeText: {color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase'},
    addressText: {opacity: 0.7, marginBottom: 8},
    dateText: {fontSize: 13, fontWeight: '500'},
    emptyText: {textAlign: 'center', marginTop: 40, opacity: 0.5},

    // ESTILO DEL BOTÓN FLOTANTE
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});