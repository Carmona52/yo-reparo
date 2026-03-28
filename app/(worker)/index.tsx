import React, {useState, useEffect, useMemo} from "react";
import {StyleSheet, TouchableOpacity, View, ScrollView, RefreshControl} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {Ionicons} from '@expo/vector-icons';
import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {getWorkerJobs} from "@/libs/workers/get-jobs";
import {Job} from "@/libs/types/job";
import {supabase} from "@/libs/supabase";

export default function HomeScreen() {
    const router = useRouter();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<{ name: string } | null>(null);

    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    const loadDashboardData = async (force = false) => {
        try {
            const data = await getWorkerJobs(force);
            setJobs(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error("Error en Dashboard:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if (session) {
                const {data} = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', session.user.id)
                    .single();
                if (data) setProfile(data);
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error);
        }
    };

    useEffect(() => {
        loadDashboardData();
        fetchProfile();
    }, []);

    const tasksByDate = useMemo(() => {
        return jobs.reduce((acc: Record<string, Job[]>, job) => {
            if (job.fecha_cita) {
                const dateKey = job.fecha_cita.split('T')[0];
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(job);
            }
            return acc;
        }, {});
    }, [jobs]);

    const selectedDayTasks = tasksByDate[selectedDate] || [];

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData(true);
    };

    // MODIFICADO: Ahora acepta el año y mes del estado actual
    const getDaysInMonth = () => {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    // NUEVO: Funciones para navegar
    const changeMonth = (offset: number) => {
        const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
        setCurrentViewDate(newDate);
    };

    const formatDateTitle = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long",
        });
    };

    return (
        <SafeAreaView style={{flex: 1}}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>}>

                <ThemedView style={styles.headerContainer}>
                    <View>
                        <ThemedText type="subtitle"
                                    style={{opacity: 0.7}}>Hola, {profile?.name || 'Usuario'} 👋</ThemedText>
                        <ThemedText type="title" style={{textTransform: 'capitalize'}}>
                            {formatDateTitle(todayStr)}
                        </ThemedText>
                    </View>
                </ThemedView>

                <ThemedView style={styles.calendarContainer}>
                    {/* CABECERA DEL CALENDARIO CON FLECHAS */}
                    <View style={styles.calendarHeader}>
                        <ThemedText type="defaultSemiBold" style={styles.monthTitle}>
                            {currentViewDate.toLocaleString('es-ES', {month: 'long', year: 'numeric'})}
                        </ThemedText>
                        <View style={styles.navButtons}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                                <Ionicons name="chevron-back" size={20} color="#0a7ea4"/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                                <Ionicons name="chevron-forward" size={20} color="#0a7ea4"/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.weekDaysRow}>
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                            <ThemedText key={index} style={styles.weekDayText}>{day}</ThemedText>
                        ))}
                    </View>

                    <View style={styles.daysGrid}>
                        {getDaysInMonth().map((date, index) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;
                            const hasTasks = tasksByDate[dateStr];
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        isSelected && styles.dayCellSelected,
                                        !isSelected && isToday && styles.dayCellToday
                                    ]}
                                    onPress={() => setSelectedDate(dateStr)}>
                                    <ThemedText style={[
                                        styles.dayText,
                                        isSelected && styles.dayTextSelected,
                                        !isSelected && isToday && {color: '#0a7ea4', fontWeight: 'bold'}
                                    ]}>
                                        {date.getDate()}
                                    </ThemedText>
                                    {hasTasks && (
                                        <View style={[
                                            styles.dotIndicator,
                                            {backgroundColor: isSelected ? '#fff' : '#0a7ea4'}
                                        ]}/>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ThemedView>

                <ThemedView style={styles.tasksContainer}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Tareas para
                        el {selectedDate.split('-')[2]} de {new Date(selectedDate + 'T00:00:00').toLocaleString('es-ES', {month: 'long'})}
                    </ThemedText>

                    {selectedDayTasks.length > 0 ? (
                        selectedDayTasks.map((task) => (
                            <TouchableOpacity
                                key={task.id}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/jobs/${task.id}` as any)}>
                                <ThemedView style={styles.taskCard}>
                                    <View style={styles.timeColumn}>
                                        <ThemedText type="defaultSemiBold" style={styles.timeText}>
                                            {task.fecha_cita ? new Date(task.fecha_cita).toLocaleTimeString([], {
                                                hour: '2-digit', minute: '2-digit'
                                            }) : '--:--'}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.verticalDivider}/>
                                    <View style={styles.detailsColumn}>
                                        <ThemedText type="defaultSemiBold"
                                                    style={styles.jobTitle}>{task.title}</ThemedText>
                                        <View style={styles.clientRow}>
                                            <ThemedText style={styles.clientLabel}>Estado: </ThemedText>
                                            <ThemedText
                                                style={[styles.clientName, {color: '#0a7ea4', fontWeight: 'bold'}]}>
                                                {task.status}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </ThemedView>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <ThemedView style={styles.emptyState}>
                            <ThemedText style={{opacity: 0.6, textAlign: 'center'}}>No hay tareas para este
                                día.</ThemedText>
                        </ThemedView>
                    )}
                </ThemedView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    contentContainer: {padding: 20},
    headerContainer: {marginBottom: 20, marginTop: 10},
    calendarContainer: {
        padding: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        borderRadius: 16,
        marginBottom: 24,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    monthTitle: {textTransform: 'capitalize', fontSize: 16},
    navButtons: {flexDirection: 'row', gap: 10},
    navBtn: {padding: 5},
    sectionTitle: {marginBottom: 12},
    weekDaysRow: {flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8},
    weekDayText: {fontWeight: 'bold', width: 35, textAlign: 'center', opacity: 0.5},
    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8},
    dayCell: {width: 38, height: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 19},
    dayCellSelected: {backgroundColor: '#0a7ea4'},
    dayCellToday: {borderBottomWidth: 2, borderBottomColor: '#0a7ea4'},
    dayText: {fontSize: 14},
    dayTextSelected: {color: '#fff', fontWeight: 'bold'},
    dotIndicator: {width: 4, height: 4, borderRadius: 2, marginTop: 2},
    tasksContainer: {gap: 12, marginBottom: 40},
    taskCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderLeftWidth: 4,
        borderLeftColor: '#0a7ea4',
        alignItems: 'center',
        marginBottom: 10
    },
    timeColumn: {width: 70, justifyContent: 'center'},
    timeText: {fontSize: 14},
    verticalDivider: {width: 1, height: '80%', backgroundColor: '#ccc', marginHorizontal: 12},
    detailsColumn: {flex: 1, justifyContent: 'center'},
    jobTitle: {fontSize: 16, marginBottom: 4},
    clientRow: {flexDirection: 'row'},
    clientLabel: {fontSize: 12, opacity: 0.6},
    clientName: {fontSize: 12, opacity: 0.8},
    emptyState: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
    },
});