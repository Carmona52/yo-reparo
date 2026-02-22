import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
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
                    router.replace("/(auth)/login"); // Ajusta a tu ruta de login
                }
            }
        ]);
    }

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ThemedText>Cargando perfil...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView>
                <ThemedView style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person-circle" size={100} color="#0a7ea4" />
                        </View>
                        <ThemedText type="title" style={styles.userName}>
                            {profile?.name|| "Usuario"}
                        </ThemedText>
                        <View style={styles.badge}>
                            <ThemedText style={styles.badgeText}>
                                {profile?.role?.toUpperCase() || "CLIENTE"}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <ProfileItem
                            icon="call-outline"
                            label="Teléfono"
                            value={profile?.phone || "No registrado"}
                        />
                        <ProfileItem
                            icon="location-outline"
                            label="Ubicación"
                            value="Tehuacán, Puebla"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={handleSignOut}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                        <ThemedText style={styles.signOutText}>Cerrar Sesión</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ScrollView>
        </SafeAreaView>
    );
}

function ProfileItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <View style={styles.infoItem}>
            <Ionicons name={icon} size={22} color="#0a7ea4" style={styles.infoIcon} />
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
    header: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { marginBottom: 10 },
    userName: { fontSize: 24, marginBottom: 5 },
    badge: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    infoSection: {
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        borderRadius: 15,
        padding: 15,
        marginBottom: 30,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    },
    infoIcon: { marginRight: 15 },
    infoLabel: { fontSize: 12, opacity: 0.6 },
    infoValue: { fontSize: 16, fontWeight: '500' },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    signOutText: { color: '#ff4444', fontWeight: 'bold', marginLeft: 10 },
});