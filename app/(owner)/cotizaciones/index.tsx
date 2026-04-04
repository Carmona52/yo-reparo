import React, {useState, useEffect, useCallback} from "react";
import {StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

import {Cotizacion} from "@/libs/types/cotizaciones";
import {cotizacionesService} from "@/libs/users/get-cotizacioes"; // Usaremos el mismo servicio pero podrías tener uno de admin
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";

export default function OwnerCotizacionesScreen() {
    const router = useRouter();
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

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pendiente') return {color: '#FFCC00', bg: '#FFF9E6'};
        if (s === 'enviada') return {color: '#007AFF', bg: '#E6F4FE'};
        if (s === 'aceptada') return {color: '#4CD964', bg: '#EAFBEA'};
        return {color: '#8e8e93', bg: '#f2f2f2'};
    };

    const renderItem = ({item}: { item: Cotizacion }) => {
        const style = getStatusStyle(item.estado);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({
                    pathname:"/(owner)/cotizaciones/[id]" as any,
                    params: {id: item.id},
                })}>
                <View style={styles.cardHeader}>
                    <View style={[styles.badge, {backgroundColor: style.bg}]}>
                        <ThemedText style={[styles.badgeText, {color: style.color}]}>
                            {item.estado.toUpperCase()}
                        </ThemedText>
                    </View>
                    <ThemedText style={styles.dateText}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </ThemedText>
                </View>

                <ThemedText type="defaultSemiBold" style={styles.title}>{item.servicio}</ThemedText>

                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#666"/>
                    <ThemedText style={styles.locationText} numberOfLines={1}>
                        {item.direccion}
                    </ThemedText>
                </View>

                <View style={styles.footer}>
                    <ThemedText style={styles.clientName}>Cliente ID: {item.created_by.slice(0, 8)}...</ThemedText>
                    <Ionicons name="chevron-forward" size={18} color="#007AFF"/>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <View style={styles.header}>
                    <ThemedText type="title">Cotizaciones Recibidas</ThemedText>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#007AFF"/></View>
                ) : (
                    <FlatList
                        data={cotizaciones}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)}/>}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <ThemedText style={{opacity: 0.5}}>No hay solicitudes pendientes.</ThemedText>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {padding: 20},
    subtitle: {opacity: 0.5, fontSize: 14},
    list: {padding: 20},
    card: {
        backgroundColor: 'rgba(150,150,150,0.05)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
    },
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
    badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8},
    badgeText: {fontSize: 10, fontWeight: '800'},
    dateText: {fontSize: 12, opacity: 0.5},
    title: {fontSize: 17, marginBottom: 5},
    locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12},
    locationText: {fontSize: 13, opacity: 0.6, flex: 1},
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150,150,150,0.1)'
    },
    clientName: {fontSize: 12, opacity: 0.5},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50}
});