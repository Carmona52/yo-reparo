import {useState, useEffect, useCallback, useMemo} from 'react';
import {
    FlatList,
    RefreshControl,
    View,
    Linking,
    TouchableOpacity,
    TextInput,
    useColorScheme,
    ActivityIndicator
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getAllWorkers} from "@/libs/owner/workers/get-workers";
import {Worker} from '@/libs/types/worker';
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
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        borderColor: COLORS.border,
        avatarBg: isDark ? COLORS.primary : '#e1f5fe',
        avatarTextColor: isDark ? COLORS.onPrimary : COLORS.primary,
    };
};

export default function WorkersScreen() {
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, inputBg, borderColor, avatarBg, avatarTextColor} = useAppTheme();

    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async (force = false) => {
        try {
            const response = await getAllWorkers(force);
            setWorkers(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Error al cargar trabajadores:", error);
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
        fetchData(true);
    }, []);

    const filteredWorkers = useMemo(() => {
        return workers.filter(worker =>
            worker.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [workers, searchQuery]);

    const makeCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    function returnRolEsp(rol: string) {
        switch (rol) {
            case 'worker':
                return "Trabajador"
                break;
        }
    }

    const renderWorkerItem = ({item}: { item: Worker }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/workers/${item.id}` as any)} style={{marginBottom:15}}>
            <View style={[G.card, {backgroundColor: cardBg, borderColor: borderColor}, shadow.sm]}>
                <View style={G.row}>
                    <View style={[G.avatarMd, {
                        backgroundColor: avatarBg,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 15
                    }]}>
                        <ThemedText style={[G.avatarTextSm, {color: avatarTextColor, fontSize: 18}]}>
                            {item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </ThemedText>
                    </View>

                    <View style={G.flex1}>
                        <ThemedText type="defaultSemiBold" style={[G.infoValue, {color: textColor, marginBottom: 4}]}>
                            {item.name}
                        </ThemedText>
                        <View style={[G.badgeLg, {
                            backgroundColor: COLORS.primaryBgMedium,
                            alignSelf: 'flex-start',
                            paddingHorizontal: 10,
                            paddingVertical: 3
                        }]}>
                            <ThemedText style={[G.badgeText, {color: COLORS.primary}]}>
                                {returnRolEsp(item.role)}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[G.row, {alignItems: 'center'}]}>
                        {item.phone && (
                            <TouchableOpacity
                                style={[G.iconBadgeSm, {backgroundColor: COLORS.success, ...shadow.success}]}
                                onPress={() => makeCall(item.phone)}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="call" size={18} color={COLORS.onPrimary}/>
                            </TouchableOpacity>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={COLORS.mutedIcon} style={{marginLeft: 10}}/>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <View style={[G.pageHeader, {paddingTop: 10}]}>
                    <View style={[G.rowBetween, {marginBottom: 20}]}>
                        <TouchableOpacity onPress={() => router.push("/(owner)/perfil")} style={G.backBtnPlain}>
                            <Ionicons name="chevron-back" size={28} color={textColor}/>
                        </TouchableOpacity>
                        <ThemedText type="title"
                                    style={[G.pageTitle, {fontSize: 28, marginBottom: 0}]}>Equipo</ThemedText>
                        <View style={{width: 40}}/>
                    </View>

                    <View style={[G.searchContainer, {backgroundColor: inputBg, borderColor: borderColor}]}>
                        <Ionicons name="search" size={18} color={mutedText}/>
                        <TextInput
                            placeholder="Buscar por nombre..."
                            placeholderTextColor={mutedText}
                            style={[G.searchInput, {color: textColor}]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={mutedText}/>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <FlatList
                    data={filteredWorkers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderWorkerItem}
                    contentContainerStyle={[G.pageContent, {paddingBottom: 100}]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary}/>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={G.emptyContainer}>
                                <View style={G.emptyIconCircle}>
                                    <Ionicons name="people-outline" size={40} color={COLORS.primary}/>
                                </View>
                                <ThemedText style={[G.emptyText, {color: mutedText}]}>No hay personal registrado
                                    aún.</ThemedText>
                            </View>
                        ) : (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{marginTop: 20}}/>
                        )
                    }
                />

                <TouchableOpacity
                    style={[G.fab, shadow.primaryLg]}
                    activeOpacity={0.8}
                    onPress={() => router.push("/(owner)/workers/create-worker")}>
                    <Ionicons name="person-add" size={26} color={COLORS.onPrimary}/>
                </TouchableOpacity>
            </SafeAreaView>
        </ThemedView>
    );
}