import React, { useState, useCallback } from 'react';
import {
    View, ScrollView, TouchableOpacity,
    Linking, ActivityIndicator, Platform, useColorScheme
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Contact } from "@/libs/types/contact";
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
        avatarBg: isDark ? COLORS.primary : '#e1f5fe',
        avatarTextColor: isDark ? COLORS.onPrimary : COLORS.primary,
    };
};

export default function ContactDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { isDark, textColor, mutedText, cardBg, avatarBg, avatarTextColor } = useAppTheme();

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);

    const loadContactData = useCallback(async () => {
        try {
            const cachedData = await AsyncStorage.getItem('contacts_list_cache');
            if (cachedData) {
                const list = JSON.parse(cachedData);
                const found = list.find((c: any) => c.id === id);
                if (found) setContact(found);
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
            <ThemedView style={G.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
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
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top', 'bottom']}>

                <View style={[G.topBar, { justifyContent: 'space-between' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={G.backBtnPlain}>
                        <Ionicons name="chevron-back" size={28} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 18, color: textColor }}>
                        Perfil del Cliente
                    </ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={G.scrollContent}>

                    <View style={G.profileHeader}>
                        <View style={[G.avatarSquircle, shadow.md, { backgroundColor: avatarBg }]}>
                            <ThemedText style={[G.avatarTextLg, { color: avatarTextColor }]}>
                                {contact?.name?.charAt(0).toUpperCase() || '?'}
                            </ThemedText>
                        </View>
                        <ThemedText type="title" style={[G.profileName, { color: textColor }]}>
                            {contact?.name}
                        </ThemedText>
                        <ThemedText style={[G.greetingText, { marginTop: 4, textAlign: 'center', color: mutedText }]}>
                            {contact?.phone || 'Sin teléfono asignado'}
                        </ThemedText>


                        <View style={G.quickActions}>
                            <TouchableOpacity
                                style={[G.actionBtnLg, { backgroundColor: COLORS.primary }]}
                                onPress={() => contact?.phone && Linking.openURL(`tel:${contact.phone}`)}
                            >
                                <Ionicons name="call" size={24} color={COLORS.onPrimary} />
                                <ThemedText style={G.actionBtnText}>Llamar</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[G.actionBtnLg, { backgroundColor: COLORS.whatsapp }]}
                                onPress={() => contact?.phone && Linking.openURL(`https://wa.me/52${contact.phone.replace(/\s/g, '')}`)}
                            >
                                <Ionicons name="logo-whatsapp" size={24} color={COLORS.onPrimary} />
                                <ThemedText style={G.actionBtnText}>WhatsApp</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={G.pageContent}>
                        <View style={[G.row, { marginBottom: 12, marginLeft: 5 }]}>
                            <Ionicons name="location" size={18} color={COLORS.primary} />
                            <ThemedText style={[G.sectionLabel, { marginTop: 0, marginBottom: 0, marginLeft: 8 }]}>
                                Ubicación y Domicilio
                            </ThemedText>
                        </View>

                        <View style={[G.cardLg, { backgroundColor: cardBg, borderColor: COLORS.border }]}>
                            <View style={{ marginBottom: 20 }}>
                                <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 6, color: textColor }}>
                                    {contact?.address_line_1}
                                </ThemedText>
                                <ThemedText style={[G.infoValueSm, { color: mutedText, marginBottom: 2 }]}>
                                    Col. {contact?.neighborhood}
                                </ThemedText>
                                <ThemedText style={[G.infoValueSm, { color: mutedText }]}>
                                    {contact?.city}, {contact?.state}
                                </ThemedText>
                            </View>

                            <TouchableOpacity style={G.locationCard} onPress={openInMaps}>
                                <Ionicons name="navigate-circle" size={20} color={COLORS.primary} />
                                <ThemedText style={{ color: COLORS.primary, fontWeight: '700', fontSize: 15 }}>
                                    Cómo llegar con GPS
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}