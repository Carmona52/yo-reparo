import React, {useState, useEffect, useCallback} from "react";
import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Platform
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from "expo-router";

import {Cotizacion} from "@/libs/types/cotizaciones";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {CreateQuoteModal} from "@/components/modals/cliente/soliicitar-cotizacion";
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";

export default function CotizacionesScreen() {
    const router = useRouter();
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
        if (s.includes('enviada') || s.includes('proceso')) return {color: '#007AFF', label: 'En Proceso'};
        if (s.includes('aceptada') || s.includes('terminado')) return {color: '#34C759', label: 'Aceptada'};
        if (s.includes('rechazada')) return {color: '#FF3B30', label: 'Cancelado'};
        return {color: '#8E8E93', label: status};
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
                style={styles.cardContainer}
            >
                {/* USAMOS THEMEDVIEW PARA LA TARJETA */}
                <ThemedView style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, {backgroundColor: `${theme.color}15`}]}>
                            <Ionicons name="settings-outline" size={20} color={theme.color}/>
                        </View>
                        <View style={styles.titleArea}>
                            <ThemedText type="defaultSemiBold" style={styles.serviceTitle} numberOfLines={1}>
                                {item.servicio || "Servicio Técnico"}
                            </ThemedText>
                            <ThemedText style={styles.dateText}>
                                {new Date(item.created_at).toLocaleDateString('es-ES', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                })}
                            </ThemedText>
                        </View>
                        <View style={[styles.statusBadge, {backgroundColor: `${theme.color}12`}]}>
                            <View style={[styles.statusDot, {backgroundColor: theme.color}]}/>
                            {/* Usamos ThemedText o Text con color manual ya que depende del estado */}
                            <ThemedText style={[styles.statusText, {color: theme.color}]}>
                                {theme.label.toUpperCase()}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.cardDivider}/>

                    <View style={styles.cardFooter}>
                        <View>
                            <ThemedText style={styles.priceLabel}>Presupuesto estimado</ThemedText>
                            <ThemedText type="subtitle" style={styles.priceValue}>
                                {item.costo_estimado ? `$${item.costo_estimado}` : 'Pendiente'}
                            </ThemedText>
                        </View>
                        <View style={styles.detailsButton}>
                            <ThemedText style={styles.detailsText}>Ver detalle</ThemedText>
                            <Ionicons name="chevron-forward" size={14} color="#007AFF"/>
                        </View>
                    </View>
                </ThemedView>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.mainContainer}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <View style={styles.header}>
                    <View>
                        <ThemedText type="title" style={styles.headerTitle}>Cotizaciones</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Gestiona tus solicitudes</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={styles.headerAddBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={28} color="#FFF"/>
                    </TouchableOpacity>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#007AFF"/>
                    </View>
                ) : (
                    <FlatList
                        data={cotizaciones}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF"/>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconCircle}>
                                    <Ionicons name="document-text-outline" size={50} color="#007AFF"/>
                                </View>
                                <ThemedText type="subtitle">No hay solicitudes</ThemedText>
                                <ThemedText style={styles.emptyText}>
                                    Cuando solicites un presupuesto para tu equipo, aparecerá en esta lista.
                                </ThemedText>
                                <TouchableOpacity
                                    style={styles.emptyButton}
                                    onPress={() => setModalVisible(true)}>
                                    <ThemedText style={styles.emptyButtonText}>Nueva Solicitud</ThemedText>
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

const styles = StyleSheet.create({
    mainContainer: {flex: 1},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    headerTitle: {fontSize: 28, fontWeight: '800'},
    headerSubtitle: {fontSize: 14, opacity: 0.5, marginTop: -2},
    headerAddBtn: {
        backgroundColor: '#007AFF',
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {shadowColor: '#007AFF', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8},
            android: {elevation: 4},
        }),
    },
    listContainer: {paddingHorizontal: 20, paddingBottom: 40},
    cardContainer: {
        marginBottom: 16,
    },
    card: {
        // Quitamos colores estáticos (blanco o gris fijo)
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.15)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.05,
                shadowRadius: 10
            },
            android: {elevation: 3},
        }),
    },
    cardHeader: {flexDirection: 'row', alignItems: 'center'},
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleArea: {flex: 1, marginLeft: 12},
    serviceTitle: {fontSize: 17, fontWeight: '700'},
    dateText: {fontSize: 12, opacity: 0.4, marginTop: 2},
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusDot: {width: 6, height: 6, borderRadius: 3, marginRight: 6},
    statusText: {fontSize: 10, fontWeight: '800', letterSpacing: 0.5},
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        marginVertical: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5},
    priceValue: {fontSize: 20, color: '#007AFF', fontWeight: '800', marginTop: 2},
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    detailsText: {fontSize: 13, color: '#007AFF', fontWeight: '600', marginRight: 4},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    emptyContainer: {alignItems: 'center', marginTop: 60, paddingHorizontal: 40},
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {marginTop: 10, opacity: 0.5, textAlign: 'center', lineHeight: 20, marginBottom: 30},
    emptyButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 18,
    },
    emptyButtonText: {color: '#FFF', fontWeight: '700', fontSize: 16},
});