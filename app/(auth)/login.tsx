import React, {useState} from 'react'
import {
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useColorScheme,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
    Dimensions
} from 'react-native'
import {Ionicons} from '@expo/vector-icons'
import {useRouter} from 'expo-router'
import {supabase} from '@/libs/supabase'
import {registerForPushNotificationsAsync} from '@/libs/notifications/notifications';
import {ThemedView} from '@/components/themed-view'
import {ThemedText} from '@/components/themed-text'
import {G, COLORS, shadow} from '@/styles/global-styles'

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: isDark ? '#38383a' : '#eee',
        placeholderColor: COLORS.placeholder,
        iconColor: isDark ? '#8e8e93' : '#666',
    };
};

export default function Login() {
    const router = useRouter()
    const {isDark, textColor, inputBg, borderColor, placeholderColor, iconColor} = useAppTheme();

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Completa todos los campos')
            return
        }
        setLoading(true)
        try {
            const {data, error} = await supabase.auth.signInWithPassword({email, password})
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
        <ThemedView style={G.flex1}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={G.flex1}>
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingHorizontal: 32,
                        paddingVertical: 40
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled">
                    <View style={{alignItems: 'center', marginBottom: 30, width: '100%'}}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: 120
                        }}>
                            <Image
                                source={require('@/assets/images/favicon.png')}
                                style={{flex: 0.4, height: '100%', maxWidth: 80}}
                                resizeMode="contain"
                            />
                            <Image
                                source={require('@/assets/images/Yoreparo1024.png')}
                                style={{flex: 1, height: '100%', maxWidth: 200}}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={{width: '100%'}}>
                        {/* Email input */}
                        <View style={[G.inputWithIcon, {
                            backgroundColor: inputBg,
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 20,
                            height: 60,
                            marginBottom: 16
                        }]}>
                            <Ionicons name="mail-outline" size={20} color={iconColor} style={{marginRight: 12}}/>
                            <TextInput
                                placeholder="Correo electrónico"
                                placeholderTextColor={placeholderColor}
                                value={email}
                                onChangeText={setEmail}
                                style={[G.inputText, {color: textColor}]}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Password input */}
                        <View style={[G.inputWithIcon, {
                            backgroundColor: inputBg,
                            borderWidth: 1,
                            borderColor,
                            borderRadius: 20,
                            height: 60,
                            marginBottom: 16
                        }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={iconColor} style={{marginRight: 12}}/>
                            <TextInput
                                placeholder="Contraseña"
                                placeholderTextColor={placeholderColor}
                                value={password}
                                onChangeText={setPassword}
                                style={[G.inputText, {color: textColor}]}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={iconColor}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[G.btnPrimary, {height: 60, borderRadius: 20, marginTop: 10}, shadow.md]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}>
                            {loading
                                ? <ActivityIndicator color={COLORS.onPrimary}/>
                                : <ThemedText style={G.btnText}>Iniciar Sesión</ThemedText>
                            }
                        </TouchableOpacity>

                        <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 30}}>
                            <ThemedText style={{opacity: 0.6}}>¿Aún no tienes cuenta? </ThemedText>
                            <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                                <ThemedText type="defaultSemiBold"
                                            style={{color: COLORS.primary}}>Regístrate</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 10}}>
                            <TouchableOpacity
                                style={{alignSelf: 'flex-end', marginBottom: 20, marginRight: 5}}
                                onPress={() => router.push('/(auth)/forgot-password')}>
                                <ThemedText style={{color: COLORS.primary, fontSize: 14, opacity: 0.8}}>
                                    ¿Olvidaste tu contraseña?
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    )
}