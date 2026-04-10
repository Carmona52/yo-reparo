import React, {useState, useEffect} from 'react';
import {
    Modal,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Image
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {Buffer} from 'buffer';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {createJob} from '@/libs/owner/jobs/create-jobs';
import {getAllWorkers} from '@/libs/owner/workers/get-workers';
import {Worker} from '@/libs/types/worker';
import {supabase} from "@/libs/supabase";
import {useThemeColor} from '@/hooks/use-theme-color';

interface InitialJobData {
    title?: string;
    description?: string;
    address?: string;
    image_url?: string;
    quoteId?: string;
    fecha_preferida?: string;
    cotizacion_id?: string;
    costo?: number;
}

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: InitialJobData;
}

export const CreateJobModal = ({visible, onClose, onSuccess, initialData}: CreateJobModalProps) => {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [showWorkerList, setShowWorkerList] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        address: '',
        image_url: '',
        worker_id: null as string | null,
        fecha_cita: new Date(),
        cotizacion_id: undefined as string | undefined,
        price: '',
    });

    useEffect(() => {
        if (visible) {
            const fetchWorkers = async () => {
                try {
                    const data = await getAllWorkers();
                    setWorkers(Array.isArray(data) ? data : data.data || []);
                } catch (error) {
                    console.error("Error al cargar trabajadores:", error);
                }
            };
            fetchWorkers();
        }
    }, [visible]);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                let dateFromQuote = new Date();
                if (initialData.fecha_preferida) {
                    dateFromQuote = new Date(initialData.fecha_preferida);
                    if (isNaN(dateFromQuote.getTime())) {
                        dateFromQuote = new Date(initialData.fecha_preferida.replace(' ', 'T'));
                    }
                }

                setForm({
                    title: initialData.title || '',
                    description: initialData.description || '',
                    address: initialData.address || '',
                    image_url: initialData.image_url || '',
                    fecha_cita: dateFromQuote,
                    worker_id: null,
                    cotizacion_id: initialData.cotizacion_id,
                    price: initialData.costo ? initialData.costo.toString() : '',
                });
            } else {
                setForm({
                    title: '',
                    description: '',
                    address: '',
                    image_url: '',
                    worker_id: null,
                    fecha_cita: new Date(),
                    cotizacion_id: undefined,
                    price: '',
                });
            }
        }
    }, [visible, initialData]);

    const toLocalISOString = (date: Date): string => {
        const offset = -date.getTimezoneOffset(); // en minutos
        const sign = offset >= 0 ? '+' : '-';
        const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds()) +
            sign + pad(offset / 60) + ':' + pad(offset % 60);
    };

    const handlePickImage = async (useCamera: boolean) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
            Alert.alert("Permiso denegado", "Se necesitan permisos para la cámara o galería.");
            return;
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true})
            : await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true
            });

        if (!result.canceled && result.assets[0].base64) {
            uploadImage(result.assets[0].base64);
        }
    };

    const uploadImage = async (base64: string) => {
        setUploadingImage(true);
        try {
            const fileName = `job_${Date.now()}.jpg`;
            const filePath = `uploads/${fileName}`;
            const {error} = await supabase.storage
                .from('jobs')
                .upload(filePath, Buffer.from(base64, 'base64'), {contentType: 'image/jpeg'});

            if (error) throw error;
            const {data: {publicUrl}} = supabase.storage.from('jobs').getPublicUrl(filePath);
            setForm(prev => ({...prev, image_url: publicUrl}));
        } catch (e: any) {
            Alert.alert("Error de subida", e.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.address) {
            return Alert.alert("Campos incompletos", "Título y dirección son requeridos.");
        }

        setLoading(true);
        try {
            const {data: {user}} = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa.");

            const dataToSave = {
                title: form.title,
                description: form.description,
                address: form.address,
                image_url: form.image_url,
                worker_id: form.worker_id,
                fecha_cita: toLocalISOString(form.fecha_cita),
                created_by: user.id,
                status: 'Pendiente',
                cotizacion_id: form.cotizacion_id,
                price: form.price ? parseFloat(form.price) : 0,
            };

            await createJob(dataToSave);
            Alert.alert("¡Éxito!", "Trabajo guardado.");
            onSuccess();
            onClose();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate && event.type !== 'dismissed') {
            const updated = new Date(form.fecha_cita);
            updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setForm(prev => ({...prev, fecha_cita: updated}));
        }
    };

    const onChangeTime = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedTime && event.type !== 'dismissed') {
            const updated = new Date(form.fecha_cita);
            updated.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            setForm(prev => ({...prev, fecha_cita: updated}));
        }
    };

    const textColor = useThemeColor({}, 'text');
    const placeholderColor = "#888888aa";
    const assignedWorker = workers.find(w => w.id === form.worker_id);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <ThemedText type="title">Nuevo Trabajo</ThemedText>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Ionicons name="close-circle" size={32} color="#888"/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                    <ThemedText style={styles.label}>Foto de Evidencia</ThemedText>
                    <View style={styles.imageContainer}>
                        {form.image_url ? <Image source={{uri: form.image_url}} style={styles.imagePreview}/> :
                            <Ionicons name="image-outline" size={40} color="#888"/>}
                        {uploadingImage &&
                            <View style={styles.loaderOverlay}><ActivityIndicator color="#0a7ea4"/></View>}
                        <View style={styles.imageButtons}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickImage(false)}><Ionicons
                                name="images" size={16} color="#fff"/><ThemedText
                                style={styles.actionBtnText}>Galería</ThemedText></TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickImage(true)}><Ionicons
                                name="camera" size={16} color="#fff"/><ThemedText
                                style={styles.actionBtnText}>Cámara</ThemedText></TouchableOpacity>
                        </View>
                    </View>

                    <ThemedText style={styles.label}>Programación</ThemedText>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={18} color="#0a7ea4"/>
                            <ThemedText
                                style={styles.dateTimeText}>{form.fecha_cita.toLocaleDateString('es-MX')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={18} color="#0a7ea4"/>
                            <ThemedText style={styles.dateTimeText}>{form.fecha_cita.toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            })}</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker &&
                        <DateTimePicker value={form.fecha_cita} mode="date" display="default" onChange={onChangeDate}
                                        minimumDate={new Date()}/>}
                    {showTimePicker &&
                        <DateTimePicker value={form.fecha_cita} mode="time" is24Hour={false} display="default"
                                        onChange={onChangeTime}/>}

                    <ThemedText style={styles.label}>Asignación</ThemedText>
                    <View style={styles.assignmentBox}>
                        <TouchableOpacity style={styles.dropdownTrigger}
                                          onPress={() => setShowWorkerList(!showWorkerList)}>
                            <View style={styles.workerInfoRow}>
                                <View
                                    style={[styles.miniAvatar, {backgroundColor: assignedWorker ? '#0a7ea4' : '#ccc'}]}>
                                    <ThemedText
                                        style={styles.avatarLetter}>{assignedWorker?.name[0] || '?'}</ThemedText>
                                </View>
                                <ThemedText
                                    type="defaultSemiBold">{assignedWorker ? assignedWorker.name : "Seleccionar trabajador"}</ThemedText>
                            </View>
                            <Ionicons name={showWorkerList ? "chevron-up" : "chevron-down"} size={20} color="#0a7ea4"/>
                        </TouchableOpacity>
                        {showWorkerList && (
                            <View style={styles.dropdownContent}>
                                {workers.map(w => (
                                    <TouchableOpacity key={w.id} style={styles.workerOption} onPress={() => {
                                        setForm({...form, worker_id: w.id});
                                        setShowWorkerList(false);
                                    }}>
                                        <ThemedText style={form.worker_id === w.id && {
                                            color: '#0a7ea4',
                                            fontWeight: 'bold'
                                        }}>{w.name}</ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <ThemedText style={styles.label}>Datos del Servicio</ThemedText>
                    <TextInput style={[styles.input, {color: textColor}]} placeholder="Título"
                               placeholderTextColor={placeholderColor} value={form.title}
                               onChangeText={t => setForm(p => ({...p, title: t}))}/>

                    <ThemedText style={styles.label}>Presupuesto ($)</ThemedText>
                    <TextInput
                        style={[styles.input, {color: textColor}]}
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        keyboardType="numeric"
                        value={form.price}
                        onChangeText={t => setForm(p => ({...p, price: t.replace(/[^0-9.]/g, '')}))}
                    />

                    <TextInput style={[styles.input, {color: textColor, marginTop: 15}]} placeholder="Dirección"
                               placeholderTextColor={placeholderColor} value={form.address}
                               onChangeText={t => setForm(p => ({...p, address: t}))}/>

                    <TextInput style={[styles.input, styles.textArea, {color: textColor, marginTop: 15}]} multiline
                               placeholder="Descripción detallada..." placeholderTextColor={placeholderColor}
                               value={form.description} onChangeText={t => setForm(p => ({...p, description: t}))}/>

                    <TouchableOpacity style={[styles.saveBtn, loading && styles.btnDisabled]} onPress={handleSave}
                                      disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <ThemedText style={styles.saveBtnText}>Confirmar Trabajo</ThemedText>}
                    </TouchableOpacity>

                    <View style={{height: 60}}/>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.1)'
    },
    form: {padding: 20},
    label: {fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', opacity: 0.6},
    input: {backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 12, padding: 15, fontSize: 16},
    textArea: {height: 100, textAlignVertical: 'top'},
    imageContainer: {
        height: 180,
        backgroundColor: 'rgba(150,150,150,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)'
    },
    imagePreview: {width: '100%', height: '100%'},
    imageButtons: {position: 'absolute', bottom: 10, flexDirection: 'row', gap: 10},
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a7ea4',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 5
    },
    actionBtnText: {color: '#fff', fontSize: 11, fontWeight: 'bold'},
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateTimeRow: {flexDirection: 'row', gap: 10},
    dateTimeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 126, 164, 0.05)',
        padding: 15,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(10, 126, 164, 0.1)'
    },
    dateTimeText: {color: '#0a7ea4', fontWeight: '600'},
    assignmentBox: {
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)'
    },
    dropdownTrigger: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    workerInfoRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    miniAvatar: {width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center'},
    avatarLetter: {color: '#fff', fontWeight: 'bold'},
    dropdownContent: {marginTop: 10, borderTopWidth: 1, borderColor: 'rgba(150,150,150,0.1)'},
    workerOption: {paddingVertical: 12},
    saveBtn: {backgroundColor: '#0a7ea4', padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center'},
    saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
    btnDisabled: {opacity: 0.5}
});