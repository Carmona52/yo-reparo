import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
    FlatList,
    RefreshControl,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    useColorScheme, ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getWorkerJobs} from "@/libs/workers/get-jobs";
import {Job} from "@/libs/types/job";
import {G, COLORS, shadow} from "@/styles/global-styles";
import {CreateJobModal} from "@/components/modals/owner/create-job";

const STATUS_OPTIONS = ['Todos', 'en proceso', 'pendiente', 'finalizado'];

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
    };
};

export default function JobsScreen() {
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, inputBg, borderColor} = useAppTheme();

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
            'en proceso': COLORS.primary,
            'finalizado': COLORS.success,
            'default': mutedText
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
            <View style={[G.card, { backgroundColor: cardBg, borderColor: borderColor, marginBottom:8 }, shadow.sm]}>
                <View style={[G.rowBetween, { marginBottom: 12 }]}>
                    <ThemedText type="defaultSemiBold" style={[G.infoValue, { flex: 1, marginRight: 10, color: textColor }]} numberOfLines={1}>
                        {item.title}
                    </ThemedText>
                    <View style={[G.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <ThemedText style={G.badgeTextWhite}>{item.status}</ThemedText>
                    </View>
                </View>

                <View style={[G.row, { gap: 6, marginBottom: 15 }]}>
                    <Ionicons name="person-sharp" size={14} color={mutedText} />
                    <ThemedText style={[G.infoValueSm, { flex: 1, color: mutedText }]} numberOfLines={1}>
                        {
                            item.name_client && item.name_client.length > 0
                                ? item.name_client
                                : item.profiles?.name
                        }
                    </ThemedText>
                </View>
                <View style={[G.row, { gap: 6, marginBottom: 15 }]}>
                    <Ionicons name="location-outline" size={14} color={mutedText} />
                    <ThemedText style={[G.infoValueSm, { flex: 1, color: mutedText }]} numberOfLines={1}>
                        {item.address}
                    </ThemedText>
                </View>

                <View style={[G.rowBetween, { paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle, gap: 5 }]}>
                    <ThemedText style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Ver detalles</ThemedText>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                {/* Header fijo */}
                <View style={G.pageHeader}>
                    <ThemedText type="title" style={[G.pageTitle, { color: textColor }]}>Trabajos</ThemedText>

                    <View style={[G.searchContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
                        <Ionicons name="search" size={18} color={mutedText} />
                        <TextInput
                            placeholder="Buscar por nombre o dirección..."
                            placeholderTextColor={mutedText}
                            style={[G.searchInput, { color: textColor }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={mutedText} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filtros horizontales */}
                <View style={G.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={G.filterContainer}
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setSelectedStatus(status)}
                                style={[
                                    G.filterChip,
                                    selectedStatus === status && G.filterChipActive
                                ]}>
                                <ThemedText style={[
                                    G.filterText,
                                    selectedStatus === status && G.filterTextActive,
                                ]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Lista principal */}
                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderJobItem}
                    contentContainerStyle={[G.pageContent, { paddingBottom: 100 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={G.emptyContainer}>
                                <View style={G.emptyIconCircle}>
                                    <Ionicons name="clipboard-outline" size={40} color={COLORS.primary} />
                                </View>
                                <ThemedText style={[G.emptyText, { color: mutedText }]}>
                                    {searchQuery || selectedStatus !== 'Todos'
                                        ? "No hay resultados para esta búsqueda."
                                        : "No hay trabajos registrados."}
                                </ThemedText>
                            </View>
                        ) : (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
                        )
                    }
                />



            </SafeAreaView>
        </ThemedView>
    );
}