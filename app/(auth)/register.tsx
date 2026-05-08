import React, {useState} from 'react';
import {
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    useColorScheme,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {createUser} from '@/libs/users/create-user';
import {G, COLORS, shadow} from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
        placeholderColor: COLORS.placeholder,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
    };
};

export default function RegisterScreen() {
    const router = useRouter();
    const {textColor, inputBg, borderColor, placeholderColor, cardBg} = useAppTheme();

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
                'Tu cuenta ha sido creada. Por favor, verifica tu correo y confirma tu cuenta para poder iniciar sesión',
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
        <ThemedView style={G.flex1}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={G.flex1}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[G.pageContentLg, {paddingTop: 60}]}>

                    <View style={{marginBottom: 35}}>
                        <ThemedText type="title"
                                    style={[G.pageTitle, {fontSize: 32, marginBottom: 10, color: textColor}]}>
                            Crea tu cuenta
                        </ThemedText>
                        <ThemedText style={{fontSize: 16, opacity: 0.6, lineHeight: 22, color: textColor}}>
                            Únete a la plataforma de gestión de servicios
                        </ThemedText>
                    </View>

                    <View style={[G.card, {backgroundColor: cardBg, padding: 20, borderRadius: 28}, shadow.sm]}>
                        {/* Nombre completo */}
                        <View style={[G.inputWithIcon, {
                            backgroundColor: inputBg,
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 16,
                            height: 60,
                            marginBottom: 16
                        }]}>
                            <Ionicons name="person-outline" size={20} color={placeholderColor}
                                      style={{marginRight: 12}}/>
                            <TextInput
                                placeholder="Nombre completo"
                                placeholderTextColor={placeholderColor}
                                value={name}
                                onChangeText={setName}
                                style={[G.inputText, {color: textColor}]}
                            />
                        </View>

                        {/* Teléfono */}
                        <View style={[G.inputWithIcon, {
                            backgroundColor: inputBg,
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 16,
                            height: 60,
                            marginBottom: 16
                        }]}>
                            <Ionicons name="call-outline" size={20} color={placeholderColor} style={{marginRight: 12}}/>
                            <TextInput
                                placeholder="Teléfono"
                                placeholderTextColor={placeholderColor}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                style={[G.inputText, {color: textColor}]}
                            />
                        </View>

                        {/* Correo electrónico */}
                        <View style={[G.inputWithIcon, {
                            backgroundColor: inputBg,
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 16,
                            height: 60,
                            marginBottom: 16
                        }]}>
                            <Ionicons name="mail-outline" size={20} color={placeholderColor} style={{marginRight: 12}}/>
                            <TextInput
                                placeholder="Correo electrónico"
                                placeholderTextColor={placeholderColor}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={[G.inputText, {color: textColor}]}
                            />
                        </View>

                        {/* Contraseña */}
                        <View style={[G.inputWithIcon, {
                            backgroundColor: inputBg,
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 16,
                            height: 60,
                            marginBottom: 16
                        }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={placeholderColor}
                                      style={{marginRight: 12}}/>
                            <TextInput
                                placeholder="Contraseña"
                                placeholderTextColor={placeholderColor}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                style={[G.inputText, {color: textColor}]}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20}
                                          color={placeholderColor}/>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[G.btnPrimary, {height: 60, borderRadius: 18, marginTop: 15}, shadow.sm]}
                            activeOpacity={0.8}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={COLORS.onPrimary}/>
                            ) : (
                                <ThemedText style={G.btnText}>Registrarme</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 50}}>
                        <ThemedText style={{opacity: 0.6, color: textColor}}>¿Ya tienes cuenta? </ThemedText>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                            <ThemedText type="defaultSemiBold" style={{color: COLORS.primary}}>Inicia
                                sesión</ThemedText>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}