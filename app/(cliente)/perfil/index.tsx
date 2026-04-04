import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/libs/supabase";

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setProfile(data);
            }
        } catch (error: any) {
            console.error("Error al obtener perfil:", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignOut() {
        Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres salir?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Salir",
                style: "destructive",
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace("/(auth)/login");
                }
            }
        ]);
    }

    const handleWhatsAppPress = async () => {
        const phoneNumber = "522382288483";
        const message = "Hola Yo Reparo, necesito ayuda con problemas dentro de la app";
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
    };

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ThemedText>Cargando perfil...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.container}>
                        {/* Cabecera de Perfil */}
                        <View style={styles.header}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person-circle" size={100} color="#007AFF" />
                            </View>
                            <ThemedText type="title" style={styles.userName}>
                                {profile?.name || "Cliente"}
                            </ThemedText>
                            <View style={styles.badge}>
                                <ThemedText style={styles.badgeText}>USUARIO REGISTRADO</ThemedText>
                            </View>
                        </View>

                        {/* Información Personal */}
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Mi Información</ThemedText>
                        <View style={styles.infoSection}>
                            <ProfileItem
                                icon="mail-outline"
                                label="Correo electrónico"
                                value={profile?.email || "No disponible"}
                            />
                            <ProfileItem
                                icon="call-outline"
                                label="Teléfono"
                                value={profile?.phone || "No registrado"}
                            />
                            <ProfileItem
                                icon="location-outline"
                                label="Ciudad"
                                value="Tehuacán, Puebla"
                            />
                        </View>

                        {/* Opciones del Cliente */}
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Actividad</ThemedText>

                        <TouchableOpacity
                            style={styles.clientButton}
                            onPress={() => router.push("/cotizaciones")}>
                            <View style={styles.buttonIconBg}>
                                <Ionicons name="document-text-outline" size={22} color="#007AFF" />
                            </View>
                            <ThemedText style={styles.buttonText}>Mis Cotizaciones</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.clientButton}
                            onPress={handleWhatsAppPress}>
                            <View style={styles.buttonIconBg}>
                                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                            </View>
                            <ThemedText style={styles.buttonText}>Soporte Técnico</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>

                        {/* Botón Salir */}
                        <TouchableOpacity
                            style={styles.signOutButton}
                            onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                            <ThemedText style={styles.signOutText}>Cerrar Sesión</ThemedText>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function ProfileItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <View style={styles.infoItem}>
            <Ionicons name={icon} size={22} color="#007AFF" style={styles.infoIcon} />
            <View>
                <ThemedText style={styles.infoLabel}>{label}</ThemedText>
                <ThemedText style={styles.infoValue}>{value}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 25 },
    avatarContainer: { marginBottom: 10 },
    userName: { fontSize: 24, marginBottom: 5 },
    badge: {
        backgroundColor: '#E6F4FE', // Color de tu app.json
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
    sectionTitle: { marginBottom: 10, marginTop: 15, opacity: 0.8 },
    infoSection: {
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoIcon: { marginRight: 15 },
    infoLabel: { fontSize: 12, opacity: 0.6 },
    infoValue: { fontSize: 16, fontWeight: '500' },
    clientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
    },
    buttonIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#E6F4FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    buttonText: { flex: 1, fontSize: 16, fontWeight: '500' },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 15,
        marginTop: 30,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    signOutText: { color: '#ff4444', fontWeight: 'bold', marginLeft: 10 },
});