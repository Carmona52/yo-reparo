import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, StyleSheet,
    KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/supabase';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface Mensaje {
    id: string;
    sender_role: 'cliente' | 'admin';
    content: string;
    precio_propuesto: number | null;
    created_at: string;
}

interface ApelacionModalProps {
    visible: boolean;
    onClose: () => void;
    cotizacionId: string;
    costoActual: string;
    apelacionUsada: boolean;           // ya agotó su única apelación
    apelacionEstado: string | null;    // NULL | 'activa' | 'aceptada' | 'cerrada_sin_acuerdo'
    onPrecioAceptado: (nuevoPrecio: number) => void;
}

export const ApelacionModal = ({
                                   visible, onClose, cotizacionId, costoActual,
                                   apelacionUsada, apelacionEstado, onPrecioAceptado,
                               }: ApelacionModalProps) => {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [iniciando, setIniciando] = useState(false);
    const [estadoLocal, setEstadoLocal] = useState(apelacionEstado);
    const [ultimaPropuesta, setUltimaPropuesta] = useState<number | null>(null);
    const scrollRef = useRef<ScrollView>(null);
    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        setEstadoLocal(apelacionEstado);
    }, [apelacionEstado]);

    useEffect(() => {
        if (!visible) return;

        const cargar = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('cotizacion_mensajes')
                .select('*')
                .eq('cotizacion_id', cotizacionId)
                .order('created_at', { ascending: true });

            const msgs = data ?? [];
            setMensajes(msgs);

            // Última propuesta del admin
            const propuestas = msgs.filter(m => m.precio_propuesto !== null);
            if (propuestas.length > 0)
                setUltimaPropuesta(propuestas[propuestas.length - 1].precio_propuesto);

            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 150);
        };

        cargar();

        // Realtime: nuevos mensajes y cambios en la cotización
        const chatChannel = supabase
            .channel(`apelacion-chat-${cotizacionId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public',
                table: 'cotizacion_mensajes',
                filter: `cotizacion_id=eq.${cotizacionId}`,
            }, (payload) => {
                const nuevo = payload.new as Mensaje;
                setMensajes(prev => [...prev, nuevo]);
                if (nuevo.precio_propuesto) setUltimaPropuesta(nuevo.precio_propuesto);
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            })
            .subscribe();

        // Realtime: si el admin cierra la apelación
        const statusChannel = supabase
            .channel(`apelacion-status-${cotizacionId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public',
                table: 'cotizaciones',
                filter: `id=eq.${cotizacionId}`,
            }, (payload) => {
                const nuevo = payload.new as any;
                if (nuevo.apelacion_estado) setEstadoLocal(nuevo.apelacion_estado);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(chatChannel);
            supabase.removeChannel(statusChannel);
        };
    }, [visible, cotizacionId]);

    const iniciarApelacion = async () => {
        setIniciando(true);
        try {
            await supabase.from('cotizaciones').update({
                en_apelacion: true,
                apelacion_usada: true,
                apelacion_estado: 'activa',
            }).eq('id', cotizacionId);

            await supabase.functions.invoke('send-to-admins', {
                body: {
                    role: 'owner',
                    title: '⚖️ Nueva Apelación de Precio',
                    body: 'Un cliente está apelando el costo de su cotización.',
                    data: { quoteId: cotizacionId, type: 'apelacion' },
                },
            });

            setEstadoLocal('activa');
        } catch {
            Alert.alert('Error', 'No se pudo iniciar la apelación.');
        } finally {
            setIniciando(false);
        }
    };

    const enviarMensaje = async () => {
        const trimmed = texto.trim();
        if (!trimmed) return;
        setSending(true);
        const { error } = await supabase.from('cotizacion_mensajes').insert({
            cotizacion_id: cotizacionId,
            sender_role: 'cliente',
            content: trimmed,
            precio_propuesto: null,
        });
        if (!error) setTexto('');
        setSending(false);
    };

    const aceptarPropuesta = () => {
        if (!ultimaPropuesta) return;
        Alert.alert(
            'Aceptar nuevo precio',
            `¿Confirmas aceptar el presupuesto de $${ultimaPropuesta}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, aceptar',
                    onPress: async () => {
                        await supabase.from('cotizaciones').update({
                            costo_estimado: ultimaPropuesta,
                            en_apelacion: false,
                            apelacion_estado: 'aceptada',
                            estado: 'Aceptada',
                        }).eq('id', cotizacionId);

                        await supabase.from('cotizacion_mensajes').insert({
                            cotizacion_id: cotizacionId,
                            sender_role: 'cliente',
                            content: `✅ Acepté el nuevo precio de $${ultimaPropuesta}.`,
                            precio_propuesto: null,
                        });

                        setEstadoLocal('aceptada');
                        onPrecioAceptado(ultimaPropuesta);
                        onClose();
                    },
                },
            ]
        );
    };

    const formatHora = (iso: string) =>
        new Date(iso).toLocaleTimeString('es-MX', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });

    // ─── Renders por estado ───────────────────────────────────────────

    const renderContenido = () => {
        if (loading) return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1565C0" />
            </View>
        );

        // Ya agotó la apelación y fue cerrada sin acuerdo
        if (apelacionUsada && estadoLocal === 'cerrada_sin_acuerdo') {
            return (
                <View style={styles.estadoContainer}>
                    <View style={[styles.estadoIcon, { backgroundColor: 'rgba(211,47,47,0.1)' }]}>
                        <Ionicons name="close-circle-outline" size={48} color="#C62828" />
                    </View>
                    <ThemedText style={styles.estadoTitle}>Apelación Cerrada</ThemedText>
                    <ThemedText style={styles.estadoDesc}>
                        No se llegó a un acuerdo en esta apelación. El precio original de ${costoActual} sigue vigente.
                        Puedes contactarnos directamente si tienes más dudas.
                    </ThemedText>
                    {/* Igual muestra el historial del chat */}
                    <ScrollView style={styles.historialScroll}>
                        {mensajes.map(m => renderBurbuja(m))}
                    </ScrollView>
                </View>
            );
        }

        // Ya agotó la apelación pero aún no la ha usado (no debería pasar, pero por seguridad)
        if (apelacionUsada && estadoLocal === 'aceptada') {
            return (
                <View style={styles.estadoContainer}>
                    <View style={[styles.estadoIcon, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#2E7D32" />
                    </View>
                    <ThemedText style={styles.estadoTitle}>Apelación Resuelta</ThemedText>
                    <ThemedText style={styles.estadoDesc}>
                        Llegaron a un acuerdo. El nuevo precio fue aceptado.
                    </ThemedText>
                </View>
            );
        }

        // Nunca ha apelado — pantalla de inicio
        if (!apelacionUsada && estadoLocal === null) {
            return (
                <View style={styles.iniciarContainer}>
                    <View style={styles.iniciarIcon}>
                        <Ionicons name="scale-outline" size={48} color="#1565C0" />
                    </View>
                    <ThemedText style={styles.iniciarTitle}>¿El precio te parece elevado?</ThemedText>
                    <ThemedText style={styles.iniciarDesc}>
                        Puedes iniciar una apelación para negociar con nuestro equipo.
                        Un administrador revisará tu caso y podrá ofrecerte un nuevo precio.{'\n\n'}
                        <Text style={styles.advertencia}>⚠️ Solo tienes una oportunidad de apelación por cotización.</Text>
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.iniciarBtn, iniciando && styles.btnDisabled]}
                        onPress={iniciarApelacion}
                        disabled={iniciando}
                    >
                        {iniciando
                            ? <ActivityIndicator color="#fff" />
                            : <ThemedText style={styles.iniciarBtnText}>Iniciar Apelación</ThemedText>
                        }
                    </TouchableOpacity>
                </View>
            );
        }

        // Chat activo
        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {/* Banner propuesta pendiente */}
                {ultimaPropuesta && estadoLocal === 'activa' && (
                    <TouchableOpacity style={styles.propuestaBanner} onPress={aceptarPropuesta}>
                        <View style={styles.propuestaInfo}>
                            <Ionicons name="pricetag" size={16} color="#2E7D32" />
                            <ThemedText style={styles.propuestaText}>
                                Propuesta del admin:{' '}
                                <Text style={styles.propuestaPrecio}>${ultimaPropuesta}</Text>
                            </ThemedText>
                        </View>
                        <View style={styles.propuestaBtn}>
                            <Text style={styles.propuestaBtnText}>Aceptar</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <ScrollView
                    ref={scrollRef}
                    style={styles.mensajes}
                    contentContainerStyle={styles.mensajesContent}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
                >
                    {mensajes.length === 0 ? (
                        <View style={styles.emptyChat}>
                            <Ionicons name="chatbubble-outline" size={36} color="#ccc" />
                            <ThemedText style={styles.emptyChatText}>
                                Apelación iniciada. Escribe tu argumento para comenzar.
                            </ThemedText>
                        </View>
                    ) : (
                        mensajes.map(m => renderBurbuja(m))
                    )}
                </ScrollView>

                {/* Input solo si la apelación sigue activa */}
                {estadoLocal === 'activa' && (
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            placeholder="Escribe tu argumento..."
                            placeholderTextColor="#88888888"
                            value={texto}
                            onChangeText={setTexto}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!texto.trim() || sending) && styles.btnDisabled]}
                            onPress={enviarMensaje}
                            disabled={!texto.trim() || sending}
                        >
                            {sending
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Ionicons name="send" size={18} color="#fff" />
                            }
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        );
    };

    const renderBurbuja = (m: Mensaje) => {
        const esMio = m.sender_role === 'cliente';
        return (
            <View key={m.id} style={[styles.bubbleRow, esMio && styles.bubbleRowRight]}>
                <View style={[styles.bubble, esMio ? styles.bubbleMio : styles.bubbleAdmin]}>
                    <Text style={[styles.bubbleRole, esMio && styles.bubbleRoleMio]}>
                        {esMio ? 'Tú' : 'Administrador'}
                    </Text>
                    <Text style={[styles.bubbleText, esMio && styles.bubbleTextMio]}>
                        {m.content}
                    </Text>
                    {m.precio_propuesto && (
                        <View style={styles.precioBadge}>
                            <Ionicons name="pricetag-outline" size={12} color="#2E7D32" />
                            <Text style={styles.precioBadgeText}>
                                Nueva propuesta: ${m.precio_propuesto}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.bubbleHora, esMio && styles.bubbleHoraMio]}>
                        {formatHora(m.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="chatbubbles" size={20} color="#fff" />
                        </View>
                        <View>
                            <ThemedText style={styles.headerTitle}>Apelación de Precio</ThemedText>
                            <ThemedText style={styles.headerSub}>
                                Presupuesto: <Text style={styles.headerPrice}>${costoActual}</Text>
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color="#888" />
                    </TouchableOpacity>
                </View>

                {renderContenido()}
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#1565C0',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: '800' },
    headerSub: { fontSize: 12, opacity: 0.6, marginTop: 1 },
    headerPrice: { color: '#1565C0', fontWeight: '700' },

    estadoContainer: { flex: 1, padding: 28, alignItems: 'center' },
    estadoIcon: {
        width: 96, height: 96, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    estadoTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
    estadoDesc: { fontSize: 14, opacity: 0.6, textAlign: 'center', lineHeight: 22 },
    historialScroll: { width: '100%', marginTop: 24 },

    iniciarContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    iniciarIcon: {
        width: 96, height: 96, borderRadius: 24, backgroundColor: 'rgba(21,101,192,0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    iniciarTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    iniciarDesc: { fontSize: 14, opacity: 0.6, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    advertencia: { color: '#E65100', fontWeight: '700', opacity: 1 },
    iniciarBtn: {
        backgroundColor: '#1565C0', paddingVertical: 16,
        borderRadius: 16, width: '100%', alignItems: 'center',
    },
    iniciarBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    propuestaBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(46,125,50,0.08)', padding: 12,
        marginHorizontal: 16, marginTop: 12, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(46,125,50,0.25)',
    },
    propuestaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    propuestaText: { fontSize: 13, fontWeight: '600' },
    propuestaPrecio: { color: '#2E7D32', fontWeight: '800' },
    propuestaBtn: {
        backgroundColor: '#2E7D32', paddingVertical: 7,
        paddingHorizontal: 14, borderRadius: 10,
    },
    propuestaBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    mensajes: { flex: 1 },
    mensajesContent: { padding: 16, gap: 10 },
    emptyChat: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyChatText: { fontSize: 13, opacity: 0.5, textAlign: 'center' },

    bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 6 },
    bubbleRowRight: { justifyContent: 'flex-end' },
    bubble: {
        maxWidth: '75%', borderRadius: 16, padding: 12,
        backgroundColor: 'rgba(150,150,150,0.1)',
    },
    bubbleMio: { backgroundColor: '#1565C0', borderBottomRightRadius: 4 },
    bubbleAdmin: { borderBottomLeftRadius: 4 },
    bubbleRole: { fontSize: 11, fontWeight: '700', opacity: 0.5, marginBottom: 3 },
    bubbleRoleMio: { color: 'rgba(255,255,255,0.7)' },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    bubbleTextMio: { color: '#fff' },
    bubbleHora: { fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' },
    bubbleHoraMio: { color: 'rgba(255,255,255,0.5)' },
    precioBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(46,125,50,0.12)', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4, marginTop: 6,
    },
    precioBadgeText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },

    inputRow: {
        flexDirection: 'row', gap: 10, padding: 16,
        borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)',
    },
    input: {
        flex: 1, backgroundColor: 'rgba(150,150,150,0.1)',
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 14, maxHeight: 100,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#1565C0',
        justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end',
    },
    btnDisabled: { opacity: 0.4 },
});