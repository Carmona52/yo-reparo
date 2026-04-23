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
import * as ImagePicker from 'expo-image-picker';
import {Buffer} from 'buffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import { toTimestamp } from '@/utils/date';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {useThemeColor} from '@/hooks/use-theme-color';

interface CreateQuoteModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SERVICIOS = [
    {label: "🚰 Servicios de plomería", value: "Servicio de Plomeria", icon: "water"},
    {label: "⚡ Servicios eléctricos", value: "Servicio Electrico", icon: "flash"},
    {label: "🧱 Albañilería y acabados", value: "Albañilería y acabados", icon: "hammer"},
    {label: "🌬️ Climatización", value: "Climatización y electrodomésticos", icon: "snow"},
    {label: "🔧 Mantenimiento General", value: "Mantenimiento General", icon: "build"},
    {label: "🛠️ Otro", value: "Otro", icon: "construct"},
];

export const CreateQuoteModal = ({visible, onClose, onSuccess}: CreateQuoteModalProps) => {
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showServiceList, setShowServiceList] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());

    const [form, setForm] = useState({
        servicio: '',
        descripcion: '',
        evidencia_url: '',
        direccion: '',
        fecha_preferida: toTimestamp(new Date())
    });

    const [profile, setProfile] = useState<{ name: string } | null>(null);

    const textColor = useThemeColor({}, 'text');
    const placeholderColor = "rgba(150,150,150,0.5)";

    useEffect(() => {
        if (visible) {
            const now = new Date();
            setSelectedDate(now);
            setForm({
                servicio: '',
                descripcion: '',
                evidencia_url: '',
                direccion: '',
                fecha_preferida: toTimestamp(now),
            });
            fetchProfile();
        }
    }, [visible]);

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


    const updateForm = (key: string, value: any) => {
        setForm(prev => ({...prev, [key]: value}));
    };


    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (event.type === 'set' && date) {
            const updatedDate = new Date(selectedDate);
            updatedDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

            setSelectedDate(updatedDate);
            updateForm('fecha_preferida', toTimestamp(updatedDate));

            if (Platform.OS === 'android') {
                setTimeout(() => setShowTimePicker(true), 100);
            }
        }
    };

    const onTimeChange = (event: any, time?: Date) => {
        setShowTimePicker(false);
        if (event.type === 'set' && time) {
            const updatedDate = new Date(selectedDate);
            updatedDate.setHours(time.getHours(), time.getMinutes());

            setSelectedDate(updatedDate);
            updateForm('fecha_preferida', toTimestamp(updatedDate));
        }
    };


    const handlePickImage = async (useCamera: boolean) => {
        const {status} = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') return Alert.alert("Error", "Se necesitan permisos para continuar.");

        const options: ImagePicker.ImagePickerOptions = {
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        };

        const result = useCamera
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled && result.assets[0].base64) {
            uploadImage(result.assets[0].base64);
        }
    };

    const uploadImage = async (base64: string) => {
        setUploadingImage(true);
        try {
            const fileName = `quote_${Date.now()}.jpg`;
            const filePath = `cotizaciones/${fileName}`;

            const {error: uploadError} = await supabase.storage
                .from('jobs')
                .upload(filePath, Buffer.from(base64, 'base64'), {contentType: 'image/jpeg'});

            if (uploadError) throw uploadError;

            const {data: {publicUrl}} = supabase.storage.from('jobs').getPublicUrl(filePath);
            updateForm('evidencia_url', publicUrl);
        } catch (e: any) {
            Alert.alert("Error de subida", e.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        const {servicio, descripcion, direccion, fecha_preferida} = form;
        const {data: {user}} = await supabase.auth.getUser();

        if (!servicio || !descripcion.trim() || !direccion.trim()) {
            return Alert.alert("Atención", "Por favor completa los campos obligatorios.");
        }

        setLoading(true);
        try {
            const {data: job, error} = await supabase
                .from('cotizaciones')
                .insert([{
                    ...form,
                    fecha_preferida, // ISOString corregido
                    created_by: user?.id,
                    estado: 'Pendiente'
                }])
                .select()
                .single();

            if (error) throw error;

            // Notificación a administradores
            if (job) {
                supabase.functions.invoke('send-to-admins', {
                    body: {
                        role: 'owner',
                        title: 'Nueva Cotización Recibida',
                        body: `${profile?.name || 'Un cliente'} ha solicitado: ${servicio}`,
                        data: {quoteId: job.id, type: 'new_quote'},
                    }
                }).catch(e => console.error("Error notify:", e));
            }

            Alert.alert("¡Éxito!", "Tu solicitud ha sido enviada.");
            onSuccess();
            onClose();
        } catch (e: any) {
            Alert.alert("Error al guardar", e.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedServiceData = SERVICIOS.find(s => s.value === form.servicio);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <ThemedText type="subtitle">Nueva Solicitud</ThemedText>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Ionicons name="close" size={26} color={textColor}/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

                    <ThemedText style={styles.label}>Foto del problema</ThemedText>
                    <View style={styles.imageContainer}>
                        {form.evidencia_url ? (
                            <Image source={{uri: form.evidencia_url}} style={styles.imagePreview}/>
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="camera-outline" size={44} color="#888"/>
                                <ThemedText style={styles.placeholderText}>Sube una foto para el
                                    diagnóstico</ThemedText>
                            </View>
                        )}
                        {uploadingImage && (
                            <View style={styles.loader}>
                                <ActivityIndicator color="#007AFF"/>
                            </View>
                        )}
                        <View style={styles.imageRow}>
                            <TouchableOpacity style={styles.imageBtn} onPress={() => handlePickImage(false)}>
                                <Ionicons name="images" size={16} color="#fff"/>
                                <ThemedText style={styles.imageBtnText}>Galería</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.imageBtn} onPress={() => handlePickImage(true)}>
                                <Ionicons name="camera" size={16} color="#fff"/>
                                <ThemedText style={styles.imageBtnText}>Cámara</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ThemedText style={styles.label}>📍 Ubicación</ThemedText>
                    <TextInput
                        style={[styles.input, {color: textColor}]}
                        placeholder="Dirección completa..."
                        placeholderTextColor={placeholderColor}
                        value={form.direccion}
                        onChangeText={t => updateForm('direccion', t)}
                        editable={!loading}
                    />

                    <ThemedText style={styles.label}>📅 Fecha y Hora sugerida</ThemedText>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                            <ThemedText style={styles.pickerBtnText}>
                                {selectedDate.toLocaleDateString('es-ES')}
                            </ThemedText>
                            <Ionicons name="calendar-outline" size={18} color="#007AFF"/>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                            <ThemedText style={styles.pickerBtnText}>
                                {selectedDate.toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </ThemedText>
                            <Ionicons name="time-outline" size={18} color="#007AFF"/>
                        </TouchableOpacity>
                    </View>

                    {(showDatePicker || showTimePicker) && (
                        <DateTimePicker
                            value={selectedDate}
                            mode={showDatePicker ? "date" : "time"}
                            minimumDate={new Date()}
                            onChange={showDatePicker ? onDateChange : onTimeChange}
                            locale="es-ES"
                        />
                    )}

                    <ThemedText style={styles.label}>Tipo de Servicio</ThemedText>
                    <View style={styles.assignmentBox}>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => setShowServiceList(!showServiceList)}
                        >
                            <View style={styles.workerInfoRow}>
                                <View
                                    style={[styles.miniAvatar, {backgroundColor: selectedServiceData ? '#007AFF' : 'rgba(150,150,150,0.2)'}]}>
                                    <Ionicons name={(selectedServiceData?.icon as any) || "construct-outline"} size={16}
                                              color="#fff"/>
                                </View>
                                <ThemedText type="defaultSemiBold">
                                    {selectedServiceData ? selectedServiceData.label : "Selecciona un servicio"}
                                </ThemedText>
                            </View>
                            <Ionicons name={showServiceList ? "chevron-up" : "chevron-down"} size={20} color="#007AFF"/>
                        </TouchableOpacity>

                        {showServiceList && (
                            <View style={styles.dropdownContent}>
                                {SERVICIOS.map(s => (
                                    <TouchableOpacity key={s.value} style={styles.workerOption} onPress={() => {
                                        updateForm('servicio', s.value);
                                        setShowServiceList(false);
                                    }}>
                                        <ThemedText style={form.servicio === s.value && styles.activeOption}>
                                            {s.label}
                                        </ThemedText>
                                        {form.servicio === s.value &&
                                            <Ionicons name="checkmark-circle" size={18} color="#007AFF"/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <ThemedText style={styles.label}>Descripción</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea, {color: textColor}]}
                        multiline
                        placeholder="Describe brevemente el problema..."
                        placeholderTextColor={placeholderColor}
                        value={form.descripcion}
                        onChangeText={t => updateForm('descripcion', t)}
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, (loading || uploadingImage) && styles.disabled]}
                        onPress={handleSave}
                        disabled={loading || uploadingImage}
                    >
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <ThemedText style={styles.submitText}>Enviar Cotización</ThemedText>}
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
    label: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 20,
        marginBottom: 8,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    input: {backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 14, padding: 15, fontSize: 16},
    textArea: {height: 110, textAlignVertical: 'top'},
    imageContainer: {
        height: 200,
        backgroundColor: 'rgba(150,150,150,0.05)',
        borderRadius: 18,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)'
    },
    imagePreview: {width: '100%', height: '100%', resizeMode: 'cover'},
    placeholder: {alignItems: 'center'},
    placeholderText: {fontSize: 11, opacity: 0.5, marginTop: 8},
    imageRow: {position: 'absolute', bottom: 15, flexDirection: 'row', gap: 10},
    imageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 22,
        gap: 6
    },
    imageBtnText: {color: '#fff', fontSize: 12, fontWeight: '700'},
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    row: {flexDirection: 'row', gap: 12},
    pickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(150,150,150,0.1)',
        padding: 16,
        borderRadius: 14
    },
    pickerBtnText: {fontSize: 15, fontWeight: '600'},
    assignmentBox: {
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)'
    },
    dropdownTrigger: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    workerInfoRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
    miniAvatar: {width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center'},
    dropdownContent: {marginTop: 15, borderTopWidth: 1, borderColor: 'rgba(150, 150, 150, 0.1)', paddingTop: 10},
    workerOption: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, alignItems: 'center'},
    activeOption: {color: '#007AFF', fontWeight: 'bold'},
    submitBtn: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 16,
        marginTop: 35,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    submitText: {color: '#fff', fontWeight: 'bold', fontSize: 17},
    disabled: {opacity: 0.5}
});