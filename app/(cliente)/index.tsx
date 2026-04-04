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
    Platform
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {Ionicons} from '@expo/vector-icons';

// Importamos los componentes con soporte de temas de Expo
import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";

const {width} = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
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
                            if (supported) {
                                await Linking.openURL(url);
                            } else {
                                await Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
                            }
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
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "Tu dispositivo no soporta llamadas telefónicas.");
            }
        } catch (error) {
            console.error("Error al intentar llamar:", error);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF"/>
                    }>

                    {/* Header con Logo */}
                    <View style={styles.header}>
                        <View>
                            <ThemedText style={styles.welcomeText}>Bienvenido a </ThemedText>
                            <Image
                                source={require('@/assets/images/Yoreparo1024.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* Sección de Banner Publicitario */}
                    <View style={styles.adSection}>
                        <TouchableOpacity activeOpacity={0.9} style={styles.adCard}>
                            <Image
                                source={{uri: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1000'}}
                                style={styles.adImage}
                            />
                            <View style={styles.adOverlay}>
                                <View style={styles.tagContainer}>
                                    <ThemedText style={styles.adTag}>PROMO DEL MES</ThemedText>
                                </View>
                                <ThemedText style={styles.adTitle}>Mantenimiento Express</ThemedText>
                                <ThemedText style={styles.adSubtitle}>Tu equipo listo en menos de 24 horas.</ThemedText>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Grid de Acciones Rápidas */}
                    <View style={styles.section}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>¿Qué necesitas hoy?</ThemedText>
                        <View style={styles.grid}>
                            <QuickAction
                                icon="construct"
                                label="Reparación"
                                color="#007AFF"
                                onPress={() => router.push('/cotizaciones')}
                            />
                            <QuickAction
                                icon="shield-checkmark"
                                label="Garantía"
                                color="#34C759"
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

                    {/* Botón Principal de Nueva Cotización */}
                    <View style={styles.ctaContainer}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.mainButton}
                            onPress={() => router.push('/cotizaciones')}>
                            <View style={styles.buttonIconCircle}>
                                <Ionicons name="add" size={24} color="#007AFF"/>
                            </View>
                            <ThemedText style={styles.mainButtonText}>Nueva Cotización</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{opacity: 0.7}}/>
                        </TouchableOpacity>
                    </View>

                    <View style={{height: 40}}/>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

// Sub-componente para los botones del Grid
function QuickAction({icon, label, onPress, color}: any) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={{ flex: 1 }}>
            <ThemedView style={styles.actionCard}>
                <View style={[styles.iconCircle, {backgroundColor: `${color}15`}]}>
                    <Ionicons name={icon} size={26} color={color}/>
                </View>
                <ThemedText style={styles.actionLabel}>{label}</ThemedText>
            </ThemedView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
    header: {
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    welcomeText: {
        fontSize: 14,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    logoImage: {
        width: 120,
        height: 50,
        marginTop: 5
    },
    adSection: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    adCard: {
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#222', // Fondo de respaldo mientras carga imagen
    },
    adImage: {
        width: '100%',
        height: '100%',
    },
    adOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0, top: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', // Mantenemos overlay oscuro para legibilidad
        padding: 20,
        justifyContent: 'flex-end',
    },
    tagContainer: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    adTag: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    adTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    adSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
    section: { paddingHorizontal: 20 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        marginLeft: 5,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionCard: {
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.2)',
        // Sombras sutiles adaptables
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
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
    ctaContainer: {
        paddingHorizontal: 20,
        marginTop: 30,
    },
    mainButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 20,
    },
    buttonIconCircle: {
        backgroundColor: '#FFF',
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
        flex: 1,
        marginLeft: 15,
    },
});