import React, {useEffect, useState} from 'react';
import {
    View,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    TextInput,
    Linking,
    useColorScheme,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import {formatDateTime} from '@/utils/date';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {Cotizacion} from "@/libs/types/cotizaciones";
import {sendNotificationByID} from "@/libs/notifications/send-notifications";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {quotesService} from "@/libs/users/cotizaciones";
import {supabase} from "@/libs/supabase";
import {CreateJobModal} from "@/components/modals/owner/create-job";
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
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
    };
};

export default function OwnerQuoteDetail() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, surfaceBg, inputBg, borderColor} = useAppTheme();

    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isImageZoomVisible, setImageZoomVisible] = useState(false);
    const [isCreateJobVisible, setCreateJobVisible] = useState(false);
    const [costo, setCosto] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

    useEffect(() => {
        loadQuote();
    }, [id]);

    const loadQuote = async () => {
        try {
            const data = await cotizacionesService.getCotizacionDetails(id as string);
            setQuote(data[0]);
            if (data[0].costo_estimado) setCosto(data[0].costo_estimado.toString().replace('$', ''));
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });
            if (!result.canceled) setSelectedFile(result);
        } catch (err) {
            Alert.alert("Error", "No se pudo seleccionar el archivo");
        }
    };

    const handleSendQuote = async () => {
        if (!costo || !selectedFile) {
            Alert.alert("Campos incompletos", "Debes asignar un costo y adjuntar el PDF.");
            return;
        }

        const costoNum = parseFloat(costo);
        if (isNaN(costoNum) || costoNum <= 0) {
            Alert.alert("Costo inválido", "Ingresa un costo válido mayor a cero.");
            return;
        }

        setSending(true);
        try {
            const fileUri = selectedFile.assets![0].uri;
            const quoteId = id as string;
            const fileName = `cotizacion-${quoteId}.pdf`;

            const response = await fetch(fileUri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const {data, error} = await supabase.storage.from('pdfs').upload(fileName, arrayBuffer,
                {contentType: 'application/pdf', upsert: true});
            if (error) throw new Error("Error al subir el archivo");

            const {data: {publicUrl}} = supabase.storage.from('pdfs').getPublicUrl(fileName);

            await quotesService.updateQuoteWithEstimate(quoteId, costo, publicUrl);
            await sendNotificationByID(quote?.profiles?.id as string, `Hola ${quote?.profiles?.name}`, `Tu cotización ${quote?.servicio} está lista`, 'data');
            Alert.alert("Éxito", "Cotización enviada exitosamente.");
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setSending(false);
        }
    };

    const handleJobCreatedSuccess = async () => {
        const quoteId = id as string;
        try {
            await quotesService.updateStateQuote(quoteId, 'Asignada');
            Alert.alert("Trabajo Iniciado", "El trabajador ha sido asignado y el trabajo ha sido creado.");
            loadQuote();
        } catch (e) {
            Alert.alert("Error", "No se pudo actualizar el estado.");
        }
    };

    if (loading) return <ThemedView style={G.center}><ActivityIndicator size="large"
                                                                        color={COLORS.primary}/></ThemedView>;
    if (!quote) return <ThemedView style={G.center}><ThemedText>Error al cargar.</ThemedText></ThemedView>;

    const isAsignada = quote.estado?.toLowerCase() === 'asignada';
    const isAceptada = quote.estado?.toLowerCase() === 'aceptada';
    const isEnviada = quote.estado?.toLowerCase() === 'enviada';

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <View style={[G.topBar, {
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: borderColor
                }]}>
                    <TouchableOpacity onPress={() => router.back()} style={G.backBtn} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={28} color={textColor}/>
                    </TouchableOpacity>
                    <View style={{flex: 1, marginHorizontal: 12}}>
                        <ThemedText type="subtitle" numberOfLines={1}>Detalle de la Cotizacion</ThemedText>
                    </View>
                    <View style={{width: 40}}/>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={G.scrollContent}>
                    <View style={[G.card, {backgroundColor: cardBg, borderColor: borderColor, position: 'relative'}]}>
                        <View style={[G.badge, {
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            backgroundColor: 'rgba(0,122,255,0.1)'
                        }]}>
                            <ThemedText
                                style={[G.badgeText, {color: COLORS.primary}]}>{quote.estado || 'Pendiente'}</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={[G.infoValueSm, {opacity: 0.6, marginBottom: 8}]}>
                            {quote.profiles?.name}
                        </ThemedText>
                        <ThemedText type="defaultSemiBold"
                                    style={[G.infoValue, {fontSize: 18, marginBottom: 8, paddingRight: 80}]}>
                            {quote.servicio}
                        </ThemedText>
                        <View style={[G.row, {gap: 8, marginTop: 6}]}>
                            <Ionicons name="location" size={16} color={COLORS.primary}/>
                            <ThemedText style={[G.infoValueSm, {color: mutedText}]}>{quote.direccion}</ThemedText>
                        </View>
                        <View style={[G.row, {gap: 8, marginTop: 6}]}>
                            <Ionicons name="calendar" size={16} color={COLORS.primary}/>
                            <ThemedText
                                style={[G.infoValueSm, {color: mutedText}]}>{formatDateTime(quote.fecha_preferida)}</ThemedText>
                        </View>
                    </View>

                    <ThemedText style={[G.sectionLabel, {marginTop: 0}]}>Descripción del problema</ThemedText>
                    <ThemedText style={{fontSize: 16, marginBottom: 20, lineHeight: 24, opacity: 0.9}}>
                        {quote.descripcion}
                    </ThemedText>

                    {quote.evidencia_url && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setImageZoomVisible(true)}
                            style={[G.imageContainer, {height: 220, marginBottom: 20}]}>
                            <Image source={{uri: quote.evidencia_url}} style={G.imageFull} resizeMode="cover"/>
                            <View style={{
                                position: 'absolute',
                                bottom: 12,
                                right: 12,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                padding: 8,
                                borderRadius: 10
                            }}>
                                <Ionicons name="expand" size={20} color="#FFF"/>
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={G.divider}/>

                    {isAsignada ? (
                        <View style={[G.cardSurface, {
                            alignItems: 'center',
                            padding: 25,
                            borderColor: `rgba(0, 122, 255, 0.2)`
                        }]}>
                            <Ionicons name="briefcase" size={48} color={COLORS.primary} style={{marginBottom: 10}}/>
                            <ThemedText type="subtitle" style={{textAlign: 'center', marginBottom: 10}}>Trabajo
                                Asignado</ThemedText>
                            <View style={[G.row, {marginBottom: 15}]}>
                                <ThemedText type="defaultSemiBold">Presupuesto: </ThemedText>
                                <ThemedText style={{
                                    fontSize: 18,
                                    color: COLORS.success,
                                    fontWeight: 'bold'
                                }}>${costo}</ThemedText>
                            </View>
                            {quote.pdf_url && (
                                <TouchableOpacity style={[G.row, {
                                    gap: 10,
                                    padding: 12,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: COLORS.primary,
                                    marginBottom: 20
                                }]} onPress={() => Linking.openURL(quote.pdf_url!)}>
                                    <Ionicons name="document-text" size={20} color={COLORS.primary}/>
                                    <ThemedText style={{color: COLORS.primary, fontWeight: '600'}}>Ver
                                        Cotizacion</ThemedText>
                                </TouchableOpacity>
                            )}
                            <View style={[G.row, {backgroundColor: surfaceBg, padding: 15, borderRadius: 12, gap: 10}]}>
                                <Ionicons name="information-circle-outline" size={20} color={mutedText}/>
                                <ThemedText style={{flex: 1, fontSize: 13, color: mutedText, lineHeight: 18}}>
                                    Este trabajo ya ha sido asignado. Para más información, visita la pestaña de
                                    trabajos.
                                </ThemedText>
                            </View>
                        </View>
                    ) : isAceptada ? (
                        <View style={[G.cardSurface, {
                            alignItems: 'center',
                            padding: 25,
                            borderColor: 'rgba(76,217,100,0.3)',
                            backgroundColor: 'rgba(76,217,100,0.05)'
                        }]}>
                            <Ionicons name="checkmark-circle" size={48} color={COLORS.success}
                                      style={{marginBottom: 10}}/>
                            <ThemedText type="subtitle" style={{textAlign: 'center', marginBottom: 5}}>¡Cotización
                                Aceptada!</ThemedText>
                            <ThemedText style={{textAlign: 'center', opacity: 0.7, marginBottom: 20}}>
                                El cliente ha aprobado el presupuesto de ${costo}. Es momento de asignar un trabajador a
                                este proyecto.
                            </ThemedText>
                            <TouchableOpacity style={[G.btnPrimary, {backgroundColor: COLORS.success, width: '100%'}]}
                                              onPress={() => setCreateJobVisible(true)}>
                                <ThemedText style={G.btnText}>Asignar Trabajador</ThemedText>
                                <Ionicons name="person-add" size={18} color={COLORS.onPrimary}
                                          style={{marginLeft: 10}}/>
                            </TouchableOpacity>
                        </View>
                    ) : isEnviada ? (
                        <View style={[G.cardSurface, {
                            alignItems: 'center',
                            padding: 25,
                            borderColor: 'rgba(255,149,0,0.3)',
                            backgroundColor: 'rgba(255,149,0,0.05)'
                        }]}>
                            <Ionicons name="time" size={48} color="#FF9500" style={{marginBottom: 10}}/>
                            <ThemedText type="subtitle" style={{textAlign: 'center', marginBottom: 5}}>Esperando
                                Respuesta</ThemedText>
                            <ThemedText style={{textAlign: 'center', opacity: 0.7}}>
                                Ya enviaste esta cotización por ${costo}. Estamos esperando a que el cliente la revise y
                                apruebe.
                            </ThemedText>
                        </View>
                    ) : (
                        <>
                            <ThemedText type="subtitle" style={{marginBottom: 15}}>Responder al Cliente</ThemedText>
                            <ThemedText style={{fontSize: 14, fontWeight: '600', marginBottom: 10}}>Costo
                                Estimado</ThemedText>
                            <View style={[G.inputWithIcon, {
                                backgroundColor: inputBg,
                                borderWidth: 1,
                                borderColor: borderColor,
                                marginBottom: 20
                            }]}>
                                <ThemedText style={{fontSize: 18, fontWeight: 'bold', marginRight: 5}}>$</ThemedText>
                                <TextInput
                                    style={[G.inputText, {color: textColor}]}
                                    placeholder="0.00"
                                    placeholderTextColor={COLORS.placeholder}
                                    keyboardType="numeric"
                                    value={costo}
                                    onChangeText={setCosto}
                                />
                            </View>

                            <ThemedText style={{fontSize: 14, fontWeight: '600', marginBottom: 10}}>Documento de
                                Presupuesto (PDF)</ThemedText>
                            <TouchableOpacity
                                style={[
                                    G.btnOutlinePrimary,
                                    selectedFile && {
                                        borderColor: COLORS.success,
                                        backgroundColor: 'rgba(76,217,100,0.05)'
                                    }
                                ]}
                                onPress={handlePickDocument}>
                                <Ionicons
                                    name={selectedFile ? "checkmark-circle" : "document-attach-outline"}
                                    size={24}
                                    color={selectedFile ? COLORS.success : COLORS.primary}
                                />
                                <ThemedText
                                    style={{color: selectedFile ? COLORS.success : COLORS.primary, fontWeight: '600'}}>
                                    {selectedFile ? selectedFile.assets![0].name : "Seleccionar PDF"}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[G.btnPrimary, (sending || !selectedFile) && G.btnDisabled, {marginTop: 30}]}
                                onPress={handleSendQuote}
                                disabled={sending || !selectedFile}>
                                {sending ? <ActivityIndicator color={COLORS.onPrimary}/> : (
                                    <>
                                        <ThemedText style={G.btnText}>Enviar Presupuesto</ThemedText>
                                        <Ionicons name="send" size={18} color={COLORS.onPrimary}
                                                  style={{marginLeft: 10}}/>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>

            <Modal visible={isImageZoomVisible} transparent={true} animationType="fade">
                <View style={{flex: 1, backgroundColor: '#000', justifyContent: 'center'}}>
                    <TouchableOpacity style={{position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10}}
                                      onPress={() => setImageZoomVisible(false)}>
                        <Ionicons name="close" size={30} color="#FFF"/>
                    </TouchableOpacity>
                    <Image source={{uri: quote.evidencia_url || ''}} style={{width: '100%', height: '80%'}}
                           resizeMode="contain"/>
                </View>
            </Modal>

            <CreateJobModal
                visible={isCreateJobVisible}
                onClose={() => setCreateJobVisible(false)}
                onSuccess={handleJobCreatedSuccess}
                initialData={{
                    title: quote.servicio,
                    description: quote.descripcion as string,
                    address: quote.direccion,
                    image_url: quote.evidencia_url as string,
                    fecha_preferida: quote.fecha_preferida as string,
                    costo: parseFloat(costo)
                }}
            />
        </ThemedView>
    );
}