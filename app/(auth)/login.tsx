import { useState } from 'react'
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    useColorScheme
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/libs/supabase'

import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'

export default function Login() {
    const router = useRouter()
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Colores dinámicos para los Inputs
    const inputStyle = [
        styles.input,
        {
            backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9',
            borderColor: isDark ? '#38383a' : '#ddd',
            color: isDark ? '#fff' : '#000'
        }
    ];

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Completa todos los campos')
            return
        }
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        setLoading(false)
        if (error) {
            Alert.alert('Error', error.message)
            return
        }
        router.replace('/')
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Iniciar Sesión</ThemedText>

            <TextInput
                placeholder="Correo electrónico"
                placeholderTextColor={isDark ? '#8e8e93' : '#999'}
                value={email}
                onChangeText={setEmail}
                style={inputStyle}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Contraseña"
                    placeholderTextColor={isDark ? '#8e8e93' : '#999'}
                    value={password}
                    onChangeText={setPassword}
                    style={[inputStyle, { paddingRight: 45 }]}
                    secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color={isDark ? '#8e8e93' : '#666'}
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: isDark ? '#0a7ea4' : '#2563eb' }]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <ThemedText style={styles.buttonText}>Entrar</ThemedText>
                }
            </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        marginBottom: 32,
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
    },
    passwordContainer: {
        position: 'relative',
        justifyContent: 'center',
        marginBottom: 24
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        // Centrado vertical manual considerando el margen inferior del input
        top: 16,
    },
    button: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
})