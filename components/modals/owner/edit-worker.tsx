import React, {useState, useEffect} from 'react';
import {
    Modal, StyleSheet, View, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ThemedText} from "@/components/themed-text";
import {Worker} from '@/libs/types/worker';
import {updateWorkerInfo} from "@/libs/owner/workers/update-worker";

interface EditWorkerModalProps {
    visible: boolean;
    onClose: () => void;
    worker: Worker;
    onSuccess: (updatedWorker: Worker) => void;
}

export default function EditWorkerModal({visible, onClose, worker, onSuccess}: EditWorkerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        role: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && worker) {
            setFormData({
                name: worker.name || '',
                phone: worker.phone || '',
                email: worker.email || '',
                role: worker.role
            });
        }
    }, [visible, worker]);

    const handleUpdate = async () => {
        if (!formData.name.trim()) {
            Alert.alert("Error", "El nombre es obligatorio");
            return;
        }

        setLoading(true);
        try {
            const response = await updateWorkerInfo(worker.id, formData);

            if (response && response.data) {
                Alert.alert("Éxito", "Perfil actualizado correctamente");
                onSuccess(response.data);
                onClose();
            } else {
                throw new Error("No se recibieron datos actualizados");
            }

        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", "No se pudo actualizar el perfil");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.header}>
                        <ThemedText type="defaultSemiBold" style={styles.title}>Editar Perfil</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333"/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ThemedText style={styles.label}>Nombre Completo</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(t) => setFormData({...formData, name: t})}
                            placeholder="Nombre del trabajador"
                        />

                        <ThemedText style={styles.label}>Teléfono</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(t) => setFormData({...formData, phone: t})}
                            keyboardType="phone-pad"
                            placeholder="238 000 0000"
                        />

                        <ThemedText style={styles.label}>Correo Electrónico</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(t) => setFormData({...formData, email: t})}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="correo@ejemplo.com"
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, loading && styles.disabledBtn]}
                            onPress={handleUpdate}
                            disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff"/> :
                                <ThemedText style={styles.saveBtnText}>Guardar Cambios</ThemedText>}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20},
    modalContainer: {backgroundColor: '#fff', borderRadius: 24, padding: 20, maxHeight: '80%'},
    header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20},
    title: {fontSize: 18},
    label: {fontSize: 12, opacity: 0.5, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5, marginLeft: 4},
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee'
    },
    saveBtn: {
        backgroundColor: '#0a7ea4',
        height: 55,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    disabledBtn: {opacity: 0.7},
    saveBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});