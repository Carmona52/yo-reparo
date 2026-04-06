import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    TextInput,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {useThemeColor} from '@/hooks/use-theme-color';
import {Cotizacion} from "@/libs/types/cotizaciones";

import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {quotesService} from "@/libs/users/cotizaciones";
import {supabase} from "@/libs/supabase";
import {CreateJobModal} from "@/components/modals/owner/create-job";

export default function OwnerQuoteDetail() {
    const {id} = useLocalSearchParams();
    const router = useRouter();

    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isImageZoomVisible, setImageZoomVisible] = useState(false);
    const [isCreateJobVisible, setCreateJobVisible] = useState(false);
    const [costo, setCosto] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

    const textColor = useThemeColor({}, 'text');

    useEffect(() => {
        loadQuote();
    }, [id]);

    const loadQuote = async () => {
        try {
            const data = await cotizacionesService.getCotizacionDetails(id as string);
            setQuote(data[0]);
            console.log(data[0].fecha_preferida);
            if (data[0].costo_estimado) setCosto(data[0].costo_estimado.toString().replace('$', ''));
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    };

    const getFormattedDate = (dateStr: string | undefined) => {
        if (!dateStr) return "Fecha no disponible";
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? "Formato inválido" : date.toLocaleString('es-ES', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
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
                {contentType: 'application/pdf', upsert: true})
            if (error) {
                console.log(error);
                throw new Error("Error al subir el archivo");
            }
            const {data: {publicUrl}} = supabase.storage
                .from('pdfs')
                .getPublicUrl(fileName)

            await quotesService.updateQuoteWithEstimate(quoteId, costo, publicUrl);

            Alert.alert("Éxito", "Cotización enviada exitosamente.");
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setSending(false);
        }
    };

    const handleAssignWorker = () => {
        Alert.alert("Siguiente paso", "Aquí abriremos la lista de trabajadores para usar la función updateJob.");
    };

    const handleJobCreatedSuccess = () => {
        Alert.alert("Trabajo Iniciado", "El trabajador ha sido asignado y el trabajo ha sido creado.");
        loadQuote();
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator size="large"
                                                                             color="#007AFF"/></ThemedView>;
    if (!quote) return <ThemedView style={styles.center}><ThemedText>Error al cargar.</ThemedText></ThemedView>;

    const isAceptada = quote.estado?.toLowerCase() === 'aceptada';
    const isEnviada = quote.estado?.toLowerCase() === 'enviada';

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF"/>
                    </TouchableOpacity>
                    <ThemedText type="title">Revisar Solicitud</ThemedText>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <ThemedView style={styles.clientCard}>
                        <View style={styles.statusBadge}>
                            <ThemedText style={styles.statusText}>{quote.estado || 'Pendiente'}</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.serviceTitle}>{quote.servicio}</ThemedText>
                        <View style={styles.infoLine}>
                            <Ionicons name="location" size={16} color="#007AFF"/>
                            <ThemedText style={styles.infoText}>{quote.direccion}</ThemedText>
                        </View>
                        <View style={styles.infoLine}>
                            <Ionicons name="calendar" size={16} color="#007AFF"/>
                            <ThemedText style={styles.infoText}>{getFormattedDate(quote.fecha_preferida)}</ThemedText>
                        </View>
                    </ThemedView>

                    <ThemedText style={styles.sectionLabel}>Descripción del problema</ThemedText>
                    <ThemedText style={styles.descText}>{quote.descripcion}</ThemedText>

                    {quote.evidencia_url && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setImageZoomVisible(true)}
                            style={styles.imageWrapper}>
                            <Image source={{uri: quote.evidencia_url}} style={styles.previewImage} resizeMode="cover"/>
                            <View style={styles.zoomIconOverlay}>
                                <Ionicons name="expand" size={20} color="#FFF"/>
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={styles.divider}/>

                    {isAceptada ? (
                        <ThemedView style={styles.acceptedCard}>
                            <Ionicons name="checkmark-circle" size={48} color="#4CD964" style={{marginBottom: 10}}/>
                            <ThemedText type="subtitle" style={{textAlign: 'center', marginBottom: 5}}>¡Cotización
                                Aceptada!</ThemedText>
                            <ThemedText style={{textAlign: 'center', opacity: 0.7, marginBottom: 20}}>
                                El cliente ha aprobado el presupuesto de ${costo}. Es momento de asignar un trabajador a
                                este proyecto.
                            </ThemedText>
                            <TouchableOpacity style={styles.assignBtn} onPress={() => setCreateJobVisible(true)}>
                                <ThemedText style={styles.sendBtnText}>Asignar Trabajador</ThemedText>
                                <Ionicons name="person-add" size={18} color="#fff" style={{marginLeft: 10}}/>
                            </TouchableOpacity>
                        </ThemedView>

                    ) : isEnviada ? (
                        <ThemedView style={styles.pendingCard}>
                            <Ionicons name="time" size={48} color="#FF9500" style={{marginBottom: 10}}/>
                            <ThemedText type="subtitle" style={{textAlign: 'center', marginBottom: 5}}>Esperando
                                Respuesta</ThemedText>
                            <ThemedText style={{textAlign: 'center', opacity: 0.7}}>
                                Ya enviaste esta cotización por ${costo}. Estamos esperando a que el cliente la revise y
                                apruebe.
                            </ThemedText>
                        </ThemedView>

                    ) : (
                        <>
                            <ThemedText type="subtitle" style={{marginBottom: 15}}>Responder al Cliente</ThemedText>

                            <ThemedText style={styles.inputLabel}>Costo Estimado</ThemedText>
                            <ThemedView style={styles.priceInputContainer}>
                                <ThemedText style={styles.currencySymbol}>$</ThemedText>
                                <TextInput
                                    style={[styles.priceInput, {color: textColor}]}
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(150,150,150,0.5)"
                                    keyboardType="numeric"
                                    value={costo}
                                    onChangeText={setCosto}
                                />
                            </ThemedView>

                            <ThemedText style={styles.inputLabel}>Documento de Presupuesto (PDF)</ThemedText>
                            <TouchableOpacity
                                style={[styles.filePicker, selectedFile ? styles.fileSelected : null]}
                                onPress={handlePickDocument}>
                                <Ionicons
                                    name={selectedFile ? "checkmark-circle" : "document-attach-outline"}
                                    size={24}
                                    color={selectedFile ? "#4CD964" : "#007AFF"}
                                />
                                <ThemedText style={{color: selectedFile ? "#4CD964" : "#007AFF", fontWeight: '600'}}>
                                    {selectedFile ? selectedFile.assets![0].name : "Seleccionar PDF"}
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sendBtn, (sending || !selectedFile) && styles.btnDisabled]}
                                onPress={handleSendQuote}
                                disabled={sending || !selectedFile}>
                                {sending ? <ActivityIndicator color="#fff"/> : (
                                    <>
                                        <ThemedText style={styles.sendBtnText}>Enviar Presupuesto</ThemedText>
                                        <Ionicons name="send" size={18} color="#fff" style={{marginLeft: 10}}/>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>

            <Modal visible={isImageZoomVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setImageZoomVisible(false)}>
                        <Ionicons name="close" size={30} color="#FFF"/>
                    </TouchableOpacity>
                    <Image
                        source={{uri: quote.evidencia_url || ''}}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
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
                    fecha_preferida:quote.fecha_preferida as string,
                }}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    scrollContent: {paddingHorizontal: 20, paddingBottom: 40},
    headerRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15},
    backBtn: {padding: 5},
    clientCard: {
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.15)',
        backgroundColor: 'rgba(150,150,150,0.05)',
        position: 'relative'
    },
    statusBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0,122,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10
    },
    statusText: {
        color: '#007AFF',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    serviceTitle: {fontSize: 18, marginBottom: 8, paddingRight: 80},
    infoLine: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6},
    infoText: {fontSize: 14, opacity: 0.6},
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        opacity: 0.5,
        marginBottom: 8,
        letterSpacing: 1
    },
    descText: {fontSize: 16, marginBottom: 20, lineHeight: 24, opacity: 0.9},
    imageWrapper: {
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
        height: 220,
        backgroundColor: 'rgba(150,150,150,0.1)'
    },
    previewImage: {width: '100%', height: '100%'},
    zoomIconOverlay: {
        position: 'absolute', bottom: 12, right: 12,
        backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 10
    },
    divider: {height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: 25},
    inputLabel: {fontSize: 14, fontWeight: '600', marginBottom: 10},
    priceInputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, paddingHorizontal: 15, marginBottom: 20,
        backgroundColor: 'rgba(150,150,150,0.08)',
        borderWidth: 1, borderColor: 'rgba(150,150,150,0.1)'
    },
    currencySymbol: {fontSize: 18, fontWeight: 'bold', marginRight: 5},
    priceInput: {flex: 1, paddingVertical: 15, fontSize: 18},
    filePicker: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed',
        borderRadius: 12, padding: 20, backgroundColor: 'rgba(0,122,255,0.05)'
    },
    fileSelected: {borderColor: '#4CD964', backgroundColor: 'rgba(76,217,100,0.05)'},
    fileName: {fontSize: 12, opacity: 0.5, marginTop: 8, textAlign: 'center'},
    sendBtn: {
        backgroundColor: '#007AFF', padding: 20, borderRadius: 16, marginTop: 30,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
    },
    btnDisabled: {opacity: 0.5},
    sendBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
    modalOverlay: {flex: 1, backgroundColor: '#000', justifyContent: 'center'},
    closeBtn: {position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10},
    fullImage: {width: '100%', height: '80%'},

    acceptedCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(76,217,100,0.05)',
        padding: 25,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(76,217,100,0.3)'
    },
    assignBtn: {
        backgroundColor: '#34C759',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    pendingCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,149,0,0.05)',
        padding: 25,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,149,0,0.3)'
    }
});