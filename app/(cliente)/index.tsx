import React, {useState} from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    RefreshControl,
    Image,
    Dimensions,
    Alert,
    Linking,
    useColorScheme,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {Ionicons} from '@expo/vector-icons';

import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {G, COLORS, shadow} from "@/styles/global-styles";

const {width} = Dimensions.get('window');

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        borderColor: COLORS.border,
    };
};

export default function HomeScreen() {
    const router = useRouter();
    const {textColor, mutedText, surfaceBg, borderColor} = useAppTheme();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 2000);
    }, []);

    const handleWhatsAppPress = async () => {
        Alert.alert(
            "Solicitar Garantía",
            "Serás redirigido a WhatsApp para validar tu garantía con un técnico.",
            [
                {text: "Cancelar", style: "cancel"},
                {
                    text: "Continuar",
                    onPress: async () => {
                        const phoneNumber = "522381098104";
                        const message = "Hola Yo Reparo, me gustaría solicitar información sobre una garantía.";
                        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                        try {
                            const supported = await Linking.canOpenURL(url);
                            if (supported) await Linking.openURL(url);
                            else await Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
                        } catch (error) {
                            Alert.alert("Error", "No se pudo abrir WhatsApp");
                        }
                    }
                }
            ]
        );
    };

    const handleUrgencyPress = async () => {
        const phoneNumber = "2382288483";
        const url = `tel:${phoneNumber}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
            else Alert.alert("Error", "Tu dispositivo no soporta llamadas telefónicas.");
        } catch (error) {
            console.error("Error al intentar llamar:", error);
        }
    };

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom: 20}}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                                                    tintColor={COLORS.primary}/>}
                >
                    {/* Header con Logo */}
                    <View style={{paddingHorizontal: 25, paddingVertical: 20}}>
                        <ThemedText style={[G.greetingText, {
                            fontSize: 14,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            color: mutedText
                        }]}>
                            Bienvenido a
                        </ThemedText>
                        <Image
                            source={require('@/assets/images/Yoreparo1024.png')}
                            style={{width: 120, height: 50, marginTop: 5}}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Banner Publicitario */}
                    <View style={{paddingHorizontal: 20, marginBottom: 25}}>
                        <TouchableOpacity activeOpacity={0.9} style={{
                            height: 180,
                            borderRadius: 24,
                            overflow: 'hidden',
                            backgroundColor: '#222'
                        }}>
                            <Image
                                source={{uri: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1000'}}
                                style={{width: '100%', height: '100%'}}
                            />
                            <View style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                top: 0,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                padding: 20,
                                justifyContent: 'flex-end'
                            }}>
                                <View style={{
                                    backgroundColor: COLORS.primary,
                                    alignSelf: 'flex-start',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    marginBottom: 8
                                }}>
                                    <ThemedText style={{color: COLORS.onPrimary, fontSize: 10, fontWeight: '900'}}>PROMO
                                        DEL MES</ThemedText>
                                </View>
                                <ThemedText style={{color: '#FFF', fontSize: 22, fontWeight: 'bold'}}>Mantenimiento
                                    Express</ThemedText>
                                <ThemedText style={{color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4}}>Tu
                                    equipo listo en menos de 24 horas.</ThemedText>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Grid de Acciones Rápidas */}
                    <View style={{paddingHorizontal: 20}}>
                        <ThemedText type="subtitle" style={[G.sectionTitle, {
                            fontSize: 18,
                            fontWeight: '700',
                            marginBottom: 15,
                            marginLeft: 5,
                            color: textColor
                        }]}>
                            ¿Qué necesitas hoy?
                        </ThemedText>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: 12}}>
                            <QuickAction
                                icon="construct"
                                label="Reparación"
                                color={COLORS.primary}
                                onPress={() => router.push('/cotizaciones')}
                            />
                            <QuickAction
                                icon="shield-checkmark"
                                label="Garantía"
                                color={COLORS.success}
                                onPress={handleWhatsAppPress}
                            />
                            <QuickAction
                                icon="flash"
                                label="Urgencias"
                                color="#FF3B30"
                                onPress={handleUrgencyPress}
                            />
                        </View>
                    </View>

                    <View style={{paddingHorizontal: 20, marginTop: 30}}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[G.btnPrimary, {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingRight: 20
                            }]}
                            onPress={() => router.push('/cotizaciones')}
                        >
                            <View style={{
                                backgroundColor: COLORS.onPrimary,
                                width: 40,
                                height: 40,
                                borderRadius: 14,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Ionicons name="add" size={24} color={COLORS.primary}/>
                            </View>
                            <ThemedText style={[G.btnText, {flex: 1, marginLeft: 15}]}>Nueva Cotización</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.onPrimary} style={{opacity: 0.7}}/>
                        </TouchableOpacity>
                    </View>

                    <View style={{height: 40}}/>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function QuickAction({icon, label, onPress, color}: any) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={{flex: 1}}>
            <ThemedView style={[styles.actionCard, {...shadow.sm}]}>
                <View style={[styles.iconCircle, {backgroundColor: `${color}15`}]}>
                    <Ionicons name={icon} size={26} color={color}/>
                </View>
                <ThemedText style={styles.actionLabel}>{label}</ThemedText>
            </ThemedView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    actionCard: {
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.2)',
    },
    iconCircle: {
        width: 55,
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
})