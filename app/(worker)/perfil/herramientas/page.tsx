import {useEffect, useState, useCallback} from 'react';
import {
    StyleSheet, FlatList, ActivityIndicator, View,
    RefreshControl, useColorScheme, Platform
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {TouchableOpacity} from 'react-native';

import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {getTools} from "@/libs/workers/tools";
import {Tools} from "@/libs/types/tools";

export default function HerramientasPage() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
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
                <ActivityIndicator size="large" color="#0a7ea4"/>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                {/* Header con botón de regreso */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={isDark ? "#fff" : "#333"}/>
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.title}>Mis Herramientas</ThemedText>
                </View>

                <FlatList
                    data={tools}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({item}) => (
                        <View style={[styles.toolCard, {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff'}]}>
                            <View style={styles.iconBadge}>
                                <Ionicons name="hammer" size={22} color="#0a7ea4"/>
                            </View>
                            <View style={styles.toolInfo}>
                                <ThemedText type="defaultSemiBold" style={styles.toolName}>{item.tool}</ThemedText>
                                <View style={styles.dateRow}>
                                    <Ionicons name="calendar-outline" size={12} color={isDark ? "#aaa" : "#666"}/>
                                    <ThemedText style={styles.toolDate}>
                                        Recibida: {new Date(item.created_at).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                    </ThemedText>
                                </View>
                            </View>
                            <View style={styles.statusIndicator}>
                                <View style={styles.dot}/>
                                <ThemedText style={styles.statusText}>En uso</ThemedText>
                            </View>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={'#0a7ea4'}
                            colors={['#0a7ea4']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="hammer-outline" size={60} color="#ccc" style={{marginBottom: 15}}/>
                            <ThemedText style={styles.emptyText}>No tienes herramientas asignadas en este
                                momento.</ThemedText>
                        </View>
                    }
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 10
    },
    backBtn: {width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start'},
    title: {fontSize: 24, fontWeight: 'bold'},
    listContent: {padding: 20, paddingBottom: 40},
    toolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
        ...Platform.select({
            ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5},
            android: {elevation: 2}
        })
    },
    iconBadge: {
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    toolInfo: {flex: 1},
    toolName: {fontSize: 16, marginBottom: 4},
    dateRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
    toolDate: {fontSize: 12, opacity: 0.5},

    statusIndicator: {alignItems: 'flex-end', gap: 4},
    dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981'},
    statusText: {fontSize: 9, fontWeight: '800', color: '#10b981', textTransform: 'uppercase'},

    emptyContainer: {alignItems: 'center', marginTop: 100, paddingHorizontal: 40},
    emptyText: {textAlign: 'center', opacity: 0.4, fontSize: 14, lineHeight: 20}
});