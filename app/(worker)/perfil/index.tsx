import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, Alert, ScrollView, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {G, COLORS, shadow} from "@/styles/global-styles";

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

export default function ProfileScreen() {
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, surfaceBg, borderColor} = useAppTheme();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            const {data: {user}} = await supabase.auth.getUser();
            if (user) {
                const {data, error} = await supabase
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
            {text: "Cancelar", style: "cancel"},
            {
                text: "Salir",
                style: "destructive",
                onPress: async () => {
                    try {
                        const {data: {user}} = await supabase.auth.getUser();
                        if (user) {
                            const {error} = await supabase
                                .from('profiles')
                                .update({expo_token: null})
                                .eq('id', user.id);
                            if (error) console.error("Error limpiando token:", error.message);
                        }
                    } catch (error: any) {
                        console.error("Error inesperado:", error.message);
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
                <ThemedText>Cargando perfil...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={[G.pageContent, {paddingTop: 0}]}>
                        {/* Header de Perfil */}
                        <View style={G.profileHeader}>
                            <View style={[G.avatarCircle, {backgroundColor: surfaceBg, borderColor}]}>
                                <Ionicons name="person" size={50} color={COLORS.primary}/>
                                <View style={G.onlineBadge}/>
                            </View>
                            <ThemedText type="title" style={[G.profileName, {color: textColor}]}>
                                {profile?.name || "Usuario"}
                            </ThemedText>
                            <View style={G.roleBadge}>
                                <ThemedText style={G.roleBadgeText}>
                                    {profile?.role?.toUpperCase() || "COLABORADOR"}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Tarjeta de Información */}
                        <View style={[G.card, {backgroundColor: cardBg, borderColor, padding: 16}, shadow.sm]}>
                            <ProfileItem
                                icon="call"
                                label="Teléfono de contacto"
                                value={profile?.phone || "No registrado"}
                            />
                            <ProfileItem
                                icon="location"
                                label="Ubicación base"
                                value="Tehuacán, Puebla"
                                isLast
                            />
                        </View>

                        {/* Botones de Acción */}
                        <View style={{marginTop: 30, gap: 15}}>
                            <TouchableOpacity
                                style={[G.btnPrimary, {justifyContent: 'space-between', paddingRight: 16}]}
                                activeOpacity={0.8}
                                onPress={() => router.push("/perfil/herramientas/page")}>
                                <View style={[G.iconCirclePrimary, {
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                }]}>
                                    <Ionicons name="hammer" size={20} color={COLORS.onPrimary}/>
                                </View>
                                <ThemedText style={[G.btnText, {flex: 1, marginLeft: 12}]}>
                                    Herramientas Prestadas
                                </ThemedText>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.onPrimary}
                                          style={{opacity: 0.7}}/>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={G.signOutBtn}
                                activeOpacity={0.7}
                                onPress={handleSignOut}>
                                <Ionicons name="log-out-outline" size={22} color={COLORS.danger}/>
                                <ThemedText style={G.signOutText}>Cerrar Sesión</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={G.versionText}>Yo Reparo v1.1.0</ThemedText>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function ProfileItem({icon, label, value, isLast}: { icon: any; label: string; value: string; isLast?: boolean }) {
    const {textColor, mutedText} = useAppTheme();
    return (
        <View style={[G.infoRow, isLast && {borderBottomWidth: 0}]}>
            <View style={[G.iconBadgeSm, {backgroundColor: COLORS.primaryBgMedium, marginRight: 15}]}>
                <Ionicons name={icon} size={20} color={COLORS.primary}/>
            </View>
            <View style={G.infoTextGroup}>
                <ThemedText style={G.infoLabel}>{label}</ThemedText>
                <ThemedText style={[G.infoValue, {color: textColor}]}>{value}</ThemedText>
            </View>
        </View>
    );
}