import React, {useState, useCallback} from 'react';
import {
    StyleSheet, View, ScrollView, TouchableOpacity,
    Linking, Alert, ActivityIndicator, useColorScheme, Platform
} from 'react-native';
import {useLocalSearchParams, useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {Contact} from "@/libs/types/contact";

export default function ContactDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);

    const loadContactData = useCallback(async () => {
        try {
            const cachedData = await AsyncStorage.getItem('contacts_list_cache');
            if (cachedData) {
                const list = JSON.parse(cachedData);
                const found = list.find((c: any) => c.id === id);
                if (found) {
                    setContact(found);
                }
            }
        } catch (error: any) {
            console.error("Error al sincronizar contacto:", error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

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

    const openInMaps = () => {
        const address = `${contact?.address_line_1}, ${contact?.neighborhood}, ${contact?.city}`;
        const url = Platform.select({
            ios: `maps:0,0?q=${address}`,
            android: `geo:0,0?q=${address}`,
        });
        if (url) Linking.openURL(url);
    };

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top', 'bottom']}>
                {/* Header Personalizado */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={isDark ? "#fff" : "#000"}/>
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={{fontSize: 18}}>Perfil del Cliente</ThemedText>
                    <View style={{width: 44}}/>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Sección de Perfil Central */}
                    <View style={styles.profileSection}>
                        <View style={[styles.avatar, {backgroundColor: isDark ? '#0a7ea4' : '#e1f5fe'}]}>
                            <ThemedText style={[styles.avatarText, {color: isDark ? '#fff' : '#0a7ea4'}]}>
                                {contact?.name?.charAt(0).toUpperCase() || '?'}
                            </ThemedText>
                        </View>
                        <ThemedText type="title" style={styles.mainName}>{contact?.name}</ThemedText>
                        <ThemedText style={styles.mainPhone}>{contact?.phone || 'Sin teléfono asignado'}</ThemedText>

                        {/* Botones de Acción Rápida Rediseñados */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, {backgroundColor: '#0a7ea4'}]}
                                onPress={() => contact?.phone && Linking.openURL(`tel:${contact.phone}`)}
                            >
                                <Ionicons name="call" size={24} color="#fff"/>
                                <ThemedText style={styles.btnLabel}>Llamar</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, {backgroundColor: '#25D366'}]}
                                onPress={() => contact?.phone && Linking.openURL(`https://wa.me/52${contact.phone.replace(/\s/g, '')}`)}
                            >
                                <Ionicons name="logo-whatsapp" size={24} color="#fff"/>
                                <ThemedText style={styles.btnLabel}>WhatsApp</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Información Detallada */}
                    <View style={styles.detailsWrapper}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location" size={18} color="#0a7ea4"/>
                            <ThemedText style={styles.sectionTitle}>Ubicación y Domicilio</ThemedText>
                        </View>

                        <View
                            style={[styles.infoBox, {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9'}]}>
                            <View style={styles.addressInfo}>
                                <ThemedText type="defaultSemiBold" style={styles.addressLine}>
                                    {contact?.address_line_1}
                                </ThemedText>
                                <ThemedText style={styles.subDetail}>
                                    Col. {contact?.neighborhood}
                                </ThemedText>
                                <ThemedText style={styles.subDetail}>
                                    {contact?.city}, {contact?.state}
                                </ThemedText>
                            </View>

                            <TouchableOpacity style={styles.mapLink} onPress={openInMaps}>
                                <Ionicons name="navigate-circle" size={20} color="#0a7ea4"/>
                                <ThemedText style={styles.mapLinkText}>Cómo llegar con GPS</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 60,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {paddingBottom: 40},
    profileSection: {alignItems: 'center', marginTop: 20, marginBottom: 30},
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 35, // Estilo Squircle moderno
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Platform.select({
            ios: {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10},
            android: {elevation: 4}
        })
    },
    avatarText: {fontSize: 42, fontWeight: '800'},
    mainName: {fontSize: 26, textAlign: 'center', paddingHorizontal: 20},
    mainPhone: {fontSize: 16, opacity: 0.5, marginTop: 8},

    quickActions: {flexDirection: 'row', gap: 15, marginTop: 25},
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        gap: 8,
        minWidth: 140
    },
    btnLabel: {color: '#fff', fontWeight: 'bold', fontSize: 14},

    detailsWrapper: {paddingHorizontal: 20},
    sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 5},
    sectionTitle: {fontSize: 13, fontWeight: 'bold', opacity: 0.4, textTransform: 'uppercase', letterSpacing: 0.5},

    infoBox: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    addressInfo: {marginBottom: 20},
    addressLine: {fontSize: 18, marginBottom: 6},
    subDetail: {fontSize: 14, opacity: 0.6, lineHeight: 20},

    mapLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150, 150, 150, 0.1)'
    },
    mapLinkText: {color: '#0a7ea4', fontWeight: '700', fontSize: 15}
});