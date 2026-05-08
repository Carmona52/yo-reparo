import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, Alert, ScrollView, Linking, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {G, COLORS} from "@/styles/global-styles";

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
    const {isDark, textColor, mutedText, surfaceBg} = useAppTheme();
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
                        console.error("Error limpiando token:", error.message);
                    } finally {
                        await supabase.auth.signOut();
                        router.replace("/(auth)/login");
                    }
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
            if (supported) await Linking.openURL(url);
            else await Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
        } catch (error) {
            Alert.alert("Error", "No se pudo abrir WhatsApp");
        }
    };

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
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                    <View style={[G.pageContent, {paddingTop: 0}]}>
                        {/* Cabecera de Perfil */}
                        <View style={G.profileHeader}>
                            <View style={[G.avatarCircle, {backgroundColor: surfaceBg}]}>
                                <Ionicons name="person-circle" size={90} color={COLORS.primary}/>
                            </View>
                            <ThemedText type="title" style={[G.profileName, {color: textColor}]}>
                                {profile?.name || "Cliente"}
                            </ThemedText>
                            <View style={[G.badge, {
                                backgroundColor: `${COLORS.primary}1A`,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 20
                            }]}>
                                <ThemedText style={[G.badgeText, {color: COLORS.primary}]}>USUARIO
                                    REGISTRADO</ThemedText>
                            </View>
                        </View>

                        {/* Información Personal */}
                        <ThemedText type="defaultSemiBold" style={[G.sectionLabel, {marginTop: 0}]}>Mi
                            Información</ThemedText>
                        <View style={[G.cardSurface, {marginBottom: 20}]}>
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

                        {/* Actividad */}
                        <ThemedText type="defaultSemiBold" style={G.sectionLabel}>Actividad</ThemedText>

                        {/* Mis Cotizaciones */}
                        <TouchableOpacity
                            style={[G.menuItem, {backgroundColor: surfaceBg, marginBottom: 10}]}
                            onPress={() => router.push("/cotizaciones")}>
                            <View style={[G.iconBadgeSm, {backgroundColor: `${COLORS.primary}1A`}]}>
                                <Ionicons name="document-text-outline" size={22} color={COLORS.primary}/>
                            </View>
                            <ThemedText style={[G.menuItemText, {color: textColor}]}>Mis Cotizaciones</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.mutedIcon}/>
                        </TouchableOpacity>

                        {/* Soporte Técnico (WhatsApp) */}
                        <TouchableOpacity
                            style={[G.menuItem, {backgroundColor: surfaceBg, marginBottom: 10}]}
                            onPress={handleWhatsAppPress}>
                            <View style={[G.iconBadgeSm, {backgroundColor: `${COLORS.whatsapp}1A`}]}>
                                <Ionicons name="logo-whatsapp" size={22} color={COLORS.whatsapp}/>
                            </View>
                            <ThemedText style={[G.menuItemText, {color: textColor}]}>Soporte Técnico</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.mutedIcon}/>
                        </TouchableOpacity>

                        {/* Cerrar Sesión */}
                        <TouchableOpacity
                            style={G.signOutBtn}
                            onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={20} color={COLORS.danger}/>
                            <ThemedText style={G.signOutText}>Cerrar Sesión</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={G.versionText}>Yo Reparo • v1.1.0</ThemedText>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

function ProfileItem({icon, label, value}: { icon: any; label: string; value: string }) {
    const {textColor, mutedText} = useAppTheme();
    return (
        <View style={[G.infoRow, {justifyContent: 'flex-start'}]}>
            <Ionicons name={icon} size={22} color={COLORS.primary} style={{marginRight: 15, width: 30}}/>
            <View style={G.infoTextGroup}>
                <ThemedText style={G.infoLabel}>{label}</ThemedText>
                <ThemedText style={[G.infoValue, {color: textColor}]}>{value}</ThemedText>
            </View>
        </View>
    );
}