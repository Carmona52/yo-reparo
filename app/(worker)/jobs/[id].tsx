import {useState, useEffect} from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
    Image,
    Platform,
    Modal
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

export default function JobDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();

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
                    title: isStarting
                        ? '🛠️ Trabajo iniciado'
                        : '✅ Trabajo finalizado',
                    body: isStarting
                        ? `${workerName} ha comenzado: ${job?.title}`
                        : `${workerName} ha completado: ${job?.title}`,
                    data: {
                        screen: `jobs/${job?.id}`,
                    },
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
        const colors = {'finalizado': '#10b981', 'en proceso': '#0a7ea4', 'pendiente': '#f59e0b'};
        return colors[status.toLowerCase() as keyof typeof colors] || '#666';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return {day: 'No asignada', time: '--:--'};
        const date = new Date(dateStr);
        return {
            day: date.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'}),
            time: date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})
        };
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator size="large"
                                                                             color="#0a7ea4"/></ThemedView>;
    if (!job) return <ThemedView style={styles.center}><ThemedText>Servicio no encontrado</ThemedText></ThemedView>;

    const isFinished = job.status.toLowerCase() === 'finalizado';
    const isInProgress = job.status.toLowerCase() === 'en proceso';
    const dateInfo = formatDate(job.fecha_cita);

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#333"/>
                    </TouchableOpacity>
                    <View style={[styles.badge, {backgroundColor: getStatusColor(job.status)}]}>
                        <ThemedText style={styles.badgeText}>{job.status}</ThemedText>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerSection}>
                        <ThemedText type="title" style={styles.title}>{job.title}</ThemedText>
                        <TouchableOpacity
                            style={styles.mainImageWrapper}
                            onPress={() => job.image_url && setImageViewerVisible(true)}
                            disabled={!job.image_url}
                            activeOpacity={0.9}>
                            {job.image_url ? (
                                <Image source={{uri: job.image_url}} style={styles.jobImage}/>
                            ) : (
                                <View style={styles.noImagePlaceholder}>
                                    <Ionicons name="image-outline" size={48} color="#ccc"/>
                                    <ThemedText style={{color: '#aaa'}}>Sin fotos adjuntas</ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <Ionicons name="calendar" size={20} color="#0a7ea4"/>
                            <ThemedText style={styles.infoCardLabel}>Fecha de Cita</ThemedText>
                            <ThemedText type="defaultSemiBold" style={styles.infoCardValue}>{dateInfo.day}</ThemedText>
                        </View>
                        <View style={[styles.infoCard, {flex: 0.4}]}>
                            <Ionicons name="time" size={20} color="#0a7ea4"/>
                            <ThemedText style={styles.infoCardLabel}>Hora</ThemedText>
                            <ThemedText type="defaultSemiBold" style={styles.infoCardValue}>{dateInfo.time}</ThemedText>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.locationCard}
                        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`)}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="location" size={20} color="#fff"/>
                        </View>
                        <View style={{flex: 1, marginLeft: 15}}>
                            <ThemedText type="defaultSemiBold" style={{fontSize: 15}}>Ubicación del cliente</ThemedText>
                            <ThemedText style={styles.subText}>{job.address}</ThemedText>
                        </View>
                        <Ionicons name="map-outline" size={24} color="#0a7ea4"/>
                    </TouchableOpacity>

                    <View style={styles.descSection}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Descripción del
                            problema</ThemedText>
                        <ThemedText style={styles.descriptionText}>
                            {job.description || "No hay descripción detallada para este servicio."}
                        </ThemedText>
                    </View>

                    {/* SECCIÓN DE BOTÓN DINÁMICO */}
                    {!isFinished ? (
                        <TouchableOpacity
                            style={[styles.mainActionButton, isInProgress ? styles.btnFinish : styles.btnStart]}
                            onPress={confirmAction}
                            disabled={updating}>
                            {updating ? (
                                <ActivityIndicator color="#fff"/>
                            ) : (
                                <>
                                    <Ionicons name={isInProgress ? "checkmark-circle" : "play-circle"} size={24}
                                              color="#fff"/>
                                    <ThemedText style={styles.mainActionText}>
                                        {isInProgress ? "FINALIZAR TRABAJO" : "EMPEZAR TRABAJO"}
                                    </ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.completedBox}>
                            <Ionicons name="ribbon" size={24} color="#10b981"/>
                            <ThemedText style={styles.completedText}>Este servicio ha sido finalizado con
                                éxito</ThemedText>
                        </View>
                    )}

                    <View style={{height: 40}}/>
                </ScrollView>
            </SafeAreaView>

            <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
                <ImageViewer
                    imageUrls={[{url: job?.image_url || ''}]}
                    enableSwipeDown={true}
                    onSwipeDown={() => setImageViewerVisible(false)}
                    backgroundColor="black"
                />
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setImageViewerVisible(false)}>
                    <Ionicons name="close" size={30} color="#fff"/>
                </TouchableOpacity>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(150,150,150,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    badge: {paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8},
    badgeText: {color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase'},
    scroll: {padding: 20},

    headerSection: {marginBottom: 25},
    title: {fontSize: 26, fontWeight: '800', marginBottom: 15},

    mainImageWrapper: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(150,150,150,0.1)',
    },
    jobImage: {width: '100%', height: '100%', resizeMode: 'cover'},
    noImagePlaceholder: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8},

    infoGrid: {flexDirection: 'row', gap: 12, marginBottom: 15},
    infoCard: {
        flex: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        padding: 14,
        borderRadius: 18,
    },
    infoCardLabel: {fontSize: 10, opacity: 0.4, textTransform: 'uppercase', marginTop: 4, fontWeight: 'bold'},
    infoCardValue: {fontSize: 13, marginTop: 2, textTransform: 'capitalize'},

    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(10, 126, 164, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(10, 126, 164, 0.1)',
        marginBottom: 20
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center'
    },
    subText: {fontSize: 13, opacity: 0.6, marginTop: 2},

    descSection: {marginBottom: 30},
    sectionTitle: {fontSize: 16, marginBottom: 8, opacity: 0.7},
    descriptionText: {fontSize: 15, lineHeight: 22, opacity: 0.8},

    mainActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        gap: 12,
        shadowColor: "#0a7ea4",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    btnStart: {backgroundColor: '#0a7ea4'},
    btnFinish: {backgroundColor: '#10b981', shadowColor: '#10b981'},
    mainActionText: {color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1},

    completedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 20,
        borderRadius: 20,
        gap: 12
    },
    completedText: {color: '#10b981', fontWeight: 'bold', fontSize: 14, textAlign: 'center'},

    closeModalBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25
    }
});