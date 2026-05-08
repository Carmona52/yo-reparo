import React, {useState, useEffect} from 'react';
import {
    Modal, View, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, useColorScheme
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ThemedText} from "@/components/themed-text";
import {Worker} from '@/libs/types/worker';
import {updateWorkerInfo} from "@/libs/owner/workers/update-worker";
import {G, COLORS} from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
        placeholderColor: COLORS.placeholder,
    };
};

interface EditWorkerModalProps {
    visible: boolean;
    onClose: () => void;
    worker: Worker;
    onSuccess: (updatedWorker: Worker) => void;
}

export default function EditWorkerModal({visible, onClose, worker, onSuccess}: EditWorkerModalProps) {
    const {textColor, cardBg, inputBg, borderColor, placeholderColor} = useAppTheme();
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
            <View style={G.modalOverlayCentered}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[G.modalCard, {backgroundColor: cardBg, borderColor, padding: 20, maxHeight: '80%'}]}
                >
                    <View style={G.modalHeaderInner}>
                        <ThemedText type="defaultSemiBold" style={{fontSize: 18, color: textColor}}>Editar
                            Perfil</ThemedText>
                        <TouchableOpacity onPress={onClose} style={G.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={textColor}/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <ThemedText style={[G.sectionLabel, {marginBottom: 5, marginLeft: 4}]}>Nombre
                            Completo</ThemedText>
                        <TextInput
                            style={[G.inputBordered, {
                                color: textColor,
                                backgroundColor: inputBg,
                                borderColor,
                                marginBottom: 15
                            }]}
                            value={formData.name}
                            onChangeText={(t) => setFormData({...formData, name: t})}
                            placeholder="Nombre del trabajador"
                            placeholderTextColor={placeholderColor}
                        />

                        <ThemedText style={[G.sectionLabel, {marginBottom: 5, marginLeft: 4}]}>Teléfono</ThemedText>
                        <TextInput
                            style={[G.inputBordered, {
                                color: textColor,
                                backgroundColor: inputBg,
                                borderColor,
                                marginBottom: 15
                            }]}
                            value={formData.phone}
                            onChangeText={(t) => setFormData({...formData, phone: t})}
                            keyboardType="phone-pad"
                            placeholder="238 000 0000"
                            placeholderTextColor={placeholderColor}
                        />

                        <ThemedText style={[G.sectionLabel, {marginBottom: 5, marginLeft: 4}]}>Correo
                            Electrónico</ThemedText>
                        <TextInput
                            style={[G.inputBordered, {
                                color: textColor,
                                backgroundColor: inputBg,
                                borderColor,
                                marginBottom: 15
                            }]}
                            value={formData.email}
                            onChangeText={(t) => setFormData({...formData, email: t})}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="correo@ejemplo.com"
                            placeholderTextColor={placeholderColor}
                        />

                        <TouchableOpacity
                            style={[G.btnPrimary, loading && G.btnDisabled, {marginTop: 10}]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color={COLORS.onPrimary}/> :
                                <ThemedText style={G.btnText}>Guardar Cambios</ThemedText>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}