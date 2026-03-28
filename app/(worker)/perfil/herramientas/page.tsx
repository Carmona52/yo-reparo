import { useEffect, useState, useCallback } from 'react'; // 1. Añadimos useCallback
import { StyleSheet, FlatList, ActivityIndicator, View, RefreshControl } from 'react-native'; // 2. Importamos RefreshControl
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getTools } from "@/libs/workers/tools";
import { Tools } from "@/libs/types/tools";

export default function HerramientasPage() {
    const [tools, setTools] = useState<Tools[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTools = async (force = false) => {
        try {
            const data = await getTools(force);
            setTools(data);
        } catch (error) {
            console.error("Error cargando herramientas:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTools(true);
    }, []);

    useEffect(() => {
        loadTools();
    }, []);

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color="#0a7ea4" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Herramientas prestadas</ThemedText>

            <FlatList
                data={tools}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.toolCard}>
                        <View style={styles.iconBadge}>
                            <Ionicons name="construct-outline" size={24} color="#0a7ea4" />
                        </View>
                        <View style={styles.toolInfo}>
                            <ThemedText style={styles.toolName}>{item.tool}</ThemedText>
                            <ThemedText style={styles.toolDate}>
                                Registrado: {new Date(item.created_at).toLocaleDateString()}
                            </ThemedText>
                        </View>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0a7ea4']}
                        tintColor={'#0a7ea4'}
                    />
                }
                ListEmptyComponent={
                    <ThemedText style={styles.emptyText}>No tienes herramientas asignadas.</ThemedText>
                }
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { marginBottom: 20, fontSize: 24 },
    toolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    iconBadge: {
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        padding: 10,
        borderRadius: 10,
        marginRight: 15,
    },
    toolInfo: { flex: 1 },
    toolName: { fontSize: 16, fontWeight: 'bold' },
    toolDate: { fontSize: 12, opacity: 0.6, marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 50, opacity: 0.5 }
});