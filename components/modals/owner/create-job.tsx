import React, {useState} from 'react';
import {
    Modal,
    TextInput,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from '@expo/vector-icons';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {createJob} from '@/libs/owner/jobs/create-jobs';

interface CreateJobModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateJobModal = ({visible, onClose, onSuccess}: CreateJobModalProps) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        address: '',
        image_url: ''
    });

    // Función auxiliar para convertir base64 a ArrayBuffer sin librerías
    const base64ToBlob = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const handlePickImage = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permiso necesario", "Necesitamos acceso a tus fotos.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.5,
            base64: true
        });

        if (!result.canceled && result.assets[0].base64) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
        setLoading(true);
        try {
            const fileName = `new_job_${Date.now()}.jpg`;
            const arrayBuffer = base64ToBlob(asset.base64!);

            const {error} = await supabase.storage
                .from('job-images')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            const {data: {publicUrl}} = supabase.storage.from('job-images').getPublicUrl(fileName);
            setForm(prev => ({...prev, image_url: publicUrl}));
        } catch (e: any) {
            Alert.alert("Error de subida", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.address) {
            Alert.alert("Campos incompletos", "Por favor indica al menos el título y la dirección.");
            return;
        }

        setLoading(true);
        try {
            await createJob(form);
            Alert.alert("¡Listo!", "El trabajo ha sido creado.");
            setForm({title: '', description: '', address: '', image_url: ''});
            onSuccess();
            onClose();
        } catch (e: any) {
            Alert.alert("Error", "No se pudo guardar el trabajo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
            onRequestClose={onClose}
        >
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <ThemedText type="title">Nuevo Trabajo</ThemedText>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                        <Ionicons name="close-circle" size={32} color="#888"/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                    <ThemedText style={styles.label}>Título del Servicio</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Reparación de tubería"
                        value={form.title}
                        onChangeText={(t) => setForm(p => ({...p, title: t}))}
                    />

                    <ThemedText style={styles.label}>Dirección</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Calle Poniente #123, Col. Centro"
                        value={form.address}
                        onChangeText={(t) => setForm(p => ({...p, address: t}))}
                    />

                    <ThemedText style={styles.label}>Descripción (Opcional)</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Detalles sobre el material o el problema..."
                        value={form.description}
                        onChangeText={(t) => setForm(p => ({...p, description: t}))}
                    />

                    <ThemedText style={styles.label}>Foto de Referencia</ThemedText>
                    <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} disabled={loading}>
                        {form.image_url ? (
                            <Image source={{uri: form.image_url}} style={styles.preview}/>
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons name="cloud-upload-outline" size={40} color="#0a7ea4"/>
                                <ThemedText style={styles.placeholderText}>Subir imagen</ThemedText>
                            </View>
                        )}
                        {loading && !form.image_url && <ActivityIndicator style={styles.loader} color="#0a7ea4"/>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveBtn, loading && styles.btnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <ThemedText style={styles.saveBtnText}>Guardar Trabajo</ThemedText>}
                    </TouchableOpacity>

                    <View style={{height: 40}}/>
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
    imagePicker: {
        width: '100%',
        height: 180,
        backgroundColor: 'rgba(150,150,150,0.05)',
        borderRadius: 20,
        marginTop: 10,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: 'rgba(10, 126, 164, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    preview: {width: '100%', height: '100%', resizeMode: 'cover'},
    placeholder: {alignItems: 'center'},
    placeholderText: {marginTop: 8, fontSize: 12, color: '#0a7ea4'},
    loader: {position: 'absolute'},
    saveBtn: {
        backgroundColor: '#0a7ea4',
        padding: 18,
        borderRadius: 16,
        marginTop: 30,
        alignItems: 'center',
        elevation: 2
    },
    btnDisabled: {opacity: 0.7},
    saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16}
});