import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/libs/supabase";

interface AddToolModalProps {
    visible: boolean;
    onClose: () => void;
    workerId: string;
    onSuccess: () => void;
}

export default function AddToolModal({ visible, onClose, workerId, onSuccess }: AddToolModalProps) {
    const [toolName, setToolName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!toolName.trim()) {
            Alert.alert("Error", "Por favor escribe el nombre de la herramienta");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('herramientas')
                .insert([
                    {
                        tool: toolName.trim(),
                        worker_id: workerId
                    }
                ]);

            if (error) throw error;

            Alert.alert("Éxito", "Herramienta asignada correctamente");
            setToolName('');
            onSuccess();
            onClose();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <ThemedText type="defaultSemiBold" style={styles.title}>Asignar Herramienta</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.label}>Nombre de la herramienta</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Taladro Bosch, Multímetro..."
                        placeholderTextColor="#999"
                        value={toolName}
                        onChangeText={setToolName}
                        autoFocus={true}/>

                    <TouchableOpacity
                        style={[styles.saveBtn, loading && styles.disabledBtn]}
                        onPress={handleSave}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="add-outline" size={20} color="#fff" />
                                <ThemedText style={styles.saveBtnText}>Guardar Préstamo</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: { fontSize: 20 },
    label: { fontSize: 14, opacity: 0.6, marginBottom: 8, marginLeft: 4 },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#eee',
    },
    saveBtn: {
        backgroundColor: '#0a7ea4',
        flexDirection: 'row',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    disabledBtn: { opacity: 0.7 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});