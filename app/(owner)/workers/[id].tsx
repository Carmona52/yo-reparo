import {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform} from 'react-native';
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

export default function WorkerDetailScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();

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
        <ThemedView style={styles.center}>
            <ActivityIndicator size="large" color="#0a7ea4"/>
        </ThemedView>
    );

    if (!worker) return (
        <ThemedView style={styles.center}>
            <ThemedText>Trabajador no encontrado</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(owner)/workers')} style={styles.errorBtn}>
                <ThemedText style={{color: '#fff'}}>Regresar</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );

    return (
        <ThemedView style={{flex: 1}}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#333"/>
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold">Ficha del Personal</ThemedText>

            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <View style={styles.profileHeader}>
                    <View style={styles.bigAvatar}>
                        <ThemedText style={styles.avatarLetter}>
                            {worker.name.charAt(0).toUpperCase()}
                        </ThemedText>
                    </View>
                    <ThemedText type="title" style={styles.name}>{worker.name}</ThemedText>
                    <View style={styles.roleBadge}>
                        <ThemedText style={styles.roleText}>{worker.role || 'Operativo'}</ThemedText>
                    </View>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, {backgroundColor: '#10b981'}]}
                        onPress={() => Linking.openURL(`tel:${worker.phone}`)}>
                        <Ionicons name="call" size={24} color="#fff"/>
                        <ThemedText style={styles.actionBtnText}>Llamar</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, {backgroundColor: '#25d366'}]}
                        onPress={() => Linking.openURL(`whatsapp://send?phone=${worker.phone}`)}>
                        <Ionicons name="logo-whatsapp" size={24} color="#fff"/>
                        <ThemedText style={styles.actionBtnText}>WhatsApp</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                    <ThemedText style={styles.cardLabel}>Información de Contacto</ThemedText>

                    <View style={styles.infoRow}>
                        <Ionicons name="phone-portrait-outline" size={20} color="#0a7ea4"/>
                        <View style={styles.infoTextGroup}>
                            <ThemedText style={styles.dataLabel}>Teléfono</ThemedText>
                            <ThemedText style={styles.dataValue}>{worker.phone || 'No registrado'}</ThemedText>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color="#0a7ea4"/>
                        <View style={styles.infoTextGroup}>
                            <ThemedText style={styles.dataLabel}>Correo Electrónico</ThemedText>
                            <ThemedText style={styles.dataValue}>{worker.email || 'Sin correo'}</ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.cardHeaderRow}>
                        <ThemedText style={styles.cardLabel}>Herramientas Prestadas</ThemedText>
                        <Ionicons name="hammer-outline" size={16} color="#0a7ea4"/>
                    </View>

                    {loadingTools ? (
                        <ActivityIndicator size="small" color="#0a7ea4"/>
                    ) : tools.length > 0 ? (
                        tools.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.toolItemRow}
                                onPress={() => router.push({
                                    pathname: "/(owner)/workers/herramientas/[id]",
                                    params: {id: item.id, workerId: worker.id}
                                })}
                            >
                                <View style={styles.toolDot}/>
                                <View style={{flex: 1}}>
                                    <ThemedText style={styles.toolNameText}>{item.tool}</ThemedText>
                                    <ThemedText style={styles.toolDateText}>
                                        Prestada el día: {new Date(item.created_at).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(150,150,150,0.5)"/>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <ThemedText style={styles.emptyText}>Sin herramientas a cargo</ThemedText>
                    )}

                </View>

                <ThemedView>
                    <TouchableOpacity
                        style={styles.assignBtn}
                        onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={20} color="#0a7ea4"/>
                        <ThemedText style={{color: '#0a7ea4', fontWeight: 'bold'}}>Prestar más herramientas</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
                <View style={styles.infoCard}>
                    <ThemedText style={styles.cardLabel}>Rendimiento y Status</ThemedText>

                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <ThemedText style={styles.statNumber}>12</ThemedText>
                            <ThemedText style={styles.statLabel}>Trabajos</ThemedText>
                        </View>
                        <View style={styles.statBox}>
                            <ThemedText style={styles.statNumber}>4.8</ThemedText>
                            <ThemedText style={styles.statLabel}>Rating</ThemedText>
                        </View>
                        <View style={styles.statBox}>
                            <ThemedText style={styles.statNumber}>Activo</ThemedText>
                            <ThemedText style={styles.statLabel}>Estado</ThemedText>
                        </View>
                    </View>
                </View>

                {/*<TouchableOpacity style={styles.deleteBtn}>*/}
                {/*    <ThemedText style={{color: '#ff4444', fontWeight: 'bold'}}>Eliminar del equipo</ThemedText>*/}
                {/*</TouchableOpacity>*/}


            </ScrollView>

            <AddToolModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                workerId={String(id)}
                onSuccess={refreshTools}/>
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

const styles = StyleSheet.create({
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 10
    },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(150,150,150,0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    scroll: {padding: 20},

    profileHeader: {alignItems: 'center', marginBottom: 30},
    bigAvatar: {
        width: 100, height: 100, borderRadius: 30,
        backgroundColor: '#0a7ea4', justifyContent: 'center', alignItems: 'center',
        marginBottom: 15,
        elevation: 10, shadowColor: '#0a7ea4', shadowOpacity: 0.3, shadowRadius: 15
    },
    avatarLetter: {color: '#fff', fontSize: 40, fontWeight: 'bold'},
    name: {fontSize: 26, fontWeight: '800', textAlign: 'center'},
    roleBadge: {
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        paddingHorizontal: 15, paddingVertical: 5,
        borderRadius: 10, marginTop: 10
    },
    roleText: {color: '#0a7ea4', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12},

    quickActions: {flexDirection: 'row', gap: 15, marginBottom: 30},
    actionBtn: {
        flex: 1, height: 55, borderRadius: 18,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
    },
    actionBtnText: {color: '#fff', fontWeight: 'bold', fontSize: 16},

    infoCard: {
        backgroundColor: 'rgba(150,150,150,0.08)',
        borderRadius: 24, padding: 20, marginBottom: 20
    },
    cardLabel: {
        fontSize: 13,
        opacity: 0.4,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 20,
        letterSpacing: 1
    },
    infoRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 18},
    infoTextGroup: {marginLeft: 15},
    dataLabel: {fontSize: 11, opacity: 0.5, textTransform: 'uppercase'},
    dataValue: {fontSize: 16, fontWeight: '500'},

    statsGrid: {flexDirection: 'row', justifyContent: 'space-between'},
    statBox: {alignItems: 'center', flex: 1},
    statNumber: {fontSize: 18, fontWeight: 'bold', color: '#0a7ea4'},
    statLabel: {fontSize: 12, opacity: 0.5},

    errorBtn: {backgroundColor: '#0a7ea4', padding: 12, borderRadius: 10, marginTop: 20},
    deleteBtn: {
        marginTop: 10, marginBottom: 40,
        padding: 20, borderRadius: 20,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)'
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    toolItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.05)',
    },
    toolDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0a7ea4',
        marginRight: 12,
    },
    toolNameText: {
        fontSize: 15,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 14,
        opacity: 0.4,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    toolDateText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    assignBtn: {
        marginTop: 10,
        marginBottom: 40,
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(10, 126, 164, 0.3)',
        borderStyle: 'dashed',
        gap: 8
    },
});