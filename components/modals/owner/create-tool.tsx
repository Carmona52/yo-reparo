import React, {useState} from 'react';
import {
    Modal,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
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

interface AddToolModalProps {
    visible: boolean;
    onClose: () => void;
    workerId: string;
    onSuccess: () => void;
}

export default function AddToolModal({visible, onClose, workerId, onSuccess}: AddToolModalProps) {
    const {textColor, cardBg, inputBg, borderColor, placeholderColor} = useAppTheme();
    const [toolName, setToolName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!toolName.trim()) {
            Alert.alert("Error", "Por favor escribe el nombre de la herramienta");
            return;
        }

        setLoading(true);
        try {
            const {error} = await supabase
                .from('herramientas')
                .insert([
                    {
                        tool: toolName.trim(),
                        estado: 'prestada',
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
                style={G.modalOverlay}>
                <View style={[G.modalCard, {backgroundColor: cardBg, borderColor, padding: 25, paddingBottom: 40}]}>
                    <View style={G.modalHeaderInner}>
                        <ThemedText type="defaultSemiBold" style={{fontSize: 20, color: textColor}}>
                            Asignar Herramienta
                        </ThemedText>
                        <TouchableOpacity onPress={onClose} style={G.modalCloseBtn}>
                            <Ionicons name="close-circle" size={28} color={placeholderColor}/>
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={[G.infoLabel, {fontSize: 14, marginBottom: 8, marginLeft: 4}]}>
                        Nombre de la herramienta
                    </ThemedText>
                    <TextInput
                        style={[G.inputBordered, {
                            color: textColor,
                            backgroundColor: inputBg,
                            borderColor,
                            marginBottom: 25
                        }]}
                        placeholder="Ej. Taladro Bosch, Multímetro..."
                        placeholderTextColor={placeholderColor}
                        value={toolName}
                        onChangeText={setToolName}
                        autoFocus={true}
                    />

                    <TouchableOpacity
                        style={[G.btnPrimary, loading && G.btnDisabled]}
                        onPress={handleSave}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={COLORS.onPrimary}/>
                        ) : (
                            <>
                                <Ionicons name="add-outline" size={20} color={COLORS.onPrimary}/>
                                <ThemedText style={G.btnText}>Guardar Préstamo</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}