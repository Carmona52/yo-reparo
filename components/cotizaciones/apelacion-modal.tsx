import React, {useEffect, useRef, useState} from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, KeyboardAvoidingView,
    Platform, Alert, useColorScheme,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {supabase} from '@/libs/supabase';
import {ThemedView} from '@/components/themed-view';
import {ThemedText} from '@/components/themed-text';
import {G, COLORS} from '@/styles/global-styles';

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        borderColor: COLORS.border,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
    };
};

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
    apelacionUsada: boolean;
    apelacionEstado: string | null;
    onPrecioAceptado: (nuevoPrecio: number) => void;
}

export const ApelacionModal = ({
                                   visible, onClose, cotizacionId, costoActual,
                                   apelacionUsada, apelacionEstado, onPrecioAceptado,
                               }: ApelacionModalProps) => {
    const {textColor, mutedText, surfaceBg, inputBg, borderColor} = useAppTheme();
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [iniciando, setIniciando] = useState(false);
    const [estadoLocal, setEstadoLocal] = useState(apelacionEstado);
    const [ultimaPropuesta, setUltimaPropuesta] = useState<number | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        setEstadoLocal(apelacionEstado);
    }, [apelacionEstado]);

    useEffect(() => {
        if (!visible) return;
        const cargar = async () => {
            setLoading(true);
            const {data} = await supabase
                .from('cotizacion_mensajes')
                .select('*')
                .eq('cotizacion_id', cotizacionId)
                .order('created_at', {ascending: true});
            const msgs = data ?? [];
            setMensajes(msgs);
            const propuestas = msgs.filter(m => m.precio_propuesto !== null);
            if (propuestas.length > 0) setUltimaPropuesta(propuestas[propuestas.length - 1].precio_propuesto);
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({animated: false}), 150);
        };
        cargar();

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
                setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
            })
            .subscribe();

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
                    data: {quoteId: cotizacionId, type: 'apelacion'},
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
        const {error} = await supabase.from('cotizacion_mensajes').insert({
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
                {text: 'Cancelar', style: 'cancel'},
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

    const renderBurbuja = (m: Mensaje) => {
        const esMio = m.sender_role === 'cliente';
        return (
            <View key={m.id} style={[G.row, {justifyContent: esMio ? 'flex-end' : 'flex-start', marginBottom: 6}]}>
                <View style={[
                    {maxWidth: '75%', borderRadius: 16, padding: 12, backgroundColor: surfaceBg},
                    esMio && {backgroundColor: COLORS.primary, borderBottomRightRadius: 4},
                    !esMio && {borderBottomLeftRadius: 4}
                ]}>
                    <Text style={[
                        {fontSize: 11, fontWeight: '700', marginBottom: 3, opacity: 0.5},
                        esMio && {color: COLORS.onPrimary + 'B3'} // rgba con opacidad 0.7
                    ]}>
                        {esMio ? 'Tú' : 'Administrador'}
                    </Text>
                    <Text style={[
                        {fontSize: 14, lineHeight: 20, color: textColor},
                        esMio && {color: COLORS.onPrimary}
                    ]}>
                        {m.content}
                    </Text>
                    {m.precio_propuesto && (
                        <View style={[G.row, {
                            gap: 4,
                            backgroundColor: 'rgba(46,125,50,0.12)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginTop: 6,
                            alignSelf: 'flex-start'
                        }]}>
                            <Ionicons name="pricetag-outline" size={12} color={COLORS.success}/>
                            <Text style={{fontSize: 12, color: COLORS.success, fontWeight: '700'}}>
                                Nueva propuesta: ${m.precio_propuesto}
                            </Text>
                        </View>
                    )}
                    <Text style={[
                        {fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right'},
                        esMio && {color: COLORS.onPrimary + '80'}
                    ]}>
                        {formatHora(m.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderContenido = () => {
        if (loading) return (
            <View style={G.center}>
                <ActivityIndicator size="large" color={COLORS.primary}/>
            </View>
        );

        if (apelacionUsada && estadoLocal === 'cerrada_sin_acuerdo') {
            return (
                <View style={[G.center, {padding: 28}]}>
                    <View style={[{
                        width: 96,
                        height: 96,
                        borderRadius: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20,
                        backgroundColor: 'rgba(211,47,47,0.1)'
                    }]}>
                        <Ionicons name="close-circle-outline" size={48} color="#C62828"/>
                    </View>
                    <ThemedText style={[{
                        fontSize: 20,
                        fontWeight: '800',
                        textAlign: 'center',
                        marginBottom: 10,
                        color: textColor
                    }]}>
                        Apelación Cerrada
                    </ThemedText>
                    <ThemedText style={[{
                        fontSize: 14,
                        opacity: 0.6,
                        textAlign: 'center',
                        lineHeight: 22,
                        marginBottom: 20,
                        color: mutedText
                    }]}>
                        No se llegó a un acuerdo en esta apelación. El precio original de ${costoActual} sigue vigente.
                        Puedes contactarnos directamente si tienes más dudas.
                    </ThemedText>
                    <ScrollView style={{width: '100%'}}>
                        {mensajes.map(m => renderBurbuja(m))}
                    </ScrollView>
                </View>
            );
        }

        if (apelacionUsada && estadoLocal === 'aceptada') {
            return (
                <View style={[G.center, {padding: 28}]}>
                    <View style={[{
                        width: 96,
                        height: 96,
                        borderRadius: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20,
                        backgroundColor: 'rgba(46,125,50,0.1)'
                    }]}>
                        <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success}/>
                    </View>
                    <ThemedText style={[{
                        fontSize: 20,
                        fontWeight: '800',
                        textAlign: 'center',
                        marginBottom: 10,
                        color: textColor
                    }]}>
                        Apelación Resuelta
                    </ThemedText>
                    <ThemedText
                        style={[{fontSize: 14, opacity: 0.6, textAlign: 'center', lineHeight: 22, color: mutedText}]}>
                        Llegaron a un acuerdo. El nuevo precio fue aceptado.
                    </ThemedText>
                </View>
            );
        }

        if (!apelacionUsada && estadoLocal === null) {
            return (
                <View style={[G.center, {padding: 32, flex: 1}]}>
                    <View style={[{
                        width: 96,
                        height: 96,
                        borderRadius: 24,
                        backgroundColor: COLORS.primaryBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 24
                    }]}>
                        <Ionicons name="scale-outline" size={48} color={COLORS.primary}/>
                    </View>
                    <ThemedText style={[{
                        fontSize: 20,
                        fontWeight: '800',
                        textAlign: 'center',
                        marginBottom: 12,
                        color: textColor
                    }]}>
                        ¿El precio te parece elevado?
                    </ThemedText>
                    <ThemedText style={[{
                        fontSize: 14,
                        opacity: 0.6,
                        textAlign: 'center',
                        lineHeight: 22,
                        marginBottom: 32,
                        color: mutedText
                    }]}>
                        Puedes iniciar una apelación para negociar con nuestro equipo.
                        Un administrador revisará tu caso y podrá ofrecerte un nuevo precio.{'\n\n'}
                        <Text style={{color: '#E65100', fontWeight: '700', opacity: 1}}>⚠️ Solo tienes una oportunidad
                            de apelación por cotización.</Text>
                    </ThemedText>
                    <TouchableOpacity
                        style={[G.btnPrimary, {width: '100%'}, iniciando && G.btnDisabled]}
                        onPress={iniciarApelacion}
                        disabled={iniciando}
                    >
                        {iniciando
                            ? <ActivityIndicator color={COLORS.onPrimary}/>
                            : <ThemedText style={G.btnText}>Iniciar Apelación</ThemedText>
                        }
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <KeyboardAvoidingView
                style={G.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}>
                {ultimaPropuesta && estadoLocal === 'activa' && (
                    <TouchableOpacity style={[G.rowBetween, {
                        backgroundColor: 'rgba(46,125,50,0.08)',
                        padding: 12,
                        marginHorizontal: 16,
                        marginTop: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(46,125,50,0.25)'
                    }]} onPress={aceptarPropuesta}>
                        <View style={[G.row, {gap: 8, flex: 1}]}>
                            <Ionicons name="pricetag" size={16} color={COLORS.success}/>
                            <ThemedText style={{fontSize: 13, fontWeight: '600', color: textColor}}>
                                Propuesta del admin: <Text
                                style={{color: COLORS.success, fontWeight: '800'}}>${ultimaPropuesta}</Text>
                            </ThemedText>
                        </View>
                        <View style={{
                            backgroundColor: COLORS.success,
                            paddingVertical: 7,
                            paddingHorizontal: 14,
                            borderRadius: 10
                        }}>
                            <Text style={{color: COLORS.onPrimary, fontWeight: '700', fontSize: 13}}>Aceptar</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <ScrollView
                    ref={scrollRef}
                    style={G.flex1}
                    contentContainerStyle={{padding: 16, gap: 10}}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: false})}>
                    {mensajes.length === 0 ? (
                        <View style={[G.center, {marginTop: 60, gap: 12}]}>
                            <Ionicons name="chatbubble-outline" size={36} color={COLORS.mutedIcon}/>
                            <ThemedText style={{fontSize: 13, opacity: 0.5, textAlign: 'center', color: mutedText}}>
                                Apelación iniciada. Escribe tu argumento para comenzar.
                            </ThemedText>
                        </View>
                    ) : (
                        mensajes.map(m => renderBurbuja(m))
                    )}
                </ScrollView>

                {estadoLocal === 'activa' && (
                    <View style={[G.row, {gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: borderColor}]}>
                        <TextInput
                            style={[G.input, {
                                flex: 1,
                                borderRadius: 20,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                maxHeight: 100,
                                color: textColor,
                                backgroundColor: inputBg
                            }]}
                            placeholder="Escribe tu argumento..."
                            placeholderTextColor={COLORS.placeholder}
                            value={texto}
                            onChangeText={setTexto}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[G.btnCircle, {
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                alignSelf: 'flex-end'
                            }, (!texto.trim() || sending) && G.btnDisabled]}
                            onPress={enviarMensaje}
                            disabled={!texto.trim() || sending}
                        >
                            {sending
                                ? <ActivityIndicator size="small" color={COLORS.onPrimary}/>
                                : <Ionicons name="send" size={18} color={COLORS.onPrimary}/>
                            }
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={G.flex1}>
                <View style={[G.topBar, {
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: borderColor,
                    paddingHorizontal: 20
                }]}>
                    <View style={[G.row, {gap: 12}]}>
                        <View style={[G.iconBadgeSm, {backgroundColor: COLORS.primary}]}>
                            <Ionicons name="chatbubbles" size={20} color={COLORS.onPrimary}/>
                        </View>
                        <View>
                            <ThemedText style={{fontSize: 16, fontWeight: '800', color: textColor}}>Apelación de
                                Precio</ThemedText>
                            <ThemedText style={{fontSize: 12, opacity: 0.6, marginTop: 1, color: mutedText}}>
                                Presupuesto: <Text
                                style={{color: COLORS.primary, fontWeight: '700'}}>${costoActual}</Text>
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color={mutedText}/>
                    </TouchableOpacity>
                </View>

                {renderContenido()}
            </ThemedView>
        </Modal>
    );
};