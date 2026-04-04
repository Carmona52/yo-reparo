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
    TextInput,
    Platform,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {cotizacionesService} from "@/libs/users/get-cotizacioes";
import {Cotizacion} from "@/libs/types/cotizaciones";
import {useThemeColor} from '@/hooks/use-theme-color';

export default function OwnerQuoteDetail() {
    const {id} = useLocalSearchParams();
    const router = useRouter();

    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isImageZoomVisible, setImageZoomVisible] = useState(false);

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

        setSending(true);
        try {
            const file = selectedFile.assets![0];
            const fileName = `presupuesto_${id}_${Date.now()}.pdf`;
            const filePath = `presupuestos/${fileName}`;

            const response = await fetch(file.uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const {error: uploadError} = await supabase.storage
                .from('cotizaciones')
                .upload(filePath, arrayBuffer, {contentType: 'application/pdf', upsert: true});

            if (uploadError) throw uploadError;

            const {data: {publicUrl}} = supabase.storage.from('cotizaciones').getPublicUrl(filePath);

            const {error: updateError} = await supabase
                .from('cotizaciones')
                .update({costo_estimado: costo, pdf_url: publicUrl, estado: 'Enviada'})
                .eq('id', id);

            if (updateError) throw updateError;

            Alert.alert("Éxito", "Cotización enviada.");
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator size="large"
                                                                             color="#007AFF"/></ThemedView>;
    if (!quote) return <ThemedView style={styles.center}><ThemedText>Error al cargar.</ThemedText></ThemedView>;

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
                            style={styles.imageWrapper}
                        >
                            <Image source={{uri: quote.evidencia_url}} style={styles.previewImage} resizeMode="cover"/>
                            <View style={styles.zoomIconOverlay}>
                                <Ionicons name="expand" size={20} color="#FFF"/>
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={styles.divider}/>

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
                        onPress={handlePickDocument}
                    >
                        <Ionicons
                            name={selectedFile ? "checkmark-circle" : "document-attach-outline"}
                            size={24}
                            color={selectedFile ? "#4CD964" : "#007AFF"}
                        />
                        <ThemedText style={{color: selectedFile ? "#4CD964" : "#007AFF", fontWeight: '600'}}>
                            {selectedFile ? "PDF Adjuntado" : "Seleccionar PDF"}
                        </ThemedText>
                    </TouchableOpacity>

                    {selectedFile && (
                        <ThemedText style={styles.fileName}>
                            {selectedFile.assets![0].name}
                        </ThemedText>
                    )}

                    <TouchableOpacity
                        style={[styles.sendBtn, (sending || !selectedFile) && styles.btnDisabled]}
                        onPress={handleSendQuote}
                        disabled={sending || !selectedFile}
                    >
                        {sending ? <ActivityIndicator color="#fff"/> : (
                            <>
                                <ThemedText style={styles.sendBtnText}>Enviar Presupuesto</ThemedText>
                                <Ionicons name="send" size={18} color="#fff" style={{marginLeft: 10}}/>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>

            {/* Modal de Zoom */}
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
    },
    serviceTitle: {fontSize: 18, marginBottom: 8},
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
    fullImage: {width: '100%', height: '80%'}
});