import React, { useState } from 'react'
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    useColorScheme,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
    Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/libs/supabase'
import { registerForPushNotificationsAsync } from '@/libs/notifications/notifications';
import { ThemedView } from '@/components/themed-view'
import { ThemedText } from '@/components/themed-text'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Login() {
    const router = useRouter()
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const inputWrapperStyle = [
        styles.inputWrapper,
        {
            backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9',
            borderColor: isDark ? '#38383a' : '#eee',
        }
    ];

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Completa todos los campos')
            return
        }
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error;

            if (data.user) {
                await registerForPushNotificationsAsync();
            }
            router.replace('/')
        } catch (error: any) {
            Alert.alert('Error de acceso', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.logoRow}>
                            <Image
                                source={require('@/assets/images/favicon.png')}
                                style={styles.faviconImage}
                                resizeMode="contain"
                            />
                            <Image
                                source={require('@/assets/images/Yoreparo1024.png')}
                                style={styles.bannerImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={inputWrapperStyle}>
                            <Ionicons name="mail-outline" size={20} color={isDark ? '#8e8e93' : '#666'} style={styles.icon} />
                            <TextInput
                                placeholder="Correo electrónico"
                                placeholderTextColor={isDark ? '#8e8e93' : '#999'}
                                value={email}
                                onChangeText={setEmail}
                                style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address" />
                        </View>

                        <View style={inputWrapperStyle}>
                            <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#8e8e93' : '#666'} style={styles.icon} />
                            <TextInput
                                placeholder="Contraseña"
                                placeholderTextColor={isDark ? '#8e8e93' : '#999'}
                                value={password}
                                onChangeText={setPassword}
                                style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                                secureTextEntry={!showPassword} />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={isDark ? '#8e8e93' : '#666'} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#0a7ea4' }]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}>
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
                            }
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <ThemedText style={{ opacity: 0.6 }}>¿Aún no tienes cuenta? </ThemedText>
                            <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                                <ThemedText type="defaultSemiBold" style={{ color: '#0a7ea4' }}>Regístrate</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 120, // Altura fija para el contenedor de logos
    },
    faviconImage: {
        flex: 0.4,
        height: '100%',
        maxWidth: 80,
    },
    bannerImage: {
        flex: 1,
        height: '100%',
        maxWidth: 200,
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
        height: 60,
        marginBottom: 16,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    button: {
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 17,
        letterSpacing: 0.5
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    }
})