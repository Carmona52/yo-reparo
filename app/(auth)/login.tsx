import React, {useState} from 'react'
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    useColorScheme,
    KeyboardAvoidingView,
    Platform
} from 'react-native'
import {Ionicons} from '@expo/vector-icons'
import {useRouter} from 'expo-router'
import {supabase} from '@/libs/supabase'
//import {registerForPushNotificationsAsync} from '@/libs/notifications/notifications';
import {ThemedView} from '@/components/themed-view'
import {ThemedText} from '@/components/themed-text'

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
        const {data, error} = await supabase.auth.signInWithPassword({email, password})
        setLoading(false)
        if (error) {
            Alert.alert('Error', error.message)
            return
        }
        if (data.user) {
            console.log("Sesión iniciada, registrando token de notificaciones...");
            //await registerForPushNotificationsAsync();
        }
        router.replace('/')
    }

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1, justifyContent: 'center'}}>
                <View style={styles.header}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="flash" size={40} color="#fff"/>
                    </View>
                    <ThemedText type="title" style={styles.title}>Bienvenido</ThemedText>
                    <ThemedText style={styles.subtitle}>Inicia sesión para continuar</ThemedText>
                </View>

                <View style={inputWrapperStyle}>
                    <Ionicons name="mail-outline" size={20} color={isDark ? '#8e8e93' : '#666'} style={styles.icon}/>
                    <TextInput
                        placeholder="Correo electrónico"
                        placeholderTextColor={isDark ? '#8e8e93' : '#999'}
                        value={email}
                        onChangeText={setEmail}
                        style={[styles.input, {color: isDark ? '#fff' : '#000'}]}
                        autoCapitalize="none"
                        keyboardType="email-address"/>
                </View>

                <View style={inputWrapperStyle}>
                    <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#8e8e93' : '#666'}
                              style={styles.icon}/>
                    <TextInput
                        placeholder="Contraseña"
                        placeholderTextColor={isDark ? '#8e8e93' : '#999'}
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, {color: isDark ? '#fff' : '#000'}]}
                        secureTextEntry={!showPassword}/>
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={isDark ? '#8e8e93' : '#666'}/>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, {backgroundColor: isDark ? '#0a7ea4' : '#2563eb'}]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}>
                    {loading
                        ? <ActivityIndicator color="#fff"/>
                        : <ThemedText style={styles.buttonText}>Entrar</ThemedText>
                    }
                </TouchableOpacity>

                <View style={styles.footer}>
                    <ThemedText style={{opacity: 0.6}}>¿No tienes cuenta? </ThemedText>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                        <ThemedText type="defaultSemiBold" style={{color: '#0a7ea4'}}>Regístrate</ThemedText>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.5,
        marginTop: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 64,
        marginBottom: 16,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    button: {
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    }
})