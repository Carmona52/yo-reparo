import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FlatList,
    RefreshControl,
    View,
    Linking,
    TouchableOpacity,
    TextInput,
    ScrollView,
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

import { CreateContactModal } from "@/components/modals/owner/create-contact";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getAllContacts } from "@/libs/owner/contacts/get-contacts";
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
        surfaceBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        avatarBg: isDark ? COLORS.primaryBgMedium : COLORS.primaryBgMedium,
        avatarTextColor: COLORS.primary,
    };
};

export default function ContactsScreen() {
    const router = useRouter();
    const { isDark, textColor, mutedText, cardBg, surfaceBg, avatarBg, avatarTextColor } = useAppTheme();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('Todos');
    const [modalVisible, setModalVisible] = useState(false);

    const fetchData = async (force = false) => {
        try {
            const response = await getAllContacts(force);
            setContacts(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error al cargar contactos:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const neighborhoods = useMemo(() => {
        const unique = Array.from(new Set(contacts.map(c => c.neighborhood).filter(Boolean)));
        return ['Todos', ...unique.sort()];
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesNeighborhood = selectedNeighborhood === 'Todos' || contact.neighborhood === selectedNeighborhood;
            return matchesSearch && matchesNeighborhood;
        });
    }, [contacts, searchQuery, selectedNeighborhood]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, []);

    const makeCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const renderContactItem = ({ item }: { item: Contact }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                router.push({
                    pathname: "/(owner)/contactos/[id]",
                    params: { id: item.id }
                } as any);
            }}
        >
            <View style={[G.card, { backgroundColor: cardBg, borderColor: COLORS.border }, shadow.sm]}>
                <View style={G.row}>
                    <View style={[G.iconBadgeSm, { backgroundColor: avatarBg, marginRight: 15 }]}>
                        <ThemedText style={[G.avatarTextSm, { color: avatarTextColor }]}>
                            {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </ThemedText>
                    </View>
                    <View style={G.flex1}>
                        <ThemedText type="defaultSemiBold" style={[G.infoValue, { color: textColor, marginBottom: 2 }]}>
                            {item.name}
                        </ThemedText>
                        <ThemedText style={[G.infoValueSm, { color: mutedText }]} numberOfLines={1}>
                            <Ionicons name="location" size={10} color={COLORS.primary} /> {item.neighborhood || 'Sin colonia'}
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[G.iconBadgeSm, { backgroundColor: COLORS.success, ...shadow.success }]}
                        onPress={() => makeCall(item.phone)}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="call" size={18} color={COLORS.onPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <View style={G.pageHeader}>
                    <ThemedText type="title" style={[G.pageTitle, { color: textColor }]}>Clientes</ThemedText>

                    <View style={[G.searchContainer, { backgroundColor: surfaceBg, borderColor: COLORS.border }]}>
                        <Ionicons name="search" size={18} color={mutedText} />
                        <TextInput
                            placeholder="Buscar por nombre..."
                            placeholderTextColor={mutedText}
                            style={[G.searchInput, { color: textColor }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={mutedText} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={G.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={G.filterContainer}
                    >
                        {neighborhoods.map(nb => (
                            <TouchableOpacity
                                key={nb}
                                onPress={() => setSelectedNeighborhood(nb)}
                                style={[
                                    G.filterChip,
                                    selectedNeighborhood === nb && G.filterChipActive
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        G.filterText,
                                        selectedNeighborhood === nb && G.filterTextActive
                                    ]}
                                >
                                    {nb}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderContactItem}
                    contentContainerStyle={[G.pageContent, { paddingBottom: 100 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={G.emptyContainer}>
                                <View style={[G.emptyIconCircle, { backgroundColor: COLORS.primaryLight }]}>
                                    <Ionicons name="people-outline" size={40} color={COLORS.primary} />
                                </View>
                                <ThemedText style={[G.emptyText, { color: mutedText }]}>
                                    No se encontraron clientes en esta zona.
                                </ThemedText>
                            </View>
                        ) : (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
                        )
                    }
                />

                <TouchableOpacity
                    style={[G.fab, shadow.primaryLg]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-add" size={26} color={COLORS.onPrimary} />
                </TouchableOpacity>

                <CreateContactModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSuccess={() => fetchData(true)}
                />
            </SafeAreaView>
        </ThemedView>
    );
}