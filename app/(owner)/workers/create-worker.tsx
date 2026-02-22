import { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import { createWorkerByAdmin } from "@/libs/owner/workers/create-workers";
import { ThemedText } from "@/components/themed-text";

type Role = 'worker' | 'supervisor' | 'admin';

export default function Workers() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<Role>('worker');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const createWorker = async () => {
        if (!email || !name || !password) {
            Alert.alert('Error', 'Nombre, correo y contraseña son obligatorios');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await createWorkerByAdmin(email, password, name, phone, role);
            if (error) {
                console.log("Function error:", error);
                Alert.alert("Error", JSON.stringify(error));
                return;
            }

            Alert.alert('Éxito', 'Trabajador creado correctamente');
            resetForm();

        } catch (err: any) {
            Alert.alert('Error', err.message || 'Error inesperado');
            console.error(err);
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
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <ThemedText type="title" style={styles.title}>Crear Trabajador</ThemedText>

                <TextInput
                    placeholder="Nombre completo *"
                    placeholderTextColor="#888"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    editable={!loading}
                />

                <TextInput
                    placeholder="Correo electrónico *"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                />

                <TextInput
                    placeholder="Teléfono"
                    placeholderTextColor="#888"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    keyboardType="phone-pad"
                    editable={!loading}
                />

                <TextInput
                    placeholder="Contraseña *"
                    placeholderTextColor="#888"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry
                    editable={!loading}
                />

                <View style={styles.roleContainer}>
                    <ThemedText style={styles.roleLabel}>Rol:</ThemedText>
                    <View style={styles.roleButtons}>
                        {(['worker', 'supervisor', 'admin'] as Role[]).map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    styles.roleButton,
                                    role === r && styles.roleButtonActive
                                ]}
                                onPress={() => setRole(r)}
                                disabled={loading}
                            >
                                <ThemedText style={[
                                    styles.roleButtonText,
                                    role === r && styles.roleButtonTextActive
                                ]}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={createWorker}
                    disabled={loading}
                >
                    <ThemedText style={styles.buttonText}>
                        {loading ? 'Creando...' : 'Crear Trabajador'}
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
    },
    title: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.3)',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        color: '#888',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    roleContainer: {
        marginBottom: 20
    },
    roleLabel: {
        fontWeight: '600',
        marginBottom: 8,
        // Eliminé el color fijo #4b5563
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 8
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.3)',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.05)' // Fondo adaptable
    },
    roleButtonActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4'
    },
    roleButtonText: {
        fontWeight: '500',
    },
    roleButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#0a7ea4',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    section: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        borderRadius: 8
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    jobFields: {
        marginTop: 8
    },
    row: {
        flexDirection: 'row',
        gap: 12
    },
    halfInput: {
        flex: 1
    }
});