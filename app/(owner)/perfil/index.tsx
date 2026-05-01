import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/libs/supabase";
import { G, COLORS, shadow } from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
    };
};

export default function ProfileScreen() {
    const router = useRouter();
    const { isDark, textColor, mutedText, cardBg, surfaceBg } = useAppTheme();

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
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ expo_token: null })
                                .eq('id', user.id);
                            if (error) {
                                console.error("Error limpiando el token de Expo:", error.message);
                            } else {
                                console.log("Token de Expo removido exitosamente.");
                            }
                        }
                    } catch (error: any) {
                        console.error("Error inesperado al limpiar el token:", error.message);
                    } finally {
                        await supabase.auth.signOut();
                        router.replace("/(auth)/login");
                    }
                }
            }
        ]);
    }

    if (loading) {
        return (
            <ThemedView style={G.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={{ marginTop: 10, color: mutedText }}>Cargando perfil...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={G.scrollContent}>

                    <View style={G.profileHeader}>
                        <View style={[G.avatarCircle, { backgroundColor: surfaceBg }]}>
                            <Ionicons name="person" size={50} color={COLORS.primary} />
                        </View>
                        <ThemedText type="title" style={[G.profileName, { color: textColor }]}>
                            {profile?.name || "Usuario"}
                        </ThemedText>
                        <View style={[G.roleBadge, { backgroundColor: profile?.role === 'owner' ? COLORS.primary : COLORS.success }]}>
                            <ThemedText style={{ color: 'white', fontSize:20 }}>
                                {profile?.role?.toUpperCase() || "SIN ROL"}
                            </ThemedText>
                        </View>
                    </View>

                    <ThemedText style={[G.sectionLabel, { marginTop: 0 }]}>Información Personal</ThemedText>
                    <View style={[G.card, { backgroundColor: cardBg, borderColor: COLORS.border, padding: 0, overflow: 'hidden', marginBottom: 25 }]}>
                        <ProfileItem
                            icon="mail-outline"
                            label="Correo Electrónico"
                            value={profile?.email || "No disponible"}
                            isDark={isDark}
                        />
                        <ProfileItem
                            icon="call-outline"
                            label="Teléfono"
                            value={profile?.phone || "No registrado"}
                            isDark={isDark}
                        />
                        <ProfileItem
                            icon="location-outline"
                            label="Ubicación"
                            value="Tehuacán, Puebla"
                            isDark={isDark}
                            isLast
                        />
                    </View>

                    {profile?.role === 'owner' && (
                        <>
                            <ThemedText style={G.sectionLabel}>Administración</ThemedText>
                            <TouchableOpacity
                                style={[G.menuItem, { backgroundColor: cardBg, borderColor: COLORS.border, borderWidth: 1 }]}
                                activeOpacity={0.7}
                                onPress={() => router.push('/(owner)/workers')}
                            >
                                <View style={[G.iconBadge, { backgroundColor: COLORS.primaryBgMedium }]}>
                                    <Ionicons name="people" size={24} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 15 }}>
                                    <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: textColor }}>
                                        Gestionar Trabajadores
                                    </ThemedText>
                                    <ThemedText style={{ color: mutedText, fontSize: 13 }}>
                                        Altas, bajas y edición
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.mutedIcon} />
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={[G.signOutBtn, { marginTop: 10 }]}
                        activeOpacity={0.8}
                        onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                        <ThemedText style={G.signOutText}>Cerrar Sesión</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={G.versionText}>Yo Reparo • v1.0.0</ThemedText>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function ProfileItem({ icon, label, value, isDark, isLast }: any) {
    const { mutedText, textColor } = useAppTheme();
    return (
        <View style={[
            G.infoRow,
            !isLast && { borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle }
        ]}>
            <View style={[G.iconBadgeSm, { backgroundColor: COLORS.primaryBgMedium, marginRight: 15 }]}>
                <Ionicons name={icon} size={20} color={COLORS.primary} />
            </View>
            <View style={G.infoTextGroup}>
                <ThemedText style={G.infoLabel}>{label}</ThemedText>
                <ThemedText style={[G.infoValue, { color: textColor }]} numberOfLines={1}>
                    {value}
                </ThemedText>
            </View>
        </View>
    );
}