import {useEffect, useState, useCallback} from 'react';
import {FlatList, ActivityIndicator, View, RefreshControl, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {TouchableOpacity} from 'react-native';

import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {getTools} from "@/libs/workers/tools";
import {Tools} from "@/libs/types/tools";
import {G, COLORS, shadow} from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        borderColor: COLORS.border,
    };
};

export default function HerramientasPage() {
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg} = useAppTheme();
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
            <ThemedView style={G.center}>
                <ActivityIndicator size="large" color={COLORS.primary}/>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                {/* Header con botón de regreso */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                    gap: 10
                }}>
                    <TouchableOpacity onPress={() => router.back()} style={G.backBtnPlain}>
                        <Ionicons name="chevron-back" size={28} color={textColor}/>
                    </TouchableOpacity>
                    <ThemedText type="title" style={G.pageTitleSm}>Mis Herramientas</ThemedText>
                </View>

                <FlatList
                    data={tools}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={G.pageContent}
                    renderItem={({item}) => (
                        <View style={[G.card, {backgroundColor: cardBg, marginBottom: 12}, shadow.sm]}>
                            <View style={[G.row, {alignItems: 'center'}]}>
                                <View style={[G.iconBadge, {backgroundColor: COLORS.primaryBgMedium, marginRight: 15}]}>
                                    <Ionicons name="hammer" size={22} color={COLORS.primary}/>
                                </View>
                                <View style={G.flex1}>
                                    <ThemedText type="defaultSemiBold"
                                                style={[G.infoValue, {marginBottom: 4, color: textColor}]}>
                                        {item.tool}
                                    </ThemedText>
                                    <View style={[G.row, {gap: 5}]}>
                                        <Ionicons name="calendar-outline" size={12} color={mutedText}/>
                                        <ThemedText style={[G.infoValueSm, {color: mutedText}]}>
                                            Recibida: {new Date(item.created_at).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={{alignItems: 'flex-end', gap: 4}}>
                                    <View style={[G.statusDot, {backgroundColor: COLORS.success}]}/>
                                    <ThemedText style={{
                                        fontSize: 9,
                                        fontWeight: '800',
                                        color: COLORS.success,
                                        textTransform: 'uppercase'
                                    }}>
                                        En uso
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={[G.emptyContainer, {marginTop: 100, paddingHorizontal: 40}]}>
                            <Ionicons name="hammer-outline" size={60} color={COLORS.mutedIcon}
                                      style={{marginBottom: 15}}/>
                            <ThemedText style={[G.emptyText, {color: mutedText}]}>
                                No tienes herramientas asignadas en este momento.
                            </ThemedText>
                        </View>
                    }
                />
            </SafeAreaView>
        </ThemedView>
    );
}