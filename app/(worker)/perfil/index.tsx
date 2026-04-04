import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/libs/supabase";

export default function ProfileScreen() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
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
        Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres salir de Yo Reparo?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Cerrar Sesión",
                style: "destructive",
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace("/(auth)/login");
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
        <ThemedView style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.container}>
                        {/* Header de Perfil */}
                        <View style={styles.header}>
                            <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#1c1c1e' : '#f0f2f5' }]}>
                                <Ionicons name="person" size={50} color="#0a7ea4" />
                                <View style={styles.onlineBadge} />
                            </View>

                            <ThemedText type="title" style={styles.userName}>
                                {profile?.name || "Usuario"}
                            </ThemedText>

                            <View style={styles.roleContainer}>
                                <ThemedText style={styles.roleText}>
                                    {profile?.role?.toUpperCase() || "COLABORADOR"}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Tarjeta de Información */}
                        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
                            <ProfileItem
                                icon="call"
                                label="Teléfono de contacto"
                                value={profile?.phone || "No registrado"}
                                isDark={isDark}
                            />
                            <ProfileItem
                                icon="location"
                                label="Ubicación base"
                                value="Tehuacán, Puebla"
                                isDark={isDark}
                                isLast
                            />
                        </View>

                        {/* Botones de Acción */}
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.toolsButton}
                                activeOpacity={0.8}
                                onPress={() => router.push("/perfil/herramientas/page")}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="hammer" size={20} color="#fff" />
                                </View>
                                <ThemedText style={styles.toolsText}>Herramientas Prestadas</ThemedText>
                                <Ionicons name="chevron-forward" size={20} color="#fff" style={{ opacity: 0.7 }} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.signOutButton, { backgroundColor: isDark ? 'rgba(255, 68, 68, 0.1)' : '#fff5f5' }]}
                                activeOpacity={0.7}
                                onPress={handleSignOut}>
                                <Ionicons name="log-out-outline" size={22} color="#ff4444" />
                                <ThemedText style={styles.signOutText}>Cerrar Sesión</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.versionText}>Yo Reparo v1.0.2 - 2026</ThemedText>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function ProfileItem({ icon, label, value, isDark, isLast }: { icon: any, label: string, value: string, isDark: boolean, isLast?: boolean }) {
    return (
        <View style={[styles.infoItem, isLast && { borderBottomWidth: 0 }]}>
            <View style={[styles.itemIconContainer, { backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : '#e1f5fe' }]}>
                <Ionicons name={icon} size={20} color="#0a7ea4" />
            </View>
            <View style={{ flex: 1 }}>
                <ThemedText style={styles.infoLabel}>{label}</ThemedText>
                <ThemedText style={styles.infoValue}>{value}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { alignItems: 'center', marginVertical: 20 },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: '#fff', // Idealmente usar el color de fondo dinámico
    },
    userName: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    roleContainer: {
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roleText: { color: '#0a7ea4', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    infoCard: {
        borderRadius: 24,
        padding: 16,
        marginTop: 10,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 2 }
        })
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150, 150, 150, 0.08)',
    },
    itemIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    infoLabel: { fontSize: 11, opacity: 0.5, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
    infoValue: { fontSize: 16, fontWeight: '600' },

    actionsContainer: { marginTop: 30, gap: 15 },
    toolsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a7ea4',
        padding: 16,
        borderRadius: 20,
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    toolsText: { color: '#fff', fontWeight: 'bold', fontSize: 16, flex: 1 },

    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        gap: 10,
        marginTop: 10
    },
    signOutText: { color: '#ff4444', fontWeight: 'bold', fontSize: 15 },
    versionText: { textAlign: 'center', marginTop: 40, opacity: 0.3, fontSize: 12 }
});