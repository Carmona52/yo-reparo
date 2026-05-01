import React, {useState, useEffect, useCallback} from "react";
import {View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, useColorScheme} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

import {Cotizacion} from "@/libs/types/cotizaciones";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {G, COLORS} from "@/styles/global-styles";

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

export default function OwnerCotizacionesScreen() {
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, borderColor} = useAppTheme();
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await cotizacionesService.getAllCotizaciones();
            setCotizaciones(data || []);
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar las solicitudes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    console.log(cotizaciones)

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pendiente') return {color: '#FFCC00', bg: '#FFF9E6'};
        if (s === 'enviada') return {color: '#007AFF', bg: '#E6F4FE'};
        if (s === 'aceptada') return {color: '#4CD964', bg: '#EAFBEA'};
        return {color: mutedText, bg: COLORS.surfaceStrong};
    };

    const renderItem = ({item}: { item: Cotizacion }) => {
        const style = getStatusStyle(item.estado);
        return (
            <TouchableOpacity
                style={[G.card, {backgroundColor: cardBg, borderColor: borderColor, marginBottom: 16}]}
                onPress={() => router.push({
                    pathname: "/(owner)/cotizaciones/[id]" as any,
                    params: {id: item.id},
                })}>
                <View style={[G.rowBetween, {marginBottom: 10}]}>
                    <View style={[G.badge, {backgroundColor: style.bg}]}>
                        <ThemedText style={[G.badgeText, {color: style.color}]}>
                            {item.estado.toUpperCase()}
                        </ThemedText>
                    </View>
                    <ThemedText style={{fontSize: 12, color: mutedText}}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </ThemedText>
                </View>

                <ThemedText type="defaultSemiBold"
                            style={[G.infoValue, {fontSize: 17, marginBottom: 5, color: textColor}]}>
                    {item.servicio}
                </ThemedText>

                <View style={[G.row, {gap: 5, marginBottom: 12}]}>
                    <Ionicons name="person-sharp" size={14} color={mutedText}/>
                    <ThemedText style={[G.infoValueSm, {flex: 1, color: mutedText}]} numberOfLines={1}>
                        {item.profiles?.name}
                    </ThemedText>
                </View>
                <View style={[G.row, {gap: 5, marginBottom: 12}]}>
                    <Ionicons name="location-outline" size={14} color={mutedText}/>
                    <ThemedText style={[G.infoValueSm, {flex: 1, color: mutedText}]} numberOfLines={1}>
                        {item.direccion}
                    </ThemedText>
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <View style={G.pageHeader}>
                    <ThemedText type="title" style={{color: textColor}}>Cotizaciones Recibidas</ThemedText>
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
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)}
                                                        tintColor={COLORS.primary}/>}
                        ListEmptyComponent={
                            <View style={[G.center, {marginTop: 50}]}>
                                <ThemedText style={{color: mutedText, opacity: 0.5}}>No hay solicitudes
                                    pendientes.</ThemedText>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </ThemedView>
    );
}