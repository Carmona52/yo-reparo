import React, {useState, useEffect, useMemo} from "react";
import {StyleSheet, TouchableOpacity, View, ScrollView, RefreshControl, Platform} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {Ionicons} from '@expo/vector-icons';
import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {getAllJobs} from "@/libs/owner/jobs/get-jobs";
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
            const data = await getAllJobs(force);
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

    const calendarDays = useMemo(() => {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Dom) a 6 (Sab)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Rellenar días vacíos del mes anterior para alinear columnas
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Rellenar los días del mes actual
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(new Date(year, month, d));
        }
        return days;
    }, [currentViewDate]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
        setCurrentViewDate(newDate);
    };

    const formatLongDate = (date: Date) => {
        return date.toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long"
        });
    };

    return (
        <ThemedView style={{flex: 1}}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4"/>
                    }
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Header corregido */}
                    <View style={styles.headerContainer}>
                        <ThemedText style={styles.greetingText}>
                            Hola, {profile?.name || 'Usuario'} 👋
                        </ThemedText>
                        <ThemedText type="title" style={styles.todayTitle}>
                            Hoy es {formatLongDate(today)}
                        </ThemedText>
                    </View>

                    {/* Calendario Compacto y Alineado */}
                    <View style={styles.calendarCard}>
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
                            {calendarDays.map((date, index) => {
                                if (!date) return <View key={`empty-${index}`} style={styles.dayCell}/>;

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
                    </View>

                    {/* Lista de Tareas */}
                    <View style={styles.tasksWrapper}>
                        <ThemedText style={styles.sectionTitle}>
                            Tareas del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long'
                        })}
                        </ThemedText>

                        {selectedDayTasks.length > 0 ? (
                            selectedDayTasks.map((task) => (
                                <TouchableOpacity
                                    key={task.id}
                                    activeOpacity={0.7}
                                    onPress={() => router.push(`/jobs/${task.id}` as any)}>
                                    <View style={[styles.taskCard, {backgroundColor: 'rgba(150, 150, 150, 0.08)'}]}>
                                        <View style={styles.timeColumn}>
                                            <ThemedText style={styles.timeText}>
                                                {task.fecha_cita ? new Date(task.fecha_cita).toLocaleTimeString([], {
                                                    hour: '2-digit', minute: '2-digit'
                                                }) : '--:--'}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.verticalDivider}/>
                                        <View style={styles.detailsColumn}>
                                            <ThemedText type="defaultSemiBold" style={styles.jobTitle}>
                                                {task.title}
                                            </ThemedText>
                                            <ThemedText style={styles.statusValue}>
                                                {task.status}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#ccc"/>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <ThemedText style={{opacity: 0.5, fontSize: 13}}>Sin pendientes para este
                                    día</ThemedText>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {padding: 20, paddingBottom: 40},
    headerContainer: {marginBottom: 20},
    greetingText: {opacity: 0.6, fontSize: 15, marginBottom: 2},
    todayTitle: {fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize'},

    calendarCard: {
        padding: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.05)',
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5
    },
    monthTitle: {textTransform: 'capitalize', fontSize: 16},
    navButtons: {flexDirection: 'row', gap: 15},
    navBtn: {padding: 2},

    weekDaysRow: {flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8},
    weekDayText: {fontWeight: 'bold', width: 35, textAlign: 'center', opacity: 0.3, fontSize: 11},

    daysGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start'},
    dayCell: {
        width: `${100 / 7}%`, // Siete columnas exactas
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2
    },
    dayCellSelected: {backgroundColor: '#0a7ea4', borderRadius: 10},
    dayCellToday: {borderBottomWidth: 2, borderBottomColor: '#0a7ea4'},
    dayText: {fontSize: 14},
    dayTextSelected: {color: '#fff', fontWeight: 'bold'},
    dotIndicator: {width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4},

    tasksWrapper: {gap: 10},
    sectionTitle: {fontSize: 14, fontWeight: 'bold', opacity: 0.6, marginBottom: 5, marginLeft: 5},
    taskCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#0a7ea4',
        alignItems: 'center',
    },
    timeColumn: {width: 60},
    timeText: {fontSize: 12, fontWeight: 'bold', opacity: 0.8},
    verticalDivider: {width: 1, height: '60%', backgroundColor: 'rgba(150, 150, 150, 0.2)', marginHorizontal: 12},
    detailsColumn: {flex: 1},
    jobTitle: {fontSize: 15, marginBottom: 2},
    statusValue: {fontSize: 11, color: '#0a7ea4', fontWeight: 'bold', textTransform: 'uppercase'},

    emptyState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: 'rgba(150, 150, 150, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.05)',
        borderStyle: 'dashed'
    },
});