import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FlatList,
    RefreshControl,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getAllJobs } from "@/libs/owner/jobs/get-jobs";
import { Job } from "@/libs/types/job";
import { CreateJobModal } from "@/components/modals/owner/create-job";
import { G, COLORS, shadow } from "@/styles/global-styles";

const STATUS_OPTIONS = ['Todos', 'pendiente', 'en proceso', 'finalizado'];

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
    const { isDark, textColor, cardBg, inputBg, mutedText, borderColor } = useAppTheme();

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
            case 'pendiente': return '#f59e0b';
            case 'en proceso': return COLORS.primary;
            case 'finalizado': return COLORS.success;
            default: return mutedText;
        }
    };

    const renderJobItem = ({ item }: { item: Job }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: "/jobs/[id]",
                params: { id: item.id }
            } as any)}>
            <View style={[G.card, { backgroundColor: cardBg, borderColor: borderColor }, shadow.sm]}>
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
                        {item.profiles?.name}
                    </ThemedText>
                </View><View style={[G.row, { gap: 6, marginBottom: 15 }]}>
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

                <CreateJobModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => fetchData(true)}
                />

                <TouchableOpacity
                    style={[G.fab, shadow.primaryLg]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={30} color={COLORS.onPrimary} />
                </TouchableOpacity>
            </SafeAreaView>
        </ThemedView>
    );
}