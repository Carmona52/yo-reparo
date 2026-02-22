import { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import {getAllWorkers} from "@/libs/owner/workers/get-workers";
import {Worker} from '@/libs/types/worker'
export default function WorkersScreen() {
    const [contacts, setContacts] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const response = await getAllWorkers();
            setContacts(Array.isArray(response) ? response : response.data || []);
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const makeCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const renderContactItem = ({ item }: { item: Worker }) => (
        <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>
                        {item.name.charAt(0)}{item.name.charAt(0)}
                    </ThemedText>
                </View>
                <View style={styles.infoContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.nameText}>
                        {item.name}
                    </ThemedText>
                    <ThemedText style={styles.addressText} numberOfLines={1}>
                        {item.role}, {item.phone}
                    </ThemedText>
                </View>

                {item.phone && (
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => makeCall(item.phone)}
                    >
                        <Ionicons name="call" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </ThemedView>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.headerTitle}>Trabajadores Registrados</ThemedText>

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderContactItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0a7ea4"
                        />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <ThemedText style={styles.emptyText}>No tienes contactos registrados.</ThemedText>
                        ) : null
                    }
                />
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerTitle: {
        marginVertical: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: 16,
    },
    addressText: {
        fontSize: 13,
        opacity: 0.6,
        marginTop: 2,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
    }
});