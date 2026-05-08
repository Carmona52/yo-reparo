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
import {Buffer} from 'buffer';

import {ThemedView} from '@/components/themed-view';
import {ThemedText} from '@/components/themed-text';
import {toTimestamp} from '@/utils/date';
import {supabase} from '@/libs/supabase';
import {Job} from '@/libs/types/job';
import {G, COLORS, shadow} from '@/styles/global-styles';

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

interface EditJobModalProps {
    visible: boolean;
    onClose: () => void;
    job: Job;
    onSaveSuccess: (updatedJob: Job) => void;
    onDeleteSuccess: () => void;
}

export const EditJobModal = ({
                                 visible,
                                 onClose,
                                 job,
                                 onSaveSuccess,
                                 onDeleteSuccess,
                             }: EditJobModalProps) => {
    const {textColor, mutedText, surfaceBg, inputBg, borderColor, placeholderColor} = useAppTheme();

    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        address: '',
        image_url: '',
        price: '',
        fecha_cita: new Date(),
    });

    useEffect(() => {
        if (visible && job) {
            let fecha = new Date();
            if (job.fecha_cita) {
                const parsed = new Date(job.fecha_cita);
                if (!isNaN(parsed.getTime())) fecha = parsed;
            }
            setForm({
                title: job.title ?? '',
                description: job.description ?? '',
                address: job.address ?? '',
                image_url: job.image_url ?? '',
                price: job.price != null ? String(job.price) : '',
                fecha_cita: fecha,
            });
        }
    }, [visible, job]);

    const handlePickImage = async (useCamera: boolean) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesitan permisos para la cámara o galería.');
            return;
        }
        const options = {allowsEditing: true, aspect: [4, 3] as [number, number], quality: 0.5, base64: true};
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
            const fileName = `job_${Date.now()}.jpg`;
            const filePath = `uploads/${fileName}`;
            const {error} = await supabase.storage
                .from('jobs')
                .upload(filePath, Buffer.from(base64, 'base64'), {contentType: 'image/jpeg'});
            if (error) throw error;
            const {data: {publicUrl}} = supabase.storage.from('jobs').getPublicUrl(filePath);
            setForm(prev => ({...prev, image_url: publicUrl}));
        } catch (e: any) {
            Alert.alert('Error de subida', e.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const onChangeDate = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selected && event.type !== 'dismissed') {
            const updated = new Date(form.fecha_cita);
            updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
            setForm(prev => ({...prev, fecha_cita: updated}));
        }
    };

    const onChangeTime = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selected && event.type !== 'dismissed') {
            const updated = new Date(form.fecha_cita);
            updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
            setForm(prev => ({...prev, fecha_cita: updated}));
        }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.address.trim()) {
            return Alert.alert('Campos incompletos', 'Título y dirección son requeridos.');
        }
        setLoading(true);
        try {
            const {error} = await supabase
                .from('jobs')
                .update({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    address: form.address.trim(),
                    image_url: form.image_url,
                    price: form.price ? parseFloat(form.price) : 0,
                    fecha_cita: toTimestamp(form.fecha_cita),
                })
                .eq('id', job.id);
            if (error) throw error;
            const updatedJob: Job = {
                ...job,
                title: form.title.trim(),
                description: form.description.trim(),
                address: form.address.trim(),
                image_url: form.image_url,
                price: form.price ? parseFloat(form.price) : 0,
                fecha_cita: toTimestamp(form.fecha_cita),
            };
            Alert.alert('¡Éxito!', 'Trabajo actualizado correctamente.');
            onSaveSuccess(updatedJob);
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Eliminar Trabajo',
            `¿Estás seguro de que deseas eliminar "${job.title}"? Esta acción no se puede deshacer.`,
            [
                {text: 'Cancelar', style: 'cancel'},
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const {error} = await supabase.from('jobs').delete().eq('id', job.id);
                            if (error) throw error;
                            onClose();
                            onDeleteSuccess();
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={G.flex1}>
                <View style={[G.modalHeader, {borderBottomColor: borderColor}]}>
                    <View>
                        <ThemedText type="title">Editar Trabajo</ThemedText>
                        <ThemedText style={{fontSize: 13, opacity: 0.5, marginTop: 2, color: mutedText}}
                                    numberOfLines={1}>
                            {job?.title}
                        </ThemedText>
                    </View>
                    <TouchableOpacity onPress={onClose} disabled={loading || deleting}>
                        <Ionicons name="close-circle" size={32} color={placeholderColor}/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={G.modalForm} showsVerticalScrollIndicator={false}>
                    {/* Foto */}
                    <ThemedText style={G.sectionLabel}>Foto de Evidencia</ThemedText>
                    <View style={[G.imageContainer, {height: 180}]}>
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

                    {/* Fecha / hora */}
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
                                    hour12: true,
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

                    {/* Título */}
                    <ThemedText style={G.sectionLabel}>Título del Servicio</ThemedText>
                    <TextInput
                        style={[G.inputBordered, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        placeholder="Título"
                        placeholderTextColor={placeholderColor}
                        value={form.title}
                        onChangeText={t => setForm(p => ({...p, title: t}))}
                    />

                    {/* Precio */}
                    <ThemedText style={G.sectionLabel}>Presupuesto ($)</ThemedText>
                    <TextInput
                        style={[G.inputBordered, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        keyboardType="numeric"
                        value={form.price}
                        onChangeText={t => setForm(p => ({...p, price: t.replace(/[^0-9.]/g, '')}))}
                    />

                    {/* Dirección */}
                    <ThemedText style={G.sectionLabel}>Dirección</ThemedText>
                    <TextInput
                        style={[G.inputBordered, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        placeholder="Dirección del cliente"
                        placeholderTextColor={placeholderColor}
                        value={form.address}
                        onChangeText={t => setForm(p => ({...p, address: t}))}
                    />

                    {/* Descripción */}
                    <ThemedText style={G.sectionLabel}>Descripción</ThemedText>
                    <TextInput
                        style={[G.textArea, {color: textColor, backgroundColor: inputBg, borderColor}]}
                        multiline
                        placeholder="Descripción detallada..."
                        placeholderTextColor={placeholderColor}
                        value={form.description}
                        onChangeText={t => setForm(p => ({...p, description: t}))}
                    />

                    {/* Botón guardar */}
                    <TouchableOpacity
                        style={[G.btnPrimary, (loading || deleting) && G.btnDisabled, {marginTop: 30, gap: 8}]}
                        onPress={handleSave}
                        disabled={loading || deleting}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.onPrimary}/>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.onPrimary}/>
                                <ThemedText style={G.btnText}>Guardar Cambios</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Botón eliminar */}
                    <TouchableOpacity
                        style={[G.btnDanger, (loading || deleting) && G.btnDisabled, {marginTop: 12}]}
                        onPress={handleDelete}
                        disabled={loading || deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator color={COLORS.danger}/>
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={18} color={COLORS.danger}/>
                                <ThemedText style={G.btnTextDanger}>Eliminar Trabajo</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{height: 60}}/>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};