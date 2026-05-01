import { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

import { createWorkerByAdmin } from "@/libs/owner/workers/create-workers";
import { ThemedText } from "@/components/themed-text";
import { G, COLORS } from "@/styles/global-styles";

type Role = 'worker' | 'supervisor' | 'owner';

const ROLE_LABELS: Record<Role, string> = {
    worker: 'Trabajador',
    supervisor: 'Supervisor',
    owner: 'Dueño',
};

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
        placeholderColor: COLORS.placeholder,
    };
};

export default function Workers() {
    const { textColor, inputBg, borderColor, placeholderColor } = useAppTheme();

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<Role>('worker');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);

    const createWorker = async () => {
        if (!email || !name || !password) {
            Alert.alert('Error', 'Nombre, correo y contraseña son obligatorios');
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await createWorkerByAdmin(email, password, name, phone, role);
            if (error) {
                Alert.alert("Error", JSON.stringify(error));
                return;
            }
            Alert.alert('Éxito', 'Trabajador creado correctamente');
            resetForm();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setName('');
        setPhone('');
        setPassword('');
        setRole('worker');
        setSecureText(true);
    };

    return (
        <SafeAreaView style={G.flex1}>
            <ScrollView contentContainerStyle={[G.pageContentLg, { flexGrow: 1 }]}>
                <ThemedText type="title" style={[G.pageTitle, { marginBottom: 20 }]}>Crear Trabajador</ThemedText>

                <TextInput
                    placeholder="Nombre completo *"
                    placeholderTextColor={placeholderColor}
                    value={name}
                    onChangeText={setName}
                    style={[G.inputBordered, { color: textColor, backgroundColor: inputBg, borderColor }]}
                    editable={!loading}
                />

                <TextInput
                    placeholder="Correo electrónico *"
                    placeholderTextColor={placeholderColor}
                    value={email}
                    onChangeText={setEmail}
                    style={[G.inputBordered, { color: textColor, backgroundColor: inputBg, borderColor }]}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                />

                <TextInput
                    placeholder="Teléfono"
                    placeholderTextColor={placeholderColor}
                    value={phone}
                    onChangeText={setPhone}
                    style={[G.inputBordered, { color: textColor, backgroundColor: inputBg, borderColor }]}
                    keyboardType="phone-pad"
                    editable={!loading}
                />

                <View style={[G.passwordContainer, { backgroundColor: inputBg, borderColor }]}>
                    <TextInput
                        placeholder="Contraseña *"
                        placeholderTextColor={placeholderColor}
                        value={password}
                        onChangeText={setPassword}
                        style={[G.passwordInput, { color: textColor }]}
                        secureTextEntry={secureText}
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setSecureText(!secureText)} style={G.eyeIcon}>
                        <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={22} color={placeholderColor} />
                    </TouchableOpacity>
                </View>

                <View style={G.roleContainer}>
                    <ThemedText style={G.roleLabel}>Rol:</ThemedText>
                    <View style={G.roleButtons}>
                        {(['worker', 'supervisor', 'owner'] as Role[]).map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    G.roleButton,
                                    role === r && G.roleButtonActive
                                ]}
                                onPress={() => setRole(r)}
                                disabled={loading}
                            >
                                <ThemedText style={[
                                    G.roleButtonText,
                                    role === r && G.roleButtonTextActive
                                ]}>
                                    {ROLE_LABELS[r]}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[G.btnPrimary, loading && G.btnDisabled, { marginTop: 8 }]}
                    onPress={createWorker}
                    disabled={loading}>
                    <ThemedText style={G.btnText}>
                        {loading ? 'Creando...' : 'Crear Trabajador'}
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}