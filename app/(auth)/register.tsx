import React, {useState} from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";

import {createUser} from '@/libs/users/create-user';

export default function RegisterScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const [role, setRole] = useState('cliente');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !phone) {
            Alert.alert('Error', 'Por favor llena todos los campos.');
            return;
        }

        setIsLoading(true);

        try {
            await createUser(email, password, name, phone, role);

            Alert.alert(
                '¡Registro exitoso!',
                'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
                [{text: 'OK', onPress: () => router.replace('/(auth)/login')}]
            );

        } catch (error: any) {
            Alert.alert('Error al registrar', error.message || 'Ocurrió un problema, intenta de nuevo.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                    <View style={styles.welcomeSection}>
                        <ThemedText type="title" style={styles.title}>Crea tu cuenta</ThemedText>
                        <ThemedText style={styles.subtitle}>Únete a la plataforma de gestión de servicios</ThemedText>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon}/>
                            <TextInput
                                placeholder="Nombre completo"
                                value={name}
                                onChangeText={setName}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon}/>
                            <TextInput
                                placeholder="Teléfono"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon}/>
                            <TextInput
                                placeholder="Correo electrónico"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon}/>
                            <TextInput
                                placeholder="Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                placeholderTextColor="#aaa"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20}
                                          color="#888"/>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.registerBtn, isLoading && {opacity: 0.7}]}
                            activeOpacity={0.8}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff"/>
                            ) : (
                                <ThemedText style={styles.registerBtnText}>Registrarme</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <ThemedText style={{opacity: 0.6}}>¿Ya tienes cuenta? </ThemedText>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                            <ThemedText type="defaultSemiBold" style={{color: '#0a7ea4'}}>Inicia sesión</ThemedText>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    scroll: {padding: 24, paddingTop: 60},
    welcomeSection: {marginBottom: 35},
    title: {fontSize: 32, fontWeight: '800', marginBottom: 10},
    subtitle: {fontSize: 16, opacity: 0.6, lineHeight: 22},

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 60,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    inputIcon: {marginRight: 12},
    input: {flex: 1, fontSize: 16, color: '#333'},

    registerBtn: {
        backgroundColor: '#0a7ea4',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        elevation: 2,
    },
    registerBtnText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 50
    }
});