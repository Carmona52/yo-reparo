import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Linking,
    ScrollView,
    Image,
    Modal,
    Platform,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {Cotizacion} from "@/libs/types/cotizaciones";
import {sendNotificationByID} from "@/libs/notifications/send-notifications";
import {supabase} from "@/libs/supabase";

export default function QuoteDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isImageZoomVisible, setImageZoomVisible] = useState(false);
    const [profile, setProfile] = useState<{ name: string } | null>(null);

    useEffect(() => {
        loadQuote();
    }, [id]);

    const loadQuote = async () => {
        try {
            const data = await cotizacionesService.getCotizacionDetails(id as string);
            if (data && data.length > 0) {
                setQuote(data[0]);
            }
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pendiente')) return '#FF9500';
        if (s.includes('enviada') || s.includes('proceso')) return '#007AFF';
        if (s.includes('aceptada') || s.includes('terminado')) return '#34C759';
        return '#FF3B30';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "No especificada";
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone:'UTC'
        });
    };

    const fetchProfile = async () => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if (session) {
                const {data} = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', session.user.id)
                    .single();
                if (data) setProfile(data);
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleDecision = async (status: 'Aceptada' | 'Rechazada') => {
        const isAccept = status === 'Aceptada';
        Alert.alert(
            isAccept ? "Confirmar Presupuesto" : "Rechazar solicitud",
            isAccept ? "¿Deseas proceder con la reparación?" : "¿Estás seguro de rechazar esta cotización?",
            [
                {text: "Cancelar", style: "cancel"},
                {
                    text: isAccept ? "Aceptar" : "Rechazar",
                    style: isAccept ? "default" : "destructive",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await cotizacionesService.updateStatus(id as string, status);
                            supabase.functions.invoke('send-to-admins', {
                                body: {
                                    role: 'owner',
                                    title: `${profile?.name} Ha aceptado la Cotización`,
                                    body: `${profile?.name || 'Un cliente'} ha aceptado la cotización para: ${quote?.servicio}`,
                                    data: {
                                        quoteId: quote?.id,

                                    },
                                }
                            }).then(({error: funcError}) => {
                                if (funcError) console.error('Error enviando notificación:', funcError);
                                else console.log('Admins notificados correctamente');
                            });

                            loadQuote()
                            router.back();
                        } catch (e) {
                            Alert.alert("Error", "Ocurrió un problema al actualizar");
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            "Cancelar Solicitud",
            "¿Estás seguro de que deseas cancelar esta cotización?",
            [
                {text: "Volver", style: "cancel"},
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await cotizacionesService.updateStatus(id as string, 'Cancelada');
                            router.back();
                        } catch (e) {
                            Alert.alert("Error", "No se pudo cancelar.");
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator size="large"
                                                                             color="#007AFF"/></ThemedView>;
    if (!quote) return <ThemedView style={styles.center}><ThemedText>No se encontró
        información.</ThemedText></ThemedView>;

    const isAcceptedOrFinished = quote.estado.toLowerCase().includes('aceptada') || quote.estado.toLowerCase().includes('terminado');
    const canDelete = !isAcceptedOrFinished;

    return (
        <ThemedView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View style={[styles.statusBadge, {backgroundColor: `${getStatusColor(quote.estado)}15`}]}>
                            <View style={[styles.statusDot, {backgroundColor: getStatusColor(quote.estado)}]}/>
                            <ThemedText style={[styles.statusText, {color: getStatusColor(quote.estado)}]}>
                                {quote.estado.toUpperCase()}
                            </ThemedText>
                        </View>

                        {canDelete && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}
                                              disabled={actionLoading}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30"/>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ThemedText type="title" style={styles.mainTitle}>{quote.servicio}</ThemedText>
                    <ThemedText style={styles.quoteId}>Ticket #{id?.toString().slice(-6).toUpperCase()}</ThemedText>
                </View>

                <ThemedView style={styles.infoCard}>
                    <DetailRow icon="location-sharp" label="Dirección" value={quote.direccion || 'Sin dirección'}/>
                    <View style={styles.separator}/>
                    <DetailRow icon="time" label="Programado" value={formatDate(quote.fecha_preferida)}/>
                </ThemedView>

                <View style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Descripción del problema</ThemedText>
                    <View style={styles.descContainer}>
                        <ThemedText style={styles.descText}>{quote.descripcion}</ThemedText>
                    </View>
                </View>

                {quote.evidencia_url && (
                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Evidencia visual</ThemedText>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setImageZoomVisible(true)}
                                          style={styles.imageCard}>
                            <Image source={{uri: quote.evidencia_url}} style={styles.evidenceImage}/>
                            <View style={styles.zoomBadge}>
                                <Ionicons name="expand" size={18} color="#FFF"/>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {quote.pdf_url && (
                    <TouchableOpacity style={styles.pdfButton} onPress={() => Linking.openURL(quote.pdf_url!)}>
                        <View style={styles.pdfIconContainer}>
                            <Ionicons name="document-text" size={24} color="#FF3B30"/>
                        </View>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <ThemedText type="defaultSemiBold">Presupuesto formal.pdf</ThemedText>
                            <ThemedText style={styles.pdfSubtext}>Toca para descargar y revisar</ThemedText>
                        </View>
                        <Ionicons name="download-outline" size={20} color="#8E8E93"/>
                    </TouchableOpacity>
                )}

                <View style={styles.priceContainer}>
                    <ThemedText style={styles.priceLabel}>Costo estimado</ThemedText>
                    <ThemedText type="title" style={styles.priceValue}>
                        {quote.costo_estimado ? `$${quote.costo_estimado}` : 'Por definir'}
                    </ThemedText>
                </View>

                {quote.estado === 'Enviada' && !actionLoading && (
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.rejectButton} onPress={() => handleDecision('Rechazada')}>
                            <ThemedText style={styles.rejectText}>Rechazar</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptButton} onPress={() => handleDecision('Aceptada')}>
                            <ThemedText style={styles.acceptText}>Confirmar y Agendar</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {actionLoading && <ActivityIndicator color="#007AFF" style={{marginTop: 30}}/>}
                <View style={{height: 40}}/>
            </ScrollView>

            <Modal visible={isImageZoomVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setImageZoomVisible(false)}>
                        <Ionicons name="close" size={30} color="#FFF"/>
                    </TouchableOpacity>
                    <Image source={{uri: quote.evidencia_url || ''}} style={styles.fullImage} resizeMode="contain"/>
                </View>
            </Modal>
        </ThemedView>
    );
}

function DetailRow({icon, label, value}: { icon: any, label: string, value: string }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIconBg}>
                <Ionicons name={icon} size={18} color="#007AFF"/>
            </View>
            <View style={{flex: 1, marginLeft: 12}}>
                <ThemedText style={styles.detailLabel}>{label}</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.detailValue}>{value}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    scrollContent: {padding: 25},
    header: {marginBottom: 25},
    headerTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    statusDot: {width: 6, height: 6, borderRadius: 3, marginRight: 8},
    statusText: {fontSize: 11, fontWeight: '900', letterSpacing: 0.5},
    deleteButton: {padding: 8, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12},
    mainTitle: {fontSize: 28, fontWeight: '800', lineHeight: 34},
    quoteId: {fontSize: 13, opacity: 0.4, marginTop: 4, letterSpacing: 1},

    // TARJETA PRINCIPAL ADAPTABLE
    infoCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
        // Sombras suaves
        ...Platform.select({
            ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10},
            android: {elevation: 2}
        })
    },
    detailRow: {flexDirection: 'row', alignItems: 'center'},
    detailIconBg: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(0,122,255,0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    detailLabel: {fontSize: 11, opacity: 0.5, textTransform: 'uppercase'},
    detailValue: {fontSize: 15, marginTop: 1},
    separator: {height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: 15},

    section: {marginBottom: 30},
    sectionTitle: {fontSize: 16, marginBottom: 12},
    descContainer: {
        backgroundColor: 'rgba(150,150,150,0.05)',
        padding: 16, borderRadius: 16,
        borderLeftWidth: 4, borderLeftColor: '#007AFF'
    },
    descText: {fontSize: 15, lineHeight: 24, opacity: 0.8},
    imageCard: {borderRadius: 20, overflow: 'hidden', height: 200, backgroundColor: 'rgba(150,150,150,0.1)'},
    evidenceImage: {width: '100%', height: '100%'},
    zoomBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 12
    },

    // PDF ADAPTABLE
    pdfButton: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,59,48,0.05)',
        padding: 16, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,59,48,0.1)',
        marginBottom: 30
    },
    pdfIconContainer: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center'
    },
    pdfSubtext: {fontSize: 12, opacity: 0.5, marginTop: 2},

    // PRECIO
    priceContainer: {
        alignItems: 'center', paddingVertical: 20,
        backgroundColor: 'rgba(0,122,255,0.08)',
        borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#007AFF'
    },
    priceLabel: {fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1},
    priceValue: {fontSize: 32, fontWeight: '900', color: '#007AFF', marginTop: 5},

    // ACCIONES
    footerActions: {flexDirection: 'row', gap: 12, marginTop: 40},
    rejectButton: {
        flex: 1, padding: 20, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,59,48,0.1)'
    },
    rejectText: {color: '#FF3B30', fontWeight: '700'},
    acceptButton: {
        flex: 2, padding: 20, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#007AFF'
    },
    acceptText: {color: '#FFF', fontWeight: '700', fontSize: 16},
    modalOverlay: {flex: 1, backgroundColor: '#000', justifyContent: 'center'},
    closeBtn: {position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10},
    fullImage: {width: '100%', height: '80%'}
});