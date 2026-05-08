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
import * as ImagePicker from 'expo-image-picker';
import {Buffer} from 'buffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import {toTimestamp} from '@/utils/date';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {G, COLORS, shadow} from "@/styles/global-styles";

// Hook de tema local
const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
        placeholderColor: COLORS.placeholder,
    };
};

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
    {label: "💻 Domótica", value: "Domótica", icon: "computer"},
    {label: "🛠️ Otro", value: "Otro", icon: "construct"},
];

export const CreateQuoteModal = ({visible, onClose, onSuccess}: CreateQuoteModalProps) => {
    const {textColor, mutedText, inputBg, borderColor, placeholderColor} = useAppTheme();

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
                    fecha_preferida,
                    created_by: user?.id,
                    estado: 'Pendiente'
                }])
                .select()
                .single();

            if (error) throw error;

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
            <ThemedView style={G.flex1}>
                <View style={[G.modalHeader, {borderBottomColor: borderColor}]}>
                    <ThemedText type="subtitle">Nueva Solicitud</ThemedText>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Ionicons name="close" size={26} color={textColor}/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={G.modalForm} showsVerticalScrollIndicator={false}>
                    <ThemedText style={G.sectionLabel}>Foto del problema</ThemedText>
                    <View style={[G.imageContainer, {height: 200, marginBottom: 10}]}>
                        {form.evidencia_url ? (
                            <Image source={{uri: form.evidencia_url}} style={G.imageFull}/>
                        ) : (
                            <View style={G.center}>
                                <Ionicons name="camera-outline" size={44} color={COLORS.mutedIcon}/>
                                <ThemedText style={[G.infoValueSm, {color: mutedText, marginTop: 8}]}>
                                    Sube una foto para el diagnóstico
                                </ThemedText>
                            </View>
                        )}
                        {uploadingImage && (
                            <View style={G.loaderOverlay}>
                                <ActivityIndicator color={COLORS.primary}/>
                            </View>
                        )}
                        <View style={[G.imageButtonsRow, {bottom: 15}]}>
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

                    <ThemedText style={G.sectionLabel}>📍 Ubicación</ThemedText>
                    <TextInput
                        style={[G.inputBordered, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        placeholder="Dirección completa..."
                        placeholderTextColor={placeholderColor}
                        value={form.direccion}
                        onChangeText={t => updateForm('direccion', t)}
                        editable={!loading}
                    />

                    <ThemedText style={G.sectionLabel}>📅 Fecha y Hora sugerida</ThemedText>
                    <View style={G.pickerRow}>
                        <TouchableOpacity style={G.pickerBtn} onPress={() => setShowDatePicker(true)}>
                            <ThemedText style={G.pickerBtnText}>
                                {selectedDate.toLocaleDateString('es-ES')}
                            </ThemedText>
                            <Ionicons name="calendar-outline" size={18} color={COLORS.primary}/>
                        </TouchableOpacity>
                        <TouchableOpacity style={G.pickerBtn} onPress={() => setShowTimePicker(true)}>
                            <ThemedText style={G.pickerBtnText}>
                                {selectedDate.toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </ThemedText>
                            <Ionicons name="time-outline" size={18} color={COLORS.primary}/>
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

                    <ThemedText style={G.sectionLabel}>Tipo de Servicio</ThemedText>
                    <View style={[G.dropdownBox, {padding: 16}]}>
                        <TouchableOpacity style={G.dropdownTrigger}
                                          onPress={() => setShowServiceList(!showServiceList)}>
                            <View style={G.row}>
                                <View style={[G.iconBadgeSm, {
                                    backgroundColor: selectedServiceData ? COLORS.primary : COLORS.surfaceStrong,
                                    marginRight: 12
                                }]}>
                                    <Ionicons name={(selectedServiceData?.icon as any) || "construct-outline"} size={16}
                                              color={COLORS.onPrimary}/>
                                </View>
                                <ThemedText type="defaultSemiBold">
                                    {selectedServiceData ? selectedServiceData.label : "Selecciona un servicio"}
                                </ThemedText>
                            </View>
                            <Ionicons name={showServiceList ? "chevron-up" : "chevron-down"} size={20}
                                      color={COLORS.primary}/>
                        </TouchableOpacity>

                        {showServiceList && (
                            <View style={G.dropdownContent}>
                                {SERVICIOS.map(s => (
                                    <TouchableOpacity key={s.value} style={G.dropdownOption} onPress={() => {
                                        updateForm('servicio', s.value);
                                        setShowServiceList(false);
                                    }}>
                                        <ThemedText style={form.servicio === s.value && G.dropdownOptionActive}>
                                            {s.label}
                                        </ThemedText>
                                        {form.servicio === s.value &&
                                            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary}/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <ThemedText style={G.sectionLabel}>Descripción</ThemedText>
                    <TextInput
                        style={[G.textArea, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        multiline
                        placeholder="Describe brevemente el problema..."
                        placeholderTextColor={placeholderColor}
                        value={form.descripcion}
                        onChangeText={t => updateForm('descripcion', t)}
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[G.btnPrimary, (loading || uploadingImage) && G.btnDisabled, {marginTop: 35}]}
                        onPress={handleSave}
                        disabled={loading || uploadingImage}
                    >
                        {loading ? <ActivityIndicator color={COLORS.onPrimary}/> :
                            <ThemedText style={G.btnText}>Enviar Cotización</ThemedText>}
                    </TouchableOpacity>

                    <View style={{height: 60}}/>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};