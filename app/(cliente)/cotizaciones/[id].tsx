import React, {useEffect, useState} from 'react';
import {
    View,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Linking,
    ScrollView,
    Image,
    Modal,
    useColorScheme,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {formatDateTime} from '@/utils/date';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {Cotizacion} from "@/libs/types/cotizaciones";
import {supabase} from "@/libs/supabase";
import {ApelacionModal} from "@/components/cotizaciones/apelacion-modal";
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
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
    };
};

export default function QuoteDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, surfaceBg, borderColor} = useAppTheme();
    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isImageZoomVisible, setImageZoomVisible] = useState(false);
    const [profile, setProfile] = useState<{ name: string } | null>(null);
    const [showApelacion, setShowApelacion] = useState(false);

    useEffect(() => {
        loadQuote();
    }, [id]);

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

    const loadQuote = async () => {
        try {
            const [quoteData] = await Promise.all([
                cotizacionesService.getCotizacionDetails(id as string),
                fetchProfile()
            ]);
            if (quoteData && quoteData.length > 0) setQuote(quoteData[0]);
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pendiente')) return '#FF9500';
        if (s.includes('enviada') || s.includes('proceso')) return COLORS.primary;
        if (s.includes('aceptada') || s.includes('terminado')) return COLORS.success;
        return '#FF3B30';
    };

    const handleDecision = async (status: 'Aceptada' | 'Rechazada') => {
        const isAccept = status === 'Aceptada';
        const titleMsg = isAccept ? "Ha aceptado la Cotización" : "Ha rechazado la Cotización";
        const bodyMsg = isAccept
            ? `${profile?.name || 'Un cliente'} ha aceptado la cotización para: ${quote?.servicio}`
            : `${profile?.name || 'Un cliente'} ha rechazado la cotización para: ${quote?.servicio}`;

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
                            const {error: funcError} = await supabase.functions.invoke('send-to-admins', {
                                body: {
                                    role: 'owner',
                                    title: `${profile?.name || 'Un cliente'} ${titleMsg}`,
                                    body: bodyMsg,
                                    data: {quoteId: quote?.id},
                                }
                            });
                            if (funcError) console.error('Error enviando notificación:', funcError);
                            await loadQuote();
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
                            const {error: funcError} = await supabase.functions.invoke('send-to-admins', {
                                body: {
                                    role: 'owner',
                                    title: `${profile?.name || 'Un cliente'} Ha cancelado la Cotización`,
                                    body: `${profile?.name || 'Un cliente'} ha cancelado la cotización para: ${quote?.servicio}`,
                                    data: {quoteId: quote?.id},
                                }
                            });
                            if (funcError) console.error('Error enviando notificación:', funcError);
                            await loadQuote();
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

    if (loading) return (
        <ThemedView style={G.center}>
            <ActivityIndicator size="large" color={COLORS.primary}/>
        </ThemedView>
    );

    if (!quote) return (
        <ThemedView style={G.center}>
            <ThemedText>No se encontró información.</ThemedText>
        </ThemedView>
    );

    const isAcceptedOrFinished =
        quote.estado.toLowerCase().includes('aceptada') ||
        quote.estado.toLowerCase().includes('terminado');
    const canDelete = !isAcceptedOrFinished;

    return (
        <ThemedView style={G.flex1}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[G.scrollContent, {padding: 25}]}>
                {/* Header */}
                <View style={{marginBottom: 25}}>
                    <View style={[G.rowBetween, {marginBottom: 12}]}>
                        <View style={[G.statusRow, G.badgeLg, {backgroundColor: `${getStatusColor(quote.estado)}15`}]}>
                            <View style={[G.statusDot, {backgroundColor: getStatusColor(quote.estado)}]}/>
                            <ThemedText style={[G.badgeText, {color: getStatusColor(quote.estado)}]}>
                                {quote.estado.toUpperCase()}
                            </ThemedText>
                        </View>
                        {canDelete && (
                            <TouchableOpacity style={[G.iconBadgeSm, {backgroundColor: 'rgba(255,59,48,0.1)'}]}
                                              onPress={handleDelete} disabled={actionLoading}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30"/>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ThemedText type="title" style={[G.pageTitle, {
                        fontSize: 28,
                        lineHeight: 34,
                        marginBottom: 4,
                        color: textColor
                    }]}>
                        {quote.servicio}
                    </ThemedText>
                    <ThemedText style={[G.infoValueSm, {color: mutedText, letterSpacing: 1}]}>
                        Ticket #{id?.toString().slice(-6).toUpperCase()}
                    </ThemedText>
                </View>

                <View style={[G.card, {backgroundColor: cardBg, borderColor, marginBottom: 30}, shadow.sm]}>
                    <DetailRow icon="location-sharp" label="Dirección" value={quote.direccion || 'Sin dirección'}/>
                    <View style={G.dividerH}/>
                    <DetailRow icon="time" label="Programado" value={formatDateTime(quote.fecha_preferida)}/>
                </View>

                <View style={{marginBottom: 30}}>
                    <ThemedText type="defaultSemiBold" style={[G.sectionTitle, {marginBottom: 12, color: textColor}]}>
                        Descripción del problema
                    </ThemedText>
                    <View style={[G.cardSurface, {borderLeftWidth: 4, borderLeftColor: COLORS.primary, padding: 16}]}>
                        <ThemedText style={[G.infoValue, {lineHeight: 24, opacity: 0.8, color: mutedText}]}>
                            {quote.descripcion}
                        </ThemedText>
                    </View>
                </View>

                {/* Evidencia */}
                {quote.evidencia_url && (
                    <View style={{marginBottom: 30}}>
                        <ThemedText type="defaultSemiBold"
                                    style={[G.sectionTitle, {marginBottom: 12, color: textColor}]}>
                            Evidencia visual
                        </ThemedText>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setImageZoomVisible(true)}
                            style={[G.imageContainer, {height: 200}]}
                        >
                            <Image source={{uri: quote.evidencia_url}} style={G.imageFull}/>
                            <View style={[{
                                position: 'absolute',
                                bottom: 15,
                                right: 15,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                padding: 8,
                                borderRadius: 12
                            }]}>
                                <Ionicons name="expand" size={18} color="#FFF"/>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {quote.estado === 'Pendiente' && !actionLoading && (
                    <View style={[G.row, {gap: 12, marginTop: 1}]}>
                        <ThemedText style={[G.infoValueSm, {color: mutedText, letterSpacing: 1, fontSize: 12}]}>Ya hemos recibido tu solicitud, por favor, espera a que te enviemos tu cotización</ThemedText>
                    </View>
                )}

                {quote.pdf_url && (
                    <TouchableOpacity
                        style={[G.card, {
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,59,48,0.05)',
                            borderColor: 'rgba(255,59,48,0.1)',
                            marginBottom: 30
                        }]}
                        onPress={() => Linking.openURL(quote.pdf_url!)}
                    >
                        <View style={[G.iconBadgeLg, {backgroundColor: 'rgba(255,255,255,0.15)'}]}>
                            <Ionicons name="document-text" size={24} color="#FF3B30"/>
                        </View>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <ThemedText type="defaultSemiBold">Presupuesto formal.pdf</ThemedText>
                            <ThemedText style={[G.infoValueSm, {color: mutedText, marginTop: 2}]}>Toca para descargar y
                                revisar</ThemedText>
                        </View>
                        <Ionicons name="download-outline" size={20} color={mutedText}/>
                    </TouchableOpacity>
                )}

                {/* Acciones principal (Aceptar/Rechazar) */}
                {quote.estado === 'Enviada' && !actionLoading && (
                    <View style={[G.row, {gap: 12, marginTop: 24}]}>
                        <TouchableOpacity
                            style={[G.btnDanger, {flex: 1, padding: 20}]}
                            onPress={() => handleDecision('Rechazada')}
                        >
                            <ThemedText style={G.btnTextDanger}>Rechazar</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[G.btnPrimary, {flex: 2, padding: 20}]}
                            onPress={() => handleDecision('Aceptada')}
                        >
                            <ThemedText style={G.btnText}>Aceptar</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Botón apelación */}
                {quote.estado === 'Enviada' && quote.costo_estimado && (
                    <TouchableOpacity
                        style={[
                            G.btnOutlinePrimary,
                            {
                                marginTop: 16,
                                borderStyle: 'solid',
                                backgroundColor: 'rgba(21,101,192,0.08)',
                                borderColor: 'rgba(21,101,192,0.2)'
                            },
                            quote.apelacion_estado === 'cerrada_sin_acuerdo' && {
                                backgroundColor: 'rgba(142,142,147,0.08)',
                                borderColor: 'rgba(142,142,147,0.2)'
                            }
                        ]}
                        onPress={() => setShowApelacion(true)}
                    >
                        <Ionicons
                            name={quote.apelacion_estado === 'activa' ? 'chatbubbles' : 'chatbubbles-outline'}
                            size={18}
                            color={quote.apelacion_estado === 'cerrada_sin_acuerdo' ? mutedText : '#1565C0'}
                        />
                        <ThemedText style={[
                            {
                                color: quote.apelacion_estado === 'cerrada_sin_acuerdo' ? mutedText : '#1565C0',
                                fontWeight: '700',
                                fontSize: 15
                            },
                            quote.apelacion_estado === 'cerrada_sin_acuerdo' && {color: mutedText}
                        ]}>
                            {quote.apelacion_estado === 'activa'
                                ? 'Apelación en curso'
                                : quote.apelacion_estado === 'cerrada_sin_acuerdo'
                                    ? 'Ver apelación cerrada'
                                    : quote.apelacion_usada
                                        ? 'Ver historial de apelación'
                                        : 'Apelar precio'}
                        </ThemedText>
                    </TouchableOpacity>
                )}

                {actionLoading && <ActivityIndicator color={COLORS.primary} style={{marginTop: 30}}/>}
                <View style={{height: 40}}/>
            </ScrollView>

            <Modal visible={isImageZoomVisible} transparent={true} animationType="fade">
                <View style={[G.modalOverlay, {backgroundColor: '#000', justifyContent: 'center'}]}>
                    <TouchableOpacity style={[G.closeModalBtn, {top: 50, right: 25}]}
                                      onPress={() => setImageZoomVisible(false)}>
                        <Ionicons name="close" size={30} color="#FFF"/>
                    </TouchableOpacity>
                    <Image source={{uri: quote.evidencia_url || ''}} style={{width: '100%', height: '80%'}}
                           resizeMode="contain"/>
                </View>
            </Modal>

            <ApelacionModal
                visible={showApelacion}
                onClose={() => setShowApelacion(false)}
                cotizacionId={quote.id}
                costoActual={quote.costo_estimado ?? '0'}
                apelacionUsada={quote.apelacion_usada ?? false}
                apelacionEstado={quote.apelacion_estado ?? null}
                onPrecioAceptado={(nuevoPrecio) => {
                    setQuote(prev => prev ? {
                        ...prev,
                        costo_estimado: nuevoPrecio.toString(),
                        estado: 'Aceptada',
                        en_apelacion: false,
                        apelacion_estado: 'aceptada',
                    } : prev);
                }}
            />
        </ThemedView>
    );
}

function DetailRow({icon, label, value}: { icon: any; label: string; value: string }) {
    const {mutedText, textColor} = useAppTheme();
    return (
        <View style={G.infoRow}>
            <View style={[G.iconBadgeSm, {backgroundColor: COLORS.primaryBgMedium}]}>
                <Ionicons name={icon} size={18} color={COLORS.primary}/>
            </View>
            <View style={G.infoTextGroup}>
                <ThemedText style={G.infoLabel}>{label}</ThemedText>
                <ThemedText type="defaultSemiBold" style={[G.infoValue, {color: textColor}]}>{value}</ThemedText>
            </View>
        </View>
    );
}