import React, {useState, useEffect} from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    useColorScheme,
    Platform
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";

export default function ProfileScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

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
                    await supabase.auth.signOut();
                    router.replace("/(auth)/login");
                }
            }
        ]);
    }

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color="#0a7ea4"/>
                <ThemedText style={{marginTop: 10}}>Cargando perfil...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <SafeAreaView style={{flex: 1}}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <ThemedView style={styles.container}>
                    <View style={styles.header}>
                        <View style={[styles.avatarContainer, {backgroundColor: isDark ? '#1c1c1e' : '#f0f0f0'}]}>
                            <Ionicons name="person" size={50} color="#0a7ea4"/>
                        </View>
                        <ThemedText type="title" style={styles.userName}>
                            {profile?.name || "Usuario"}
                        </ThemedText>
                        <View
                            style={[styles.roleBadge, {backgroundColor: profile?.role === 'owner' ? '#0a7ea4' : '#10b981'}]}>
                            <ThemedText style={styles.roleBadgeText}>
                                {profile?.role?.toUpperCase() || "SIN ROL"}
                            </ThemedText>
                        </View>
                    </View>

                    <ThemedText style={styles.sectionTitle}>Información</ThemedText>
                    <View style={[styles.card, {backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9'}]}>
                        <ProfileItem
                            icon="mail-outline"
                            label="Correo"
                            value={profile?.email || "No disponible"}
                            isDark={isDark}/>
                        <ProfileItem
                            icon="call-outline"
                            label="Teléfono"
                            value={profile?.phone || "No registrado"}
                            isDark={isDark}/>
                        <ProfileItem
                            icon="location-outline"
                            label="Ubicación"
                            value="Tehuacán, Puebla"
                            isDark={isDark}
                            isLast/>
                    </View>

                    {profile?.role === 'owner' && (
                        <>
                            <ThemedText style={styles.sectionTitle}>Panel de Control</ThemedText>
                            <TouchableOpacity
                                style={[styles.actionCard, {backgroundColor: isDark ? '#1c1c1e' : '#f9f9f9'}]}
                                activeOpacity={0.7}
                                onPress={() => router.push('/(owner)/workers')}
                            >
                                <View style={styles.actionIconBg}>
                                    <Ionicons name="people" size={24} color="#0a7ea4"/>
                                </View>
                                <View style={{flex: 1, marginLeft: 15}}>
                                    <ThemedText type="defaultSemiBold" style={{fontSize: 16}}>
                                        Gestionar Trabajadores
                                    </ThemedText>
                                    <ThemedText style={{opacity: 0.5, fontSize: 13}}>
                                        Altas, bajas y edición de personal
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#ccc"/>
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.signOutButton}
                        activeOpacity={0.8}
                        onPress={handleSignOut}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ff4444"/>
                        <ThemedText style={styles.signOutText}>Cerrar Sesión</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.versionText}>Versión 1.0.0</ThemedText>
                    <View style={{height: 40}}/>
                </ThemedView>
            </ScrollView>
        </SafeAreaView>
    );
}

function ProfileItem({icon, label, value, isDark, isLast}: any) {
    return (
        <View style={[styles.infoItem, !isLast && {
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#2c2c2e' : '#eee'
        }]}>
            <View style={styles.infoIconBg}>
                <Ionicons name={icon} size={20} color="#0a7ea4"/>
            </View>
            <View>
                <ThemedText style={styles.infoLabel}>{label}</ThemedText>
                <ThemedText style={styles.infoValue}>{value}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 24},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},

    header: {alignItems: 'center', marginBottom: 35, marginTop: 10},
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        ...Platform.select({
            ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10},
            android: {elevation: 4}
        })
    },
    userName: {fontSize: 26, fontWeight: 'bold', marginBottom: 8},
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleBadgeText: {color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 1},

    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        opacity: 0.4,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 1
    },

    card: {
        borderRadius: 24,
        padding: 8,
        marginBottom: 25,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    infoIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    infoLabel: {fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginBottom: 2},
    infoValue: {fontSize: 15, fontWeight: '500'},

    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        marginBottom: 35,
    },
    actionIconBg: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 68, 68, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.2)',
    },
    signOutText: {color: '#ff4444', fontWeight: 'bold', marginLeft: 10, fontSize: 16},

    versionText: {
        textAlign: 'center',
        marginTop: 25,
        fontSize: 12,
        opacity: 0.3
    }
});