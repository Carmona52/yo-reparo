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

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateJobModal = ({visible, onClose, onSuccess}: CreateJobModalProps) => {
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

    const handlePickImage = async (useCamera: boolean) => {
        const permission = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permission.status !== 'granted') {
            Alert.alert("Permiso denegado", "Se necesitan permisos para acceder a las fotos o cámara.");
            return;
        }

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
            const fileName = `job_${Date.now()}.jpg`;
            const filePath = `uploads/${fileName}`;
            const buffer = Buffer.from(base64, 'base64');

            const {error} = await supabase.storage
                .from('jobs')
                .upload(filePath, buffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            const {data: {publicUrl}} = supabase.storage
                .from('jobs')
                .getPublicUrl(filePath);

            setForm(prev => ({...prev, image_url: publicUrl}));
        } catch (e: any) {
            Alert.alert("Error de Storage", e.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.address) {
            Alert.alert("Campos incompletos", "Título y dirección son obligatorios.");
            return;
        }

        setLoading(true);
        try {
            const {data: {session}} = await supabase.auth.getSession();
            let creatorId = session?.user?.id;

            if (!creatorId) {
                const {data: {user}} = await supabase.auth.getUser();
                if (!user) throw new Error("No hay una sesión activa. Reintenta loguear.");
                creatorId = user.id;
            }

            const dataToSave = {
                title: form.title,
                description: form.description,
                address: form.address,
                image_url: form.image_url,
                worker_id: form.worker_id,
                fecha_cita: form.fecha_cita.toISOString(),
                created_by: creatorId,
                status: 'Pendiente'
            };

            await createJob(dataToSave);

            Alert.alert("¡Éxito!", "Trabajo creado correctamente.");

            setForm({
                title: '', description: '', address: '', image_url: '',
                worker_id: null, fecha_cita: new Date()
            });
            onSuccess();
            onClose();
        } catch (e: any) {
            Alert.alert("Error al guardar", e.message);
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate && event.type !== 'dismissed') {
            const newDate = new Date(form.fecha_cita);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setForm({...form, fecha_cita: newDate});
        }
    };

    const onChangeTime = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate && event.type !== 'dismissed') {
            const newDate = new Date(form.fecha_cita);
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setForm({...form, fecha_cita: newDate});
        }
    };

    const formattedDate = form.fecha_cita.toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short'
    });
    const formattedTime = form.fecha_cita.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});

    const assignedWorker = workers.find(w => w.id === form.worker_id);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
            onRequestClose={onClose}>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <ThemedText type="title">Nuevo Trabajo</ThemedText>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Ionicons name="close-circle" size={32} color="#888"/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

                    <ThemedText style={styles.label}>Evidencia o Foto</ThemedText>
                    <View style={styles.imageContainer}>
                        {form.image_url ? (
                            <Image source={{uri: form.image_url}} style={styles.imagePreview}/>
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="image-outline" size={40} color="#888"/>
                                <ThemedText style={{fontSize: 12, opacity: 0.5}}>Sin imagen</ThemedText>
                            </View>
                        )}
                        {uploadingImage && (
                            <View style={styles.loaderOverlay}>
                                <ActivityIndicator size="large" color="#0a7ea4"/>
                            </View>
                        )}

                        <View style={styles.imageButtons}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickImage(false)}
                                              disabled={uploadingImage}>
                                <Ionicons name="images" size={18} color="#fff"/>
                                <ThemedText style={styles.actionBtnText}>Galería</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickImage(true)}
                                              disabled={uploadingImage}>
                                <Ionicons name="camera" size={18} color="#fff"/>
                                <ThemedText style={styles.actionBtnText}>Cámara</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ThemedText style={styles.label}>Fecha y Hora de la cita</ThemedText>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}
                                          disabled={loading}>
                            <Ionicons name="calendar-outline" size={20} color="#0a7ea4"/>
                            <ThemedText style={styles.dateTimeText}>{formattedDate}</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}
                                          disabled={loading}>
                            <Ionicons name="time-outline" size={20} color="#0a7ea4"/>
                            <ThemedText style={styles.dateTimeText}>{formattedTime}</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={form.fecha_cita}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={onChangeDate}
                            minimumDate={new Date()}
                            locale="es-ES"
                        />
                    )}
                    {showTimePicker && (
                        <DateTimePicker
                            value={form.fecha_cita}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeTime}
                        />
                    )}

                    <ThemedText style={styles.label}>Asignar a un trabajador</ThemedText>
                    <View style={styles.assignmentBox}>
                        <TouchableOpacity style={styles.dropdownTrigger} disabled={loading}
                                          onPress={() => setShowWorkerList(!showWorkerList)}>
                            <View style={styles.workerInfoRow}>
                                <View
                                    style={[styles.miniAvatar, {backgroundColor: assignedWorker ? '#0a7ea4' : '#ccc'}]}>
                                    <ThemedText
                                        style={styles.avatarLetter}>{assignedWorker?.name[0] || '?'}</ThemedText>
                                </View>
                                <ThemedText type="defaultSemiBold" style={styles.workerNameText}>
                                    {assignedWorker ? assignedWorker.name : "Sin asignar"}
                                </ThemedText>
                            </View>
                            <Ionicons name={showWorkerList ? "chevron-up" : "chevron-down"} size={20} color="#0a7ea4"/>
                        </TouchableOpacity>

                        {showWorkerList && (
                            <View style={styles.dropdownContent}>
                                <TouchableOpacity style={styles.workerOption} onPress={() => {
                                    setForm({...form, worker_id: null});
                                    setShowWorkerList(false);
                                }}>
                                    <ThemedText style={!form.worker_id && {color: '#0a7ea4', fontWeight: 'bold'}}>Dejar
                                        pendiente</ThemedText>
                                </TouchableOpacity>
                                {workers.map(w => (
                                    <TouchableOpacity key={w.id} style={styles.workerOption} onPress={() => {
                                        setForm({...form, worker_id: w.id});
                                        setShowWorkerList(false);
                                    }}>
                                        <ThemedText style={form.worker_id === w.id && {
                                            color: '#0a7ea4',
                                            fontWeight: 'bold'
                                        }}>{w.name}</ThemedText>
                                        {form.worker_id === w.id &&
                                            <Ionicons name="checkmark-circle" size={18} color="#0a7ea4"/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <ThemedText style={styles.label}>Título del Servicio</ThemedText>
                    <TextInput style={styles.input} placeholder="Ej. Reparación de tubería" value={form.title}
                               onChangeText={(t) => setForm(p => ({...p, title: t}))} editable={!loading}/>

                    <ThemedText style={styles.label}>Dirección</ThemedText>
                    <TextInput style={styles.input} placeholder="Calle Poniente #123" value={form.address}
                               onChangeText={(t) => setForm(p => ({...p, address: t}))} editable={!loading}/>

                    <ThemedText style={styles.label}>Descripción</ThemedText>
                    <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4}
                               placeholder="Detalles..." value={form.description}
                               onChangeText={(t) => setForm(p => ({...p, description: t}))} editable={!loading}/>

                    <TouchableOpacity style={[styles.saveBtn, (loading || uploadingImage) && styles.btnDisabled]}
                                      onPress={handleSave} disabled={loading || uploadingImage}>
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <ThemedText style={styles.saveBtnText}>Guardar Trabajo</ThemedText>}
                    </TouchableOpacity>

                    <View style={{height: 80}}/>
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
    label: {fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 15, textTransform: 'uppercase', opacity: 0.6},
    input: {backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 12, padding: 15, fontSize: 16},
    textArea: {height: 100, textAlignVertical: 'top'},
    imageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: 'rgba(150,150,150,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
    },
    imagePreview: {width: '100%', height: '100%'},
    imagePlaceholder: {alignItems: 'center', gap: 5},
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
    actionBtnText: {color: '#fff', fontSize: 12, fontWeight: 'bold'},
    loaderOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.7)',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateTimeRow: {flexDirection: 'row', gap: 10},
    dateTimeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        padding: 15,
        borderRadius: 12,
        gap: 8
    },
    dateTimeText: {color: '#0a7ea4', fontWeight: 'bold', fontSize: 16, textTransform: 'capitalize'},
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
    avatarLetter: {color: '#fff', fontWeight: 'bold', fontSize: 14},
    workerNameText: {fontSize: 16},
    dropdownContent: {marginTop: 15, borderTopWidth: 1, borderColor: 'rgba(150, 150, 150, 0.1)', paddingTop: 10},
    workerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 5,
        alignItems: 'center'
    },
    saveBtn: {
        backgroundColor: '#0a7ea4',
        padding: 18,
        borderRadius: 16,
        marginTop: 30,
        alignItems: 'center',
        elevation: 2
    },
    btnDisabled: {opacity: 0.5},
    saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16}
});