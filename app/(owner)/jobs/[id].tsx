import React, {useState, useEffect} from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
    Image,
    Modal,
    useColorScheme,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from 'react-native-image-zoom-viewer';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {updateJob} from '@/libs/owner/jobs/update-jobs';
import {getAllWorkers} from '@/libs/owner/workers/get-workers';
import {Worker} from '@/libs/types/worker';
import {Job} from "@/libs/types/job";
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

export default function JobDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const {isDark, textColor, mutedText, cardBg, surfaceBg, borderColor} = useAppTheme();

    const [job, setJob] = useState<Job | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showWorkerList, setShowWorkerList] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!id) return;
            try {
                const [cachedJobs, workersData] = await Promise.all([
                    AsyncStorage.getItem('jobs_data_cache'),
                    getAllWorkers()
                ]);

                if (cachedJobs) {
                    const list = JSON.parse(cachedJobs);
                    const actualList = Array.isArray(list) ? list : (list.data || []);
                    setJob(actualList.find((j: Job) => String(j.id) === String(id)) || null);
                }
                setWorkers(Array.isArray(workersData) ? workersData : (workersData.data || []));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [id]);

    const handleUpdate = async (updates: { status?: string, worker_id?: string }) => {
        setUpdating(true);
        try {
            const workerName = workers.find((worker) => worker.id === updates.worker_id);
            console.log(workerName);
            await updateJob(String(id), updates);
            if (job) setJob({...job, ...updates});
            if (updates.worker_id) setShowWorkerList(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return {day: 'Pendiente', time: '--:--'};
        const date = new Date(dateStr);
        return {
            day: date.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'}),
            time: date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
        };
    };

    const dateInfo = formatDate(job?.fecha_cita);
    const assignedWorker = workers.find(w => w.id === job?.worker_id);

    const getStatusColor = (status: string) => {
        const colors = {'finalizado': COLORS.success, 'en proceso': '#3b82f6', 'pendiente': '#f59e0b'};
        return colors[status.toLowerCase() as keyof typeof colors] || mutedText;
    };

    if (loading) return <ThemedView style={G.center}><ActivityIndicator size="large"
                                                                        color={COLORS.primary}/></ThemedView>;
    if (!job) return <ThemedView style={G.center}><ThemedText>No disponible</ThemedText></ThemedView>;

    return (
        <ThemedView style={G.flex1}>

            <View style={[G.topBarSafeArea, {
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: borderColor
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={G.backBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={28} color={textColor}/>
                </TouchableOpacity>
                <View style={{flex: 1, marginHorizontal: 12}}>
                    <ThemedText type="subtitle" numberOfLines={1}>Detalle del Trabajo</ThemedText>
                </View>
                <View style={[G.badge, {backgroundColor: getStatusColor(job.status)}]}>
                    <ThemedText style={[G.badgeTextWhite, {fontSize: 12}]}>{job.status}</ThemedText>
                </View>
            </View>

            <ScrollView contentContainerStyle={[G.scrollContent, {paddingTop: 0}]} showsVerticalScrollIndicator={false}>
                <View style={{marginBottom: 25}}>
                    <ThemedText type="title" style={[G.pageTitle, {marginBottom: 20, color: textColor}]}>
                        {job.title}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={() => job.image_url && setImageViewerVisible(true)}
                        disabled={!job.image_url}
                        activeOpacity={0.8}>
                        <View style={[G.imageContainerLg, {height: 250, borderRadius: 28, ...shadow.md}]}>
                            {job.image_url ? (
                                <Image source={{uri: job.image_url}} style={G.imageFull}/>
                            ) : (
                                <View style={[G.center, {gap: 10}]}>
                                    <Ionicons name="image-outline" size={48} color={COLORS.mutedIcon}/>
                                    <ThemedText style={{color: COLORS.mutedIcon}}>Sin evidencia fotográfica</ThemedText>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={G.infoGrid}>
                    <View style={[G.infoGridCard, {backgroundColor: surfaceBg, borderColor: borderColor}]}>
                        <Ionicons name="calendar" size={22} color={COLORS.primary}/>
                        <ThemedText style={G.infoGridLabel}>Fecha</ThemedText>
                        <ThemedText type="defaultSemiBold" style={G.infoGridValue}>{dateInfo.day}</ThemedText>
                    </View>
                    <View style={[G.infoGridCard, {flex: 0.4, backgroundColor: surfaceBg, borderColor: borderColor}]}>
                        <Ionicons name="time" size={22} color={COLORS.primary}/>
                        <ThemedText style={G.infoGridLabel}>Hora</ThemedText>
                        <ThemedText type="defaultSemiBold" style={G.infoGridValue}>{dateInfo.time}</ThemedText>
                    </View>
                </View>

                <TouchableOpacity
                    style={[G.locationCard, {marginBottom: 25}]}
                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`)}>
                    <View style={[G.iconCirclePrimary, {backgroundColor: COLORS.primary}]}>
                        <Ionicons name="location" size={22} color={COLORS.onPrimary}/>
                    </View>
                    <View style={{flex: 1, marginLeft: 15}}>
                        <ThemedText type="defaultSemiBold"
                                    style={{fontSize: 16, color: textColor}}>Dirección</ThemedText>
                        <ThemedText style={[G.infoValueSm, {color: mutedText, marginTop: 4}]}>{job.address}</ThemedText>
                    </View>
                    <Ionicons name="navigate-circle" size={32} color={COLORS.success}/>
                </TouchableOpacity>

                <View style={{marginBottom: 25}}>
                    <ThemedText style={G.sectionLabel}>Responsable</ThemedText>
                    <TouchableOpacity
                        style={[G.cardSurface, {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12
                        }]}
                        onPress={() => setShowWorkerList(!showWorkerList)}>
                        <View style={[G.row, {alignItems: 'center'}]}>
                            <View style={[G.avatarSm, {
                                backgroundColor: assignedWorker ? COLORS.primary : COLORS.surfaceStrong,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 15
                            }]}>
                                <ThemedText
                                    style={[G.avatarTextSm, {color: assignedWorker ? COLORS.onPrimary : mutedText}]}>
                                    {assignedWorker?.name[0] || '?'}
                                </ThemedText>
                            </View>
                            <View>
                                <ThemedText type="defaultSemiBold" style={{fontSize: 16, color: textColor}}>
                                    {assignedWorker ? assignedWorker.name : "Pendiente de asignar"}
                                </ThemedText>
                                <ThemedText style={{fontSize: 12, color: mutedText}}>Toca para cambiar</ThemedText>
                            </View>
                        </View>
                        <Ionicons name={showWorkerList ? "chevron-up" : "chevron-down"} size={20}
                                  color={COLORS.primary}/>
                    </TouchableOpacity>

                    {showWorkerList && (
                        <View style={[G.dropdownBox, {
                            marginTop: 10,
                            padding: 10,
                            backgroundColor: surfaceBg,
                            borderColor: borderColor
                        }]}>
                            {workers.map(w => (
                                <TouchableOpacity key={w.id} style={G.dropdownOption}
                                                  onPress={() => handleUpdate({worker_id: w.id})}>
                                    <ThemedText style={[G.dropdownOptionActive, job.worker_id === w.id && {
                                        color: COLORS.primary,
                                        fontWeight: 'bold'
                                    }]}>
                                        {w.name}
                                    </ThemedText>
                                    {job.worker_id === w.id &&
                                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary}/>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{marginBottom: 30}}>
                    <ThemedText type="defaultSemiBold" style={[G.sectionTitle, {fontSize: 18, color: textColor}]}>Detalles
                        del Servicio</ThemedText>
                    <ThemedText style={[G.infoValue, {fontSize: 15, lineHeight: 22, opacity: 0.8, color: mutedText}]}>
                        {job.description || "El cliente no proporcionó una descripción adicional."}
                    </ThemedText>
                </View>

                <View style={{marginTop: 10}}>
                    <ThemedText style={G.sectionLabel}>Actualizar Estado</ThemedText>
                    <View style={[G.row, {gap: 8}]}>
                        {['pendiente', 'en proceso', 'finalizado'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    G.btnOutlinePrimary,
                                    {
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 18,
                                        borderStyle: 'solid',
                                        borderColor: borderColor
                                    },
                                    job.status.toLowerCase() === s && {
                                        backgroundColor: getStatusColor(s),
                                        borderColor: getStatusColor(s)
                                    }
                                ]}
                                onPress={() => handleUpdate({status: s})}
                            >
                                <ThemedText
                                    style={[
                                        {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: mutedText},
                                        job.status.toLowerCase() === s && {color: COLORS.onPrimary}
                                    ]}>
                                    {s}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{height: 50}}/>
            </ScrollView>

            <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
                <ImageViewer
                    imageUrls={[{url: job?.image_url || ''}]}
                    enableSwipeDown={true}
                    onSwipeDown={() => setImageViewerVisible(false)}
                    onCancel={() => setImageViewerVisible(false)}
                    renderHeader={() => (
                        <TouchableOpacity
                            style={[G.closeModalBtn, {
                                top: 50,
                                right: 20,
                                padding: 10,
                                borderRadius: 20,
                                backgroundColor: 'rgba(0,0,0,0.5)'
                            }]}
                            onPress={() => setImageViewerVisible(false)}>
                            <Ionicons name="close" size={30} color="#fff"/>
                        </TouchableOpacity>
                    )}
                    backgroundColor="rgba(0,0,0,0.9)"
                />
            </Modal>


            {updating &&
                <View style={G.loaderOverlay}><ActivityIndicator size="large" color={COLORS.onPrimary}/></View>}
        </ThemedView>
    );
}