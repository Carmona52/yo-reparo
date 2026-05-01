import {useState, useEffect} from 'react';
import {View, ScrollView, TouchableOpacity, ActivityIndicator, Linking, useColorScheme} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {Worker} from '@/libs/types/worker';
import {getToolsByWorkerId} from "@/libs/workers/tools";
import {Tools} from "@/libs/types/tools";
import AddToolModal from "@/components/modals/owner/create-tool";
import EditWorkerModal from "@/components/modals/owner/edit-worker";
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

export default function WorkerDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, surfaceBg, borderColor} = useAppTheme();

    const [modalVisible, setModalVisible] = useState(false);
    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);
    const [tools, setTools] = useState<Tools[]>([]);
    const [loadingTools, setLoadingTools] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);

    const loadWorker = async () => {
        try {
            const cachedWorkers = await AsyncStorage.getItem('workers_list_cache');
            if (cachedWorkers) {
                const list = JSON.parse(cachedWorkers);
                const actualList = Array.isArray(list) ? list : (list.data || []);
                const found = actualList.find((w: Worker) => String(w.id) === String(id));
                setWorker(found || null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadWorkerTools = async () => {
        try {
            setLoadingTools(true);
            const data = await getToolsByWorkerId(String(id));
            setTools(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTools(false);
        }
    };

    const handleEditSuccess = (updatedWorker: Worker) => {
        setWorker(updatedWorker);
    };

    const refreshTools = () => {
        loadWorkerTools();
    };

    useEffect(() => {
        loadWorker();
        loadWorkerTools();
    }, [id]);

    if (loading) return (
        <ThemedView style={G.center}>
            <ActivityIndicator size="large" color={COLORS.primary}/>
        </ThemedView>
    );

    if (!worker) return (
        <ThemedView style={G.center}>
            <ThemedText>Trabajador no encontrado</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(owner)/workers')} style={[G.btnPrimary, {marginTop: 20}]}>
                <ThemedText style={G.btnText}>Regresar</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );

    function returnRolEsp(rol: string) {
        switch (rol) {
            case 'worker':
                return "Trabajador"
                break;
        }
    }

    return (
        <ThemedView style={G.flex1}>
            <View style={[G.topBar, {justifyContent: 'space-between', paddingTop: 60}]}>
                <TouchableOpacity style={G.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={textColor}/>
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={{color: textColor}}>Ficha del Personal</ThemedText>
                <View style={{width: 40}}/>
            </View>

            <ScrollView contentContainerStyle={G.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={G.profileHeader}>
                    <View style={[G.avatarPrimary, shadow.primaryLg]}>
                        <ThemedText style={G.avatarTextLg}>
                            {worker.name.charAt(0).toUpperCase()}
                        </ThemedText>
                    </View>
                    <ThemedText type="title" style={[G.profileName, {color: textColor}]}>
                        {worker.name}
                    </ThemedText>
                    <View style={G.roleBadge}>
                        <ThemedText style={G.roleBadgeText}>{returnRolEsp(worker.role)}</ThemedText>
                    </View>
                </View>

                <View style={G.quickActions}>
                    <TouchableOpacity
                        style={[G.actionBtnLg, {backgroundColor: COLORS.success}]}
                        onPress={() => Linking.openURL(`tel:${worker.phone}`)}>
                        <Ionicons name="call" size={24} color={COLORS.onPrimary}/>
                        <ThemedText style={G.actionBtnText}>Llamar</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[G.actionBtnLg, {backgroundColor: COLORS.whatsapp}]}
                        onPress={() => Linking.openURL(`whatsapp://send?phone=${worker.phone}`)}>
                        <Ionicons name="logo-whatsapp" size={24} color={COLORS.onPrimary}/>
                        <ThemedText style={G.actionBtnText}>WhatsApp</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={[G.cardSurface, {marginBottom: 20}]}>
                    <ThemedText style={G.cardLabel}>Información de Contacto</ThemedText>

                    <View style={G.infoRow}>
                        <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary}/>
                        <View style={G.infoTextGroup}>
                            <ThemedText style={G.infoLabel}>Teléfono</ThemedText>
                            <ThemedText style={[G.infoValue, {color: textColor}]}>
                                {worker.phone || 'No registrado'}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[G.infoRow, {borderBottomWidth: 0}]}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.primary}/>
                        <View style={G.infoTextGroup}>
                            <ThemedText style={G.infoLabel}>Correo Electrónico</ThemedText>
                            <ThemedText style={[G.infoValue, {color: textColor}]}>
                                {worker.email || 'Sin correo'}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={[G.cardSurface, {marginBottom: 20}]}>
                    <View style={[G.rowBetween, {marginBottom: 15}]}>
                        <ThemedText style={G.cardLabel}>Herramientas Prestadas</ThemedText>
                        <Ionicons name="hammer-outline" size={16} color={COLORS.primary}/>
                    </View>

                    {loadingTools ? (
                        <ActivityIndicator size="small" color={COLORS.primary}/>
                    ) : tools.length > 0 ? (
                        tools.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={G.toolItemRow}
                                onPress={() => router.push({
                                    pathname: "/(owner)/workers/herramientas/[id]",
                                    params: {id: item.id, workerId: worker.id}
                                })}
                            >
                                <View style={[G.toolDot, {backgroundColor: COLORS.primary}]}/>
                                <View style={G.flex1}>
                                    <ThemedText style={[G.toolName, {color: textColor}]}>{item.tool}</ThemedText>
                                    <ThemedText style={[G.toolDate, {color: mutedText}]}>
                                        Prestada el día: {new Date(item.created_at).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.mutedIcon}/>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <ThemedText style={[G.emptyText, {color: mutedText}]}>Sin herramientas a cargo</ThemedText>
                    )}
                </View>

                <TouchableOpacity
                    style={[G.btnOutlinePrimary, {marginBottom: 20, borderStyle: 'solid'}]}
                    onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={20} color={COLORS.primary}/>
                    <ThemedText style={{color: COLORS.primary, fontWeight: 'bold'}}>Prestar más
                        herramientas</ThemedText>
                </TouchableOpacity>

                <View style={[G.cardSurface, {marginBottom: 20}]}>
                    <ThemedText style={G.cardLabel}>Rendimiento y Status</ThemedText>
                    <View style={G.statsGrid}>
                        <View style={G.statBox}>
                            <ThemedText style={[G.statNumber, {color: COLORS.primary}]}>12</ThemedText>
                            <ThemedText style={G.statLabel}>Trabajos</ThemedText>
                        </View>
                        <View style={G.statBox}>
                            <ThemedText style={[G.statNumber, {color: COLORS.primary}]}>4.8</ThemedText>
                            <ThemedText style={G.statLabel}>Rating</ThemedText>
                        </View>
                        <View style={G.statBox}>
                            <ThemedText style={[G.statNumber, {color: COLORS.primary}]}>Activo</ThemedText>
                            <ThemedText style={G.statLabel}>Estado</ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <AddToolModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                workerId={String(id)}
                onSuccess={refreshTools}
            />
            {worker && (
                <EditWorkerModal
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    worker={worker}
                    onSuccess={handleEditSuccess}
                />
            )}
        </ThemedView>
    );
}