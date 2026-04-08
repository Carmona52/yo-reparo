import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, useColorScheme} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {supabase} from '@/libs/supabase';
import {ThemedView} from '@/components/themed-view';
import {ThemedText} from '@/components/themed-text';

export default function ForgotPassword() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
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
        <ThemedView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'}/>
            </TouchableOpacity>

            <View style={styles.content}>
                <ThemedText type="title" style={styles.title}>Recuperar Contraseña</ThemedText>
                <ThemedText style={styles.subtitle}>
                    Ingresa tu correo y te enviaremos un enlace para cambiar tu contraseña.
                </ThemedText>

                <View style={[styles.inputWrapper, {
                    backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9',
                    borderColor: isDark ? '#38383a' : '#eee'
                }]}>
                    <Ionicons name="mail-outline" size={20} color="#8e8e93" style={{marginRight: 12}}/>
                    <TextInput
                        placeholder="Correo electrónico"
                        placeholderTextColor="#8e8e93"
                        value={email}
                        onChangeText={setEmail}
                        style={[styles.input, {color: isDark ? '#fff' : '#000'}]}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff"/> :
                        <ThemedText style={styles.buttonText}>Enviar enlace</ThemedText>}
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 32},
    backBtn: {marginTop: 40, marginBottom: 20},
    content: {flex: 1, justifyContent: 'center'},
    title: {marginBottom: 10},
    subtitle: {opacity: 0.6, marginBottom: 30, fontSize: 16},
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
        height: 60,
        marginBottom: 20
    },
    input: {flex: 1, fontSize: 16},
    button: {
        height: 60,
        borderRadius: 20,
        backgroundColor: '#0a7ea4',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10
    },
    buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 17}
});