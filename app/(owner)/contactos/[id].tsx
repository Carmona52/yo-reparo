import React, {useState, useCallback} from 'react';
import {
    StyleSheet, View, ScrollView, TouchableOpacity,
    Linking, Alert, ActivityIndicator, useColorScheme
} from 'react-native';
import {useLocalSearchParams, useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; // O tu librería de persistencia

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {supabase} from "@/libs/supabase";
import {Contact} from "@/libs/types/contact";

export default function ContactDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Lógica de Carga con Caché
    const loadContactData = useCallback(async () => {
        try {
            const cachedData = await AsyncStorage.getItem('contacts_list_cache');
            if (cachedData) {
                const list = JSON.parse(cachedData);
                const found = list.find((c: any) => c.id === id);
                if (found) {
                    setContact(found);
                    setLoading(false);
                }
            }
        } catch (error: any) {
            console.error("Error al sincronizar contacto:", error.message);
            if (!contact) {
                Alert.alert("Error", "No se pudo obtener la información.");
                router.back();
            }
        } finally {
            setLoading(false);
        }
    }, [id, contact]);

    useFocusEffect(
        useCallback(() => {
            loadContactData();
        }, [id])
    );


    if (loading && !contact) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a7ea4"/>
            </ThemedView>
        );
    }

    return (
        <SafeAreaView style={{flex: 1}}>
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"}/>
                    </TouchableOpacity>
                    <ThemedText type="subtitle">Detalle de Contacto</ThemedText>
                    <View style={{width: 40}}/>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatar}>
                            <ThemedText style={styles.avatarText}>
                                {contact?.name?.charAt(0).toUpperCase() || '?'}
                            </ThemedText>
                        </View>
                        <ThemedText type="title" style={styles.mainName}>{contact?.name}</ThemedText>
                        <ThemedText style={styles.mainPhone}>{contact?.phone || 'Sin teléfono'}</ThemedText>

                        {/* Botones de acción rápida */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionBtn}
                                              onPress={() => contact?.phone && Linking.openURL(`tel:${contact.phone}`)}>
                                <Ionicons name="call" size={22} color="#fff"/>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#25D366'}]}
                                              onPress={() => contact?.phone && Linking.openURL(`https://wa.me/${contact.phone.replace(/\s/g, '')}`)}>
                                <Ionicons name="logo-whatsapp" size={22} color="#fff"/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Info de Dirección */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Ubicación</ThemedText>
                        <ThemedView style={styles.infoBox}>
                            <ThemedText type="defaultSemiBold">{contact?.address_line_1}</ThemedText>
                            <ThemedText style={styles.subDetail}>
                                {contact?.neighborhood}, {contact?.city}, {contact?.state}
                            </ThemedText>

                            <TouchableOpacity style={styles.mapLink} onPress={() => {/* handleOpenMap */
                            }}>
                                <ThemedText style={styles.mapLinkText}>Abrir en Mapas</ThemedText>
                                <Ionicons name="map-outline" size={16} color="#0a7ea4"/>
                            </TouchableOpacity>
                        </ThemedView>
                    </View>
                </ScrollView>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, paddingHorizontal: 20},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10
    },
    backButton: {padding: 8},
    editButton: {padding: 8},
    profileSection: {alignItems: 'center', marginVertical: 30},
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: '#0a7ea4', justifyContent: 'center',
        alignItems: 'center', marginBottom: 15,
        elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5
    },
    avatarText: {color: '#fff', fontSize: 38, fontWeight: 'bold'},
    mainName: {fontSize: 24, textAlign: 'center'},
    mainPhone: {fontSize: 16, opacity: 0.5, marginTop: 5},
    quickActions: {flexDirection: 'row', gap: 20, marginTop: 20},
    actionBtn: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#0a7ea4', justifyContent: 'center',
        alignItems: 'center'
    },
    section: {marginBottom: 25},
    sectionTitle: {
        fontSize: 12, fontWeight: 'bold', opacity: 0.4,
        textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1
    },
    infoBox: {
        padding: 16, borderRadius: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderWidth: 1, borderColor: 'rgba(150, 150, 150, 0.1)'
    },
    row: {flexDirection: 'row', gap: 12},
    subDetail: {fontSize: 14, opacity: 0.6, marginTop: 2},
    mapLink: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 5, marginTop: 15,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)'
    },
    mapLinkText: {color: '#0a7ea4', fontWeight: 'bold', fontSize: 14}
});