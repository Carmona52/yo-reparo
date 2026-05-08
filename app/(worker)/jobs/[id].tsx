import {useState, useEffect} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from 'react-native-image-zoom-viewer';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {updateJob} from '@/libs/owner/jobs/update-jobs';
import {Job} from "@/libs/types/job";
import {supabase} from "@/libs/supabase";
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
    const {textColor, mutedText, surfaceBg} = useAppTheme();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!id) return;
            try {
                const cachedJobs = await AsyncStorage.getItem('worker_jobs_cache');
                if (cachedJobs) {
                    const list = JSON.parse(cachedJobs);
                    const actualList = Array.isArray(list) ? list : (list.data || []);
                    const foundJob = actualList.find((j: Job) => String(j.id) === String(id));
                    setJob(foundJob || null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [id]);

    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await updateJob(String(id), {status: newStatus});
            if (job) setJob({...job, status: newStatus});

            const {data: profile} = await supabase
                .from('profiles')
                .select('name')
                .eq('id', job?.worker_id)
                .single();

            const workerName = profile?.name ?? 'El trabajador';
            const isStarting = newStatus.toLowerCase() === 'en proceso';

            const {error: notifError} = await supabase.functions.invoke('send-to-admins', {
                body: {
                    role: 'owner',
                    title: isStarting ? '🛠️ Trabajo iniciado' : '✅ Trabajo finalizado',
                    body: isStarting
                        ? `${workerName} ha comenzado: ${job?.title}`
                        : `${workerName} ha completado: ${job?.title}`,
                    data: {screen: `jobs/${job?.id}`},
                },
            });

            if (notifError) console.error('Error enviando notificación:', notifError);

            Alert.alert(
                "¡Éxito!",
                isStarting
                    ? "El trabajo ha sido marcado como iniciado."
                    : "El trabajo ha sido marcado como finalizado."
            );
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "No se pudo actualizar el estado.";
            Alert.alert("Error", msg);
        } finally {
            setUpdating(false);
        }
    };

    const confirmAction = () => {
        if (!job) return;
        const isPending = job.status.toLowerCase() === 'pendiente';
        if (isPending) {
            Alert.alert(
                "Iniciar Servicio",
                "¿Confirmas que vas a empezar este trabajo ahora?",
                [
                    {text: "Cancelar", style: "cancel"},
                    {text: "Empezar", onPress: () => handleUpdateStatus('en proceso')}
                ]
            );
        } else {
            Alert.alert(
                "Finalizar Servicio",
                "¿Has completado todas las tareas? Esta acción cerrará el reporte.",
                [
                    {text: "Aún no", style: "cancel"},
                    {text: "Sí, finalizar", style: "default", onPress: () => handleUpdateStatus('finalizado')}
                ]
            );
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {'finalizado': COLORS.success, 'en proceso': COLORS.primary, 'pendiente': '#f59e0b'};
        return colors[status.toLowerCase() as keyof typeof colors] || mutedText;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return {day: 'No asignada', time: '--:--'};
        const date = new Date(dateStr);
        return {
            day: date.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'}),
            time: date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
        };
    };

    if (loading) return <ThemedView style={G.center}><ActivityIndicator size="large"
                                                                        color={COLORS.primary}/></ThemedView>;
    if (!job) return <ThemedView style={G.center}><ThemedText>Servicio no encontrado</ThemedText></ThemedView>;

    const isFinished = job.status.toLowerCase() === 'finalizado';
    const isInProgress = job.status.toLowerCase() === 'en proceso';
    const dateInfo = formatDate(job.fecha_cita);

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                {/* Top bar con botón de regreso y badge */}
                <View style={[G.topBar, {justifyContent: 'space-between'}]}>
                    <TouchableOpacity style={G.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={textColor}/>
                    </TouchableOpacity>
                    <View style={[G.badge, {backgroundColor: getStatusColor(job.status)}]}>
                        <ThemedText style={G.badgeTextWhite}>{job.status}</ThemedText>
                    </View>
                </View>

                <ScrollView contentContainerStyle={G.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Título e imagen */}
                    <View style={{marginBottom: 25}}>
                        <ThemedText type="title" style={[G.pageTitle, {marginBottom: 15, color: textColor}]}>
                            {job.title}
                        </ThemedText>
                        <TouchableOpacity
                            style={[G.imageContainerLg, {height: 220, borderRadius: 24, ...shadow.md}]}
                            onPress={() => job.image_url && setImageViewerVisible(true)}
                            disabled={!job.image_url}
                            activeOpacity={0.9}>
                            {job.image_url ? (
                                <Image source={{uri: job.image_url}} style={G.imageFull}/>
                            ) : (
                                <View style={[G.center, {gap: 8}]}>
                                    <Ionicons name="image-outline" size={48} color={COLORS.mutedIcon}/>
                                    <ThemedText style={{color: COLORS.mutedIcon}}>Sin fotos adjuntas</ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Grid de fecha/hora */}
                    <View style={G.infoGrid}>
                        <View style={[G.infoGridCard, {backgroundColor: surfaceBg}]}>
                            <Ionicons name="calendar" size={20} color={COLORS.primary}/>
                            <ThemedText style={G.infoGridLabel}>Fecha de Cita</ThemedText>
                            <ThemedText type="defaultSemiBold" style={G.infoGridValue}>{dateInfo.day}</ThemedText>
                        </View>
                        <View style={[G.infoGridCard, {flex: 0.4, backgroundColor: surfaceBg}]}>
                            <Ionicons name="time" size={20} color={COLORS.primary}/>
                            <ThemedText style={G.infoGridLabel}>Hora</ThemedText>
                            <ThemedText type="defaultSemiBold" style={G.infoGridValue}>{dateInfo.time}</ThemedText>
                        </View>
                    </View>

                    {/* Tarjeta de ubicación */}
                    <TouchableOpacity
                        style={[G.locationCard, {marginBottom: 20}]}
                        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`)}>
                        <View style={G.iconCirclePrimary}>
                            <Ionicons name="location" size={20} color={COLORS.onPrimary}/>
                        </View>
                        <View style={{flex: 1, marginLeft: 15}}>
                            <ThemedText type="defaultSemiBold" style={{fontSize: 15, color: textColor}}>
                                Ubicación del cliente
                            </ThemedText>
                            <ThemedText
                                style={[G.infoValueSm, {color: mutedText, marginTop: 2}]}>{job.address}</ThemedText>
                        </View>
                        <Ionicons name="map-outline" size={24} color={COLORS.primary}/>
                    </TouchableOpacity>

                    {/* Descripción */}
                    <View style={{marginBottom: 30}}>
                        <ThemedText type="defaultSemiBold"
                                    style={[G.sectionTitle, {marginBottom: 8, opacity: 0.7, color: textColor}]}>
                            Descripción del problema
                        </ThemedText>
                        <ThemedText style={[G.infoValue, {lineHeight: 22, opacity: 0.8, color: mutedText}]}>
                            {job.description || "No hay descripción detallada para este servicio."}
                        </ThemedText>
                    </View>

                    {/* Botón dinámico o estado completado */}
                    {!isFinished ? (
                        <TouchableOpacity
                            style={[
                                G.btnPrimary,
                                isInProgress && {backgroundColor: COLORS.success},
                                {flexDirection: 'row', gap: 12, ...shadow.primaryLg}
                            ]}
                            onPress={confirmAction}
                            disabled={updating}>
                            {updating ? (
                                <ActivityIndicator color={COLORS.onPrimary}/>
                            ) : (
                                <>
                                    <Ionicons name={isInProgress ? "checkmark-circle" : "play-circle"} size={24}
                                              color={COLORS.onPrimary}/>
                                    <ThemedText style={[G.btnText, {letterSpacing: 1}]}>
                                        {isInProgress ? "FINALIZAR TRABAJO" : "EMPEZAR TRABAJO"}
                                    </ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={G.completedBox}>
                            <Ionicons name="ribbon" size={24} color={COLORS.success}/>
                            <ThemedText style={G.completedText}>Este servicio ha sido finalizado con éxito</ThemedText>
                        </View>
                    )}

                    <View style={{height: 40}}/>
                </ScrollView>
            </SafeAreaView>

            {/* Modal de visor de imagen */}
            <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
                <ImageViewer
                    imageUrls={[{url: job?.image_url || ''}]}
                    enableSwipeDown={true}
                    onSwipeDown={() => setImageViewerVisible(false)}
                    backgroundColor="black"
                />
                <TouchableOpacity style={G.closeModalBtn} onPress={() => setImageViewerVisible(false)}>
                    <Ionicons name="close" size={30} color="#fff"/>
                </TouchableOpacity>
            </Modal>
        </ThemedView>
    );
}