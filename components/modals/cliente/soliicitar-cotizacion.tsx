import React, {useState, useCallback, useEffect} from 'react';
import {
    Modal, TextInput, ScrollView, Alert, ActivityIndicator,
    StyleSheet, TouchableOpacity, View, Platform, Image
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {Buffer} from 'buffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {useThemeColor} from '@/hooks/use-theme-color';

interface CreateQuoteModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INITIAL_FORM = {
    servicio: '',
    descripcion: '',
    evidencia_url: '',
    direccion: '',
    fecha_preferida: new Date().toISOString(),
};

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
    const [tempDate, setTempDate] = useState(new Date());
    const [form, setForm] = useState(INITIAL_FORM);
    const [profile, setProfile] = useState<{ name: string } | null>(null);

    const textColor = useThemeColor({}, 'text');

    const updateForm = (key: string, value: any) => {
        setForm(prev => ({...prev, [key]: value}));
    };

    const handleReset = useCallback(() => {
        setForm(INITIAL_FORM);
        setTempDate(new Date());
        setLoading(false);
        setUploadingImage(false);
        setShowServiceList(false);
    }, []);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(tempDate);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setTempDate(newDate);
            updateForm('fecha_preferida', newDate.toISOString());
            if (Platform.OS === 'android') setShowTimePicker(true);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(tempDate);
            newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setTempDate(newDate);
            updateForm('fecha_preferida', newDate.toISOString());
        }
    };

    const handlePickImage = async (useCamera: boolean) => {
        const {status} = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Error", "Permisos necesarios.");

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({allowsEditing: true, quality: 0.5, base64: true})
            : await ImagePicker.launchImageLibraryAsync({allowsEditing: true, quality: 0.5, base64: true});

        if (!result.canceled && result.assets[0].base64) uploadImage(result.assets[0].base64);
    };

    const uploadImage = async (base64: string) => {
        setUploadingImage(true);
        try {
            const fileName = `job_${Date.now()}.jpg`;
            const filePath = `cotizaciones/${fileName}`;
            const {error: uploadError} = await supabase.storage
                .from('jobs')
                .upload(filePath, Buffer.from(base64, 'base64'), {contentType: 'image/jpeg'});
            if (uploadError) throw uploadError;
            const {data: {publicUrl}} = supabase.storage.from('jobs').getPublicUrl(filePath);
            updateForm('evidencia_url', publicUrl);
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setUploadingImage(false);
        }
    };

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

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        const {servicio, descripcion, direccion} = form;
        const {data: {user}} = await supabase.auth.getUser();

        if (!servicio || !descripcion.trim() || !direccion.trim()) {
            return Alert.alert("Atención", "Campos obligatorios vacíos.");
        }

        setLoading(true);
        try {
            const {data: job, error} = await supabase
                .from('cotizaciones')
                .insert([{
                    ...form,
                    created_by: user?.id,
                    estado: 'Pendiente'
                }])
                .select()
                .single();

            if (error) throw error;

            Alert.alert("Éxito", "Solicitud enviada.");
            handleReset();
            onSuccess();
            onClose();

            if (job) {
                supabase.functions.invoke('send-to-admins', {
                    body: {
                        role: 'owner',
                        title: 'Nueva Cotización Recibida',
                        body: `${profile?.name || 'Un cliente'} ha solicitado: ${servicio}`,
                        data: {
                            quoteId: job.id,
                            type: 'new_quote'
                        },
                    }
                }).then(({error: funcError}) => {
                    if (funcError) console.error('Error enviando notificación:', funcError);
                    else console.log('Admins notificados correctamente');
                });
            }

        } catch (e: any) {
            Alert.alert("Error", e.message);
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
                        <Ionicons name="close" size={24} color={textColor}/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

                    <ThemedText style={styles.label}>Foto del problema</ThemedText>
                    <View style={styles.imageContainer}>
                        {form.evidencia_url ? (
                            <Image source={{uri: form.evidencia_url}} style={styles.imagePreview}/>
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="camera-outline" size={40} color="#888"/>
                                <ThemedText style={styles.placeholderText}>Sube una foto para el
                                    diagnóstico</ThemedText>
                            </View>
                        )}
                        {uploadingImage && <View style={styles.loader}><ActivityIndicator color="#007AFF"/></View>}
                        <View style={styles.imageRow}>
                            <TouchableOpacity style={styles.imageBtn} onPress={() => handlePickImage(false)}><Ionicons
                                name="images" size={16} color="#fff"/><ThemedText
                                style={styles.imageBtnText}>Galería</ThemedText></TouchableOpacity>
                            <TouchableOpacity style={styles.imageBtn} onPress={() => handlePickImage(true)}><Ionicons
                                name="camera" size={16} color="#fff"/><ThemedText
                                style={styles.imageBtnText}>Cámara</ThemedText></TouchableOpacity>
                        </View>
                    </View>


                    <ThemedText style={styles.label}>📍 Ubicación</ThemedText>
                    <TextInput
                        style={[styles.input, {color: textColor, backgroundColor: 'rgba(150,150,150,0.1)'}]}
                        placeholder="Dirección completa..."
                        placeholderTextColor="rgba(150,150,150,0.5)"
                        value={form.direccion}
                        onChangeText={t => updateForm('direccion', t)}
                    />

                    <ThemedText style={styles.label}>📅 Fecha y Hora sugerida</ThemedText>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                            <ThemedText>{tempDate.toLocaleDateString()}</ThemedText>
                            <Ionicons name="calendar-outline" size={16} color="#007AFF"/>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                            <ThemedText>{tempDate.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</ThemedText>
                            <Ionicons name="time-outline" size={16} color="#007AFF"/>
                        </TouchableOpacity>
                    </View>

                    {(showDatePicker || showTimePicker) && (
                        <DateTimePicker value={tempDate} mode={showDatePicker ? "date" : "time"}
                                        minimumDate={new Date()}
                                        onChange={showDatePicker ? onDateChange : onTimeChange}/>
                    )}

                    <ThemedText style={styles.label}>Tipo de Servicio</ThemedText>
                    <ThemedView style={styles.assignmentBox}>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            disabled={loading}
                            onPress={() => setShowServiceList(!showServiceList)}>
                            <View style={styles.workerInfoRow}>
                                <View
                                    style={[styles.miniAvatar, {backgroundColor: selectedServiceData ? '#007AFF' : 'rgba(150,150,150,0.2)'}]}>
                                    <Ionicons name={(selectedServiceData?.icon as any) || "construct-outline"} size={16}
                                              color="#fff"/>
                                </View>
                                <ThemedText type="defaultSemiBold" style={styles.workerNameText}>
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
                                        <ThemedText
                                            style={form.servicio === s.value && {color: '#007AFF', fontWeight: 'bold'}}>
                                            {s.label}
                                        </ThemedText>
                                        {form.servicio === s.value &&
                                            <Ionicons name="checkmark-circle" size={18} color="#007AFF"/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ThemedView>
                    <ThemedText style={styles.label}>Descripción</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea, {
                            color: textColor,
                            backgroundColor: 'rgba(150,150,150,0.1)'
                        }]}
                        multiline
                        placeholder="Detalles del problema..."
                        placeholderTextColor="rgba(150,150,150,0.5)"
                        value={form.descripcion}
                        onChangeText={t => updateForm('descripcion', t)}
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, (loading || uploadingImage) && styles.disabled]}
                        onPress={handleSave}
                        disabled={loading || uploadingImage}
                    >
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <ThemedText style={styles.submitText}>Enviar Cotización</ThemedText>}
                    </TouchableOpacity>

                    <View style={{height: 50}}/>
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
    label: {fontSize: 12, fontWeight: '800', marginTop: 15, marginBottom: 8, opacity: 0.6, textTransform: 'uppercase'},
    input: {borderRadius: 12, padding: 15, fontSize: 16},
    textArea: {height: 100, textAlignVertical: 'top'},
    imageContainer: {
        height: 180,
        backgroundColor: 'rgba(150,150,150,0.05)',
        borderRadius: 15,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)'
    },
    imagePreview: {width: '100%', height: '100%'},
    placeholder: {alignItems: 'center'},
    placeholderText: {fontSize: 11, opacity: 0.5, marginTop: 5},
    imageRow: {position: 'absolute', bottom: 12, flexDirection: 'row', gap: 10},
    imageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        gap: 5
    },
    imageBtnText: {color: '#fff', fontSize: 12, fontWeight: '600'},
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    row: {flexDirection: 'row', gap: 10},
    pickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(150,150,150,0.1)',
        padding: 15,
        borderRadius: 12
    },

    // ESTILOS DEL DROPDOWN PERSONALIZADO
    assignmentBox: {
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)'
    },
    dropdownTrigger: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    workerInfoRow: {flexDirection: 'row', alignItems: 'center'},
    miniAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    workerNameText: {fontSize: 16},
    dropdownContent: {marginTop: 15, borderTopWidth: 1, borderColor: 'rgba(150, 150, 150, 0.1)', paddingTop: 10},
    workerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 5,
        alignItems: 'center'
    },

    submitBtn: {backgroundColor: '#007AFF', padding: 18, borderRadius: 15, marginTop: 30, alignItems: 'center'},
    submitText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
    disabled: {opacity: 0.5}
});