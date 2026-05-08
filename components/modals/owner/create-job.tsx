import React, {useState, useEffect} from 'react';
import {
    Modal,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    View,
    Platform,
    Image,
    useColorScheme,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {toTimestamp} from '@/utils/date';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {createJob} from '@/libs/owner/jobs/create-jobs';
import {getAllWorkers} from '@/libs/owner/workers/get-workers';
import {Worker} from '@/libs/types/worker';
import {supabase} from "@/libs/supabase";
import {G, COLORS} from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        borderColor: COLORS.border,
        placeholderColor: COLORS.placeholder,
    };
};

interface InitialJobData {
    title?: string;
    description?: string;
    address?: string;
    image_url?: string;
    quoteId?: string;
    fecha_preferida?: string;
    cotizacion_id?: string;
    costo?: number;
    name_client?: string;
}

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: InitialJobData;
}

export const CreateJobModal = ({visible, onClose, onSuccess, initialData}: CreateJobModalProps) => {
    const {textColor, inputBg, surfaceBg, borderColor, placeholderColor} = useAppTheme();
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
        name_client: '',
    });

    useEffect(() => {
        let isMounted = true;
        if (visible) {
            const fetchWorkers = async () => {
                try {
                    const data = await getAllWorkers();
                    if (isMounted) {
                        setWorkers(Array.isArray(data) ? data : data.data || []);
                    }
                } catch (error) {
                    console.error("Error al cargar trabajadores:", error);
                }
            };
            fetchWorkers();
        }
        return () => {
            isMounted = false; // Cleanup para evitar actualizaciones en componentes desmontados
        };
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
                    name_client: initialData.name_client || ''
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
                    name_client: '',
                });
            }
        }
    }, [visible, initialData]);

    const handlePickImage = async (useCamera: boolean) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
            Alert.alert("Permiso denegado", "Se necesitan permisos para la cámara o galería.");
            return;
        }

        // Eliminado base64: true para optimizar memoria
        const result = useCamera
            ? await ImagePicker.launchCameraAsync({allowsEditing: true, aspect: [4, 3], quality: 0.5})
            : await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5
            });

        if (!result.canceled && result.assets[0].uri) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setUploadingImage(true);
        try {
            const fileName = `job_${Date.now()}.jpg`;
            const filePath = `uploads/${fileName}`;

            // Convertimos la URI local en un Blob mediante fetch
            const response = await fetch(uri);
            const blob = await response.blob();

            const {error} = await supabase.storage
                .from('jobs')
                .upload(filePath, blob, {contentType: 'image/jpeg'});

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
                fecha_cita: toTimestamp(form.fecha_cita),
                created_by: user.id,
                status: 'Pendiente',
                cotizacion_id: form.cotizacion_id,
                price: form.price ? parseFloat(form.price) : 0,
                name_client: form.name_client,
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

    const assignedWorker = workers.find(w => w.id === form.worker_id);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={G.flex1}>
                <View style={[G.modalHeader, {borderBottomColor: borderColor}]}>
                    <ThemedText type="title">Nuevo Trabajo</ThemedText>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Ionicons name="close-circle" size={32} color={placeholderColor}/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={G.modalForm} showsVerticalScrollIndicator={false}>
                    <ThemedText style={G.sectionLabel}>Foto de Evidencia</ThemedText>
                    <View style={[G.imageContainer, {height: 180, marginBottom: 10}]}>
                        {form.image_url ? (
                            <Image source={{uri: form.image_url}} style={G.imageFull}/>
                        ) : (
                            <Ionicons name="image-outline" size={40} color={placeholderColor}/>
                        )}
                        {uploadingImage && (
                            <View style={G.loaderOverlay}>
                                <ActivityIndicator color={COLORS.primary}/>
                            </View>
                        )}
                        <View style={[G.imageButtonsRow, {bottom: 10}]}>
                            <TouchableOpacity style={G.imageActionBtn} onPress={() => handlePickImage(false)}>
                                <Ionicons name="images" size={16} color={COLORS.onPrimary}/>
                                <ThemedText style={G.imageActionBtnText}>Galería</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={G.imageActionBtn} onPress={() => handlePickImage(true)}>
                                <Ionicons name="camera" size={16} color={COLORS.onPrimary}/>
                                <ThemedText style={G.imageActionBtnText}>Cámara</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ThemedText style={G.sectionLabel}>Programación</ThemedText>
                    <View style={G.pickerRow}>
                        <TouchableOpacity style={G.pickerBtn} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={18} color={COLORS.primary}/>
                            <ThemedText style={G.pickerBtnText}>
                                {form.fecha_cita.toLocaleDateString('es-MX')}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={G.pickerBtn} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={18} color={COLORS.primary}/>
                            <ThemedText style={G.pickerBtnText}>
                                {form.fecha_cita.toLocaleTimeString('es-MX', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={form.fecha_cita}
                            mode="date"
                            display="default"
                            onChange={onChangeDate}
                            minimumDate={new Date()}
                        />
                    )}
                    {showTimePicker && (
                        <DateTimePicker
                            value={form.fecha_cita}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={onChangeTime}
                        />
                    )}

                    <ThemedText style={G.sectionLabel}>Asignación</ThemedText>
                    <View style={[G.dropdownBox, {padding: 15}]}>
                        <TouchableOpacity style={G.dropdownTrigger} onPress={() => setShowWorkerList(!showWorkerList)}>
                            <View style={G.row}>
                                <View
                                    style={[G.avatarSm, {
                                        width: 30,
                                        height: 30,
                                        borderRadius: 15,
                                        backgroundColor: assignedWorker ? COLORS.primary : COLORS.surfaceStrong,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 10
                                    }]}
                                >
                                    <ThemedText style={{color: COLORS.onPrimary, fontWeight: 'bold'}}>
                                        {assignedWorker?.name[0] || '?'}
                                    </ThemedText>
                                </View>
                                <ThemedText type="defaultSemiBold">
                                    {assignedWorker ? assignedWorker.name : "Seleccionar trabajador"}
                                </ThemedText>
                            </View>
                            <Ionicons name={showWorkerList ? "chevron-up" : "chevron-down"} size={20}
                                      color={COLORS.primary}/>
                        </TouchableOpacity>
                        {showWorkerList && (
                            <View style={G.dropdownContent}>
                                {workers.map(w => (
                                    <TouchableOpacity
                                        key={w.id}
                                        style={G.dropdownOption}
                                        onPress={() => {
                                            setForm({...form, worker_id: w.id});
                                            setShowWorkerList(false);
                                        }}
                                    >
                                        <ThemedText style={form.worker_id === w.id && G.dropdownOptionActive}>
                                            {w.name}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <ThemedText style={G.sectionLabel}>Datos del Servicio</ThemedText>
                    <TextInput
                        style={[G.inputBordered, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        placeholder="Título"
                        placeholderTextColor={placeholderColor}
                        value={form.title}
                        onChangeText={t => setForm(p => ({...p, title: t}))}
                    />

                    <ThemedText style={G.sectionLabel}>Presupuesto ($)</ThemedText>
                    <TextInput
                        style={[G.inputBordered, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        keyboardType="numeric"
                        value={form.price}
                        // Solo permite números y 1 solo punto decimal
                        onChangeText={t => setForm(p => ({
                            ...p,
                            price: t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                        }))}
                    />

                    <TextInput
                        style={[G.inputBordered, {
                            color: textColor,
                            backgroundColor: inputBg,
                            borderColor,
                            marginTop: 15
                        }]}
                        placeholder="Dirección"
                        placeholderTextColor={placeholderColor}
                        value={form.address}
                        onChangeText={t => setForm(p => ({...p, address: t}))}
                    />

                    <TextInput
                        style={[G.inputBordered, {
                            color: textColor,
                            backgroundColor: inputBg,
                            borderColor,
                            marginTop: 15
                        }]}
                        placeholder="Nombre del Cliente"
                        placeholderTextColor={placeholderColor}
                        value={form.name_client}
                        onChangeText={t => setForm(p => ({...p, name_client: t}))}
                    />

                    <TextInput
                        style={[G.textArea, {color: textColor, backgroundColor: inputBg, borderColor, marginTop: 15}]}
                        multiline
                        placeholder="Descripción detallada..."
                        placeholderTextColor={placeholderColor}
                        value={form.description}
                        onChangeText={t => setForm(p => ({...p, description: t}))}
                    />

                    <TouchableOpacity
                        style={[G.btnPrimary, loading && G.btnDisabled, {marginTop: 30}]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={COLORS.onPrimary}/> : (
                            <ThemedText style={G.btnText}>Confirmar Trabajo</ThemedText>
                        )}
                    </TouchableOpacity>

                    <View style={{height: 60}}/>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};