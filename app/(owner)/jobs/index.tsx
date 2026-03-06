import {useState, useEffect, useCallback, useMemo} from 'react';
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
        return jobs.filter(job => {
            const matchesSearch =
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.address.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                selectedStatus === 'Todos' ||
                job.status?.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesStatus;
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
            <ThemedView style={[styles.card, {backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9'}]}>
                <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.jobTitle} numberOfLines={1}>
                        {item.title}
                    </ThemedText>
                    <View style={[styles.badge, {backgroundColor: getStatusColor(item.status)}]}>
                        <ThemedText style={styles.badgeText}>{item.status}</ThemedText>
                    </View>
                </View>

                <ThemedText style={styles.addressText} numberOfLines={2}>
                    <Ionicons name="location-outline" size={14}/> {item.address}
                </ThemedText>
            </ThemedView>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{flex: 1}}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.headerTitle}>Trabajos</ThemedText>

                <View style={[styles.searchContainer, {backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0'}]}>
                    <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon}/>
                    <TextInput
                        placeholder="Buscar trabajo o dirección..."
                        placeholderTextColor="#8e8e93"
                        style={[styles.searchInput, {color: isDark ? '#fff' : '#000'}]}
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
                                ]}>
                                <ThemedText style={[
                                    styles.filterText,
                                    selectedStatus === status && styles.filterTextActive,
                                    {textTransform: 'capitalize'}]}>
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
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="clipboard-outline" size={50} color="#ccc"/>
                                <ThemedText style={styles.emptyText}>
                                    {searchQuery || selectedStatus !== 'Todos'
                                        ? "No hay resultados para este filtro."
                                        : "No tienes trabajos asignados."}
                                </ThemedText>
                            </View>
                        ) : null
                    }/>

                <CreateJobModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => fetchData(true)}/>

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color="#fff"/>
                </TouchableOpacity>
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
        borderRadius: 15,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 15,
    },
    searchIcon: {marginRight: 10},
    searchInput: {flex: 1, fontSize: 16},

    filterWrapper: {marginBottom: 20},
    filterContainer: {paddingRight: 20},
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        marginRight: 10,
    },
    filterChipActive: {backgroundColor: '#0a7ea4'},
    filterText: {fontSize: 14, fontWeight: '500', opacity: 0.7},
    filterTextActive: {color: '#fff', opacity: 1},

    listContent: {paddingBottom: 100},
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
    jobTitle: {fontSize: 18, flex: 1, fontWeight: '700'},
    badge: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8},
    badgeText: {color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase'},
    addressText: {opacity: 0.6, fontSize: 14, lineHeight: 20, marginBottom: 15},
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)',
        paddingTop: 12
    },
    dateText: {fontSize: 13, fontWeight: '600', color: '#0a7ea4'},

    emptyContainer: {alignItems: 'center', marginTop: 50},
    emptyText: {textAlign: 'center', marginTop: 15, opacity: 0.5, maxWidth: '80%'},

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