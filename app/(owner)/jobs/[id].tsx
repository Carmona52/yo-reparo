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
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageViewer from 'react-native-image-zoom-viewer';

import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {updateJob} from '@/libs/owner/jobs/update-jobs';
import {getAllWorkers} from '@/libs/owner/workers/get-workers';
import {Worker} from '@/libs/types/worker';
import {Job} from "@/libs/types/job";

export default function JobDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();

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
        const colors = {'finalizado': '#10b981', 'en proceso': '#3b82f6', 'pendiente': '#f59e0b'};
        return colors[status.toLowerCase() as keyof typeof colors] || '#666';
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator size="large" color="#0a7ea4"/></ThemedView>;
    if (!job) return <ThemedView style={styles.center}><ThemedText>No disponible</ThemedText></ThemedView>;

    return (
        <ThemedView style={{flex: 1}}>
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
                        activeOpacity={0.8}>
                        <View style={styles.mainImageWrapper}>
                            {job.image_url ? (
                                <Image source={{uri: job.image_url}} style={styles.jobImage}/>
                            ) : (
                                <View style={styles.noImagePlaceholder}>
                                    <Ionicons name="image-outline" size={48} color="#ccc"/>
                                    <ThemedText style={{color: '#aaa'}}>Sin evidencia fotográfica</ThemedText>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <Ionicons name="calendar" size={22} color="#0a7ea4"/>
                        <ThemedText style={styles.infoCardLabel}>Fecha</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.infoCardValue}>{dateInfo.day}</ThemedText>
                    </View>
                    <View style={[styles.infoCard, {flex: 0.4}]}>
                        <Ionicons name="time" size={22} color="#0a7ea4"/>
                        <ThemedText style={styles.infoCardLabel}>Hora</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.infoCardValue}>{dateInfo.time}</ThemedText>
                    </View>
                </View>

                <TouchableOpacity style={styles.locationCard}
                                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`)}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="location" size={22} color="#fff"/>
                    </View>
                    <View style={{flex: 1, marginLeft: 15}}>
                        <ThemedText type="defaultSemiBold" style={{fontSize: 16}}>Dirección</ThemedText>
                        <ThemedText style={styles.subText}>{job.address}</ThemedText>
                    </View>
                    <Ionicons name="navigate-circle" size={32} color="#10b981"/>
                </TouchableOpacity>

                <View style={styles.assignmentSection}>
                    <ThemedText style={styles.label}>Responsable</ThemedText>
                    <TouchableOpacity style={styles.workerSelector} onPress={() => setShowWorkerList(!showWorkerList)}>
                        <View style={styles.workerInfoRow}>
                            <View style={[styles.avatar, {backgroundColor: assignedWorker ? '#0a7ea4' : '#eee'}]}>
                                <ThemedText style={styles.avatarLetter}>{assignedWorker?.name[0] || '?'}</ThemedText>
                            </View>
                            <View>
                                <ThemedText type="defaultSemiBold" style={{fontSize: 16}}>
                                    {assignedWorker ? assignedWorker.name : "Pendiente de asignar"}
                                </ThemedText>
                                <ThemedText style={{fontSize: 12, opacity: 0.5}}>Toca para cambiar</ThemedText>
                            </View>
                        </View>
                        <Ionicons name={showWorkerList ? "chevron-up" : "chevron-down"} size={20} color="#0a7ea4"/>
                    </TouchableOpacity>

                    {showWorkerList && (
                        <View style={styles.dropdown}>
                            {workers.map(w => (
                                <TouchableOpacity key={w.id} style={styles.workerOption}
                                                  onPress={() => handleUpdate({worker_id: w.id})}>
                                    <ThemedText
                                        style={[styles.workerOptionText, job.worker_id === w.id && styles.activeText]}>{w.name}</ThemedText>
                                    {job.worker_id === w.id &&
                                        <Ionicons name="checkmark-circle" size={20} color="#0a7ea4"/>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.descSection}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Detalles del Servicio</ThemedText>
                    <ThemedText
                        style={styles.descriptionText}>{job.description || "El cliente no proporcionó una descripción adicional."}</ThemedText>
                </View>

                <View style={styles.statusSection}>
                    <ThemedText style={styles.label}>Actualizar Estado</ThemedText>
                    <View style={styles.statusGrid}>
                        {['pendiente', 'en proceso', 'finalizado'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.statusBtn, job.status.toLowerCase() === s && {backgroundColor: getStatusColor(s)}]}
                                onPress={() => handleUpdate({status: s})}
                            >
                                <ThemedText
                                    style={[styles.btnText, job.status.toLowerCase() === s && {color: '#fff'}]}>{s}</ThemedText>
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
                            style={styles.closeButton}
                            onPress={() => setImageViewerVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="#fff"/>
                        </TouchableOpacity>
                    )}
                    backgroundColor="rgba(0,0,0,0.9)"
                />
            </Modal>

            {updating && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#fff"/></View>}
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 15,
        backgroundColor: 'transparent',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(150,150,150,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    badge: {paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12},
    badgeText: {color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase'},
    scroll: {padding: 20},

    headerSection: {marginBottom: 25},
    title: {fontSize: 28, fontWeight: '800', marginBottom: 20, color: '#1a1a1a'},

    mainImageWrapper: {
        width: '100%',
        height: 250,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    jobImage: {width: '100%', height: '100%', resizeMode: 'cover'},
    noImagePlaceholder: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10},

    infoGrid: {flexDirection: 'row', gap: 12, marginBottom: 20},
    infoCard: {
        flex: 1,
        backgroundColor: 'rgba(10, 126, 164, 0.05)',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(10, 126, 164, 0.1)',
    },
    infoCardLabel: {fontSize: 11, opacity: 0.5, textTransform: 'uppercase', marginTop: 5},
    infoCardValue: {fontSize: 14, marginTop: 2, textTransform: 'capitalize'},

    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 24,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center'
    },
    subText: {fontSize: 14, opacity: 0.6, marginTop: 4},

    assignmentSection: {marginBottom: 25},
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.4,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 5
    },
    workerSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(150,150,150,0.05)',
        padding: 12,
        borderRadius: 20,
    },
    avatar: {width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15},
    avatarLetter: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
    workerInfoRow: {flexDirection: 'row', alignItems: 'center'},

    dropdown: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    workerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9'
    },
    workerOptionText: {fontSize: 15},
    activeText: {color: '#0a7ea4', fontWeight: 'bold'},

    descSection: {marginBottom: 30},
    sectionTitle: {fontSize: 18, marginBottom: 10},
    descriptionText: {fontSize: 15, lineHeight: 22, color: '#555'},

    statusSection: {marginTop: 10},
    statusGrid: {flexDirection: 'row', gap: 8},
    statusBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        alignItems: 'center'
    },
    btnText: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase'},

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 10,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
});