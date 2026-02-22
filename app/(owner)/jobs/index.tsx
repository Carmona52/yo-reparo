import { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getAllJobs } from "@/libs/owner/get-jobs";
import { Job } from "@/libs/types/job";

export default function JobsScreen() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const response = await getAllJobs();
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
        fetchData();
    }, []);

    const renderJobItem = ({ item }: { item: Job }) => (
        <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold" style={styles.jobTitle}>
                    {item.title}
                </ThemedText>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
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
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.headerTitle}>Trabajos Disponibles</ThemedText>

                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderJobItem}
                    contentContainerStyle={styles.listContent}
                    // REFRESH CONTROL: El spinner que sale arriba
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <ThemedText style={styles.emptyText}>No hay trabajos asignados por ahora.</ThemedText>
                        ) : null
                    }
                />
            </ThemedView>
        </SafeAreaView>
    );
}

// Función auxiliar para colores de estado
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Pendiente': return '#f59e0b';
        case 'En Progreso': return '#0a7ea4';
        case 'Completado': return '#10b981';
        default: return '#6b7280';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerTitle: {
        marginVertical: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        // Sombra suave adaptable
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    jobTitle: {
        fontSize: 18,
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    addressText: {
        opacity: 0.7,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
    }
});