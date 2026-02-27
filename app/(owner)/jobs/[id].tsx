import {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Image} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    const assignedWorker = workers.find(w => w.id === job?.worker_id);
    const getStatusColor = (status: string) => {
        const colors = {'finalizado': '#10b981', 'en proceso': '#3b82f6', 'pendiente': '#f59e0b'};
        return colors[status as keyof typeof colors] || '#666';
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator size="large"
                                                                             color="#0a7ea4"/></ThemedView>;
    if (!job) return <ThemedView style={styles.center}><ThemedText>No disponible</ThemedText></ThemedView>;

    return (
        <ThemedView style={{flex: 1}}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28}
                                                                          color="#888"/></TouchableOpacity>
                <View style={[styles.badge, {backgroundColor: getStatusColor(job.status)}]}>
                    <ThemedText style={styles.badgeText}>{job.status}</ThemedText>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <ThemedText type="title" style={styles.title}>{job.title}</ThemedText>

                    {/* VISUALIZACIÓN DE IMAGEN (Si existe en la DB) */}
                    {job.image_url && (
                        <View style={styles.imageContainer}>
                            <Image source={{uri: job.image_url}} style={styles.jobImage}/>
                        </View>
                    )}

                    <View style={styles.assignmentBox}>
                        <ThemedText style={styles.label}>Trabajador asignado:</ThemedText>
                        <TouchableOpacity style={styles.dropdownTrigger}
                                          onPress={() => setShowWorkerList(!showWorkerList)}>
                            <View style={styles.workerInfoRow}>
                                <View
                                    style={[styles.miniAvatar, {backgroundColor: assignedWorker ? '#0a7ea4' : '#eee'}]}>
                                    <ThemedText
                                        style={styles.avatarLetter}>{assignedWorker?.name[0] || '?'}</ThemedText>
                                </View>
                                <ThemedText type="defaultSemiBold" style={styles.workerNameText}>
                                    {assignedWorker ? assignedWorker.name : "Sin asignar todavía"}
                                </ThemedText>
                            </View>
                            <Ionicons name={showWorkerList ? "chevron-up" : "chevron-down"} size={20} color="#0a7ea4"/>
                        </TouchableOpacity>

                        {showWorkerList && (
                            <View style={styles.dropdownContent}>
                                {workers.map(w => (
                                    <TouchableOpacity key={w.id} style={styles.workerOption}
                                                      onPress={() => handleUpdate({worker_id: w.id})}>
                                        <ThemedText style={job.worker_id === w.id && {
                                            color: '#0a7ea4',
                                            fontWeight: 'bold'
                                        }}>{w.name}</ThemedText>
                                        {job.worker_id === w.id &&
                                            <Ionicons name="checkmark" size={18} color="#0a7ea4"/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* DESCRIPCIÓN */}
                <View style={styles.card}>
                    <ThemedText type="defaultSemiBold" style={styles.cardLabel}>Descripción del Servicio</ThemedText>
                    <ThemedText
                        style={styles.descriptionText}>{job.description || "Sin descripción detallada."}</ThemedText>
                </View>

                {/* LOGÍSTICA */}
                <View style={styles.card}>
                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={20} color="#0a7ea4"/>
                        <View style={{flex: 1, marginLeft: 12}}>
                            <ThemedText type="defaultSemiBold">Ubicación</ThemedText>
                            <ThemedText style={styles.subText}>{job.address}</ThemedText>
                        </View>
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`)}>
                            <Ionicons name="map-outline" size={24} color="#10b981"/>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ACCIONES DE ESTADO */}
                <ThemedText style={[styles.label, {marginLeft: 5}]}>Actualizar progreso</ThemedText>
                <View style={styles.statusGrid}>
                    {['pendiente', 'en proceso', 'finalizado'].map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.statusBtn, job.status === s && {backgroundColor: getStatusColor(s)}]}
                            onPress={() => handleUpdate({status: s})}
                        >
                            <ThemedText style={[styles.btnText, job.status === s && {color: '#fff'}]}>{s}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {updating && <View style={styles.loadingOverlay}><ActivityIndicator color="#fff"/></View>}
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
        paddingTop: 60
    },
    badge: {paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20},
    badgeText: {color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase'},
    scroll: {padding: 20},
    headerSection: {marginBottom: 30},
    title: {fontSize: 32, marginBottom: 20},

    // ESTILOS DE IMAGEN (SOLO DISPLAY)
    imageContainer: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        marginBottom: 25,
        overflow: 'hidden',
        backgroundColor: 'rgba(150,150,150,0.1)'
    },
    jobImage: {width: '100%', height: '100%', resizeMode: 'cover'},

    label: {fontSize: 13, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1},
    assignmentBox: {
        backgroundColor: 'rgba(10, 126, 164, 0.05)',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(10, 126, 164, 0.1)'
    },
    dropdownTrigger: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    workerInfoRow: {flexDirection: 'row', alignItems: 'center'},
    miniAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarLetter: {color: '#fff', fontWeight: 'bold'},
    workerNameText: {fontSize: 16},
    dropdownContent: {marginTop: 15, borderTopWidth: 1, borderColor: 'rgba(10, 126, 164, 0.1)', paddingTop: 10},
    workerOption: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12},
    card: {backgroundColor: 'rgba(150,150,150,0.08)', borderRadius: 24, padding: 24, marginBottom: 20},
    cardLabel: {marginBottom: 10, fontSize: 18},
    descriptionText: {fontSize: 16, lineHeight: 24, opacity: 0.8},
    detailRow: {flexDirection: 'row', alignItems: 'center'},
    subText: {fontSize: 14, opacity: 0.6, marginTop: 2},
    statusGrid: {flexDirection: 'row', gap: 10, marginTop: 10},
    statusBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(150,150,150,0.1)',
        alignItems: 'center'
    },
    btnText: {fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize'},
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    }
});