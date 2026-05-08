import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {supabase} from '@/libs/supabase';
import {ThemedView} from '@/components/themed-view';
import {ThemedText} from '@/components/themed-text';
import {G, COLORS, shadow} from '@/styles/global-styles';

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: isDark ? '#38383a' : '#eee',
        placeholderColor: COLORS.placeholder,
        mutedText: COLORS.muted,
    };
};

export default function ForgotPassword() {
    const router = useRouter();
    const {isDark, textColor, inputBg, borderColor, placeholderColor, mutedText} = useAppTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
            return;
        }
        setLoading(true);
        try {
            const {error} = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://yoreparo-web.vercel.app/reset-password',
            });
            if (error) throw error;
            Alert.alert(
                'Correo enviado',
                'Revisa tu bandeja de entrada para restablecer tu contraseña.',
                [{text: 'OK', onPress: () => router.back()}]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={G.flex1}>
            <TouchableOpacity style={[G.backBtnPlain, {marginTop: 40, marginBottom: 20}]} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={textColor}/>
            </TouchableOpacity>

            <View style={{flex: 1, justifyContent: 'center', paddingHorizontal: 32}}>
                <ThemedText type="title" style={[G.pageTitle, {marginBottom: 10, color: textColor}]}>
                    Recuperar Contraseña
                </ThemedText>
                <ThemedText style={{opacity: 0.6, marginBottom: 30, fontSize: 16, color: mutedText}}>
                    Ingresa tu correo y te enviaremos un enlace para cambiar tu contraseña.
                </ThemedText>

                <View style={[
                    G.inputWithIcon,
                    {
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderColor,
                        borderRadius: 20,
                        height: 60,
                        marginBottom: 20
                    }
                ]}>
                    <Ionicons name="mail-outline" size={20} color={placeholderColor} style={{marginRight: 12}}/>
                    <TextInput
                        placeholder="Correo electrónico"
                        placeholderTextColor={placeholderColor}
                        value={email}
                        onChangeText={setEmail}
                        style={[G.inputText, {color: textColor}]}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <TouchableOpacity
                    style={[G.btnPrimary, {height: 60, borderRadius: 20, marginTop: 10}, shadow.sm]}
                    onPress={handleReset}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={COLORS.onPrimary}/> :
                        <ThemedText style={G.btnText}>Enviar enlace</ThemedText>}
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}