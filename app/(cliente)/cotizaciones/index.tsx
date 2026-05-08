import React, {useState, useEffect, useCallback} from "react";
import {
    View,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    useColorScheme,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

import {Cotizacion} from "@/libs/types/cotizaciones";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {CreateQuoteModal} from "@/components/modals/cliente/soliicitar-cotizacion";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
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

export default function CotizacionesScreen() {
    const router = useRouter();
    const {textColor, mutedText, cardBg, borderColor} = useAppTheme();
    const [isModalVisible, setModalVisible] = useState(false);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await cotizacionesService.getMyCotizaciones();
            setCotizaciones(data || []);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron obtener las cotizaciones');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    const getStatusTheme = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pendiente')) return {color: '#FF9500', label: 'Pendiente'};
        if (s.includes('enviada') || s.includes('proceso')) return {color: COLORS.primary, label: 'En Proceso'};
        if (s.includes('aceptada') || s.includes('terminado')) return {color: COLORS.success, label: 'Aceptada'};
        if (s.includes('rechazada')) return {color: '#FF3B30', label: 'Cancelado'};
        return {color: mutedText, label: status};
    };

    const renderItem = ({item}: { item: Cotizacion }) => {
        const theme = getStatusTheme(item.estado);
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({
                    pathname: "/(cliente)/cotizaciones/[id]" as any,
                    params: {id: item.id}
                })}
                style={{marginBottom: 16}}
            >
                <ThemedView style={[G.card, {backgroundColor: cardBg, borderColor}, shadow.sm]}>
                    <View style={G.row}>
                        <View style={[G.iconBadge, {backgroundColor: `${theme.color}15`}]}>
                            <Ionicons name="settings-outline" size={20} color={theme.color}/>
                        </View>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <ThemedText type="defaultSemiBold"
                                        style={[G.infoValue, {fontSize: 17, fontWeight: '700', color: textColor}]}
                                        numberOfLines={1}>
                                {item.servicio || "Servicio Técnico"}
                            </ThemedText>
                            <ThemedText style={{fontSize: 12, opacity: 0.4, marginTop: 2, color: mutedText}}>
                                {new Date(item.created_at).toLocaleDateString('es-ES', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                })}
                            </ThemedText>
                        </View>
                        <View style={[G.badgeLg, {backgroundColor: `${theme.color}12`}]}>
                            <View style={[G.statusDot, {marginRight: 6, backgroundColor: theme.color}]}/>
                            <ThemedText style={[G.badgeText, {color: theme.color}]}>
                                {theme.label.toUpperCase()}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={G.dividerH}/>

                    <View style={G.rowBetween}>
                        <View>
                            <ThemedText style={G.infoLabel}>Presupuesto estimado</ThemedText>
                            <ThemedText type="subtitle" style={[G.infoValue, {
                                fontSize: 20,
                                color: COLORS.primary,
                                fontWeight: '800',
                                marginTop: 2
                            }]}>
                                {item.costo_estimado ? `$${item.costo_estimado}` : 'Pendiente'}
                            </ThemedText>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: `${COLORS.primary}1A`,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 10
                        }}>
                            <ThemedText
                                style={{fontSize: 13, color: COLORS.primary, fontWeight: '600', marginRight: 4}}>
                                Ver detalle
                            </ThemedText>
                            <Ionicons name="chevron-forward" size={14} color={COLORS.primary}/>
                        </View>
                    </View>
                </ThemedView>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <View style={G.pageHeaderRow}>
                    <View>
                        <ThemedText type="title" style={[G.pageTitle, {
                            marginBottom: 0,
                            fontSize: 28,
                            fontWeight: '800',
                            color: textColor
                        }]}>
                            Cotizaciones
                        </ThemedText>
                        <ThemedText style={[G.pageSubtitle, {color: mutedText}]}>
                            Gestiona tus solicitudes
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[G.btnCircle, shadow.primaryLg]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={28} color={COLORS.onPrimary}/>
                    </TouchableOpacity>
                </View>

                {loading && !refreshing ? (
                    <View style={G.center}>
                        <ActivityIndicator size="large" color={COLORS.primary}/>
                    </View>
                ) : (
                    <FlatList
                        data={cotizaciones}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={G.pageContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary}/>
                        }
                        ListEmptyComponent={
                            <View style={G.emptyContainer}>
                                <View style={G.emptyIconCircle}>
                                    <Ionicons name="document-text-outline" size={50} color={COLORS.primary}/>
                                </View>
                                <ThemedText type="subtitle">No hay solicitudes</ThemedText>
                                <ThemedText style={[G.emptyText, {color: mutedText}]}>
                                    Cuando solicites un presupuesto para tu equipo, aparecerá en esta lista.
                                </ThemedText>
                                <TouchableOpacity
                                    style={G.emptyBtn}
                                    onPress={() => setModalVisible(true)}>
                                    <ThemedText style={G.btnText}>Nueva Solicitud</ThemedText>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            <CreateQuoteModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onSuccess={() => {
                    setModalVisible(false);
                    loadData(true);
                }}
            />
        </ThemedView>
    );
}