import React, {useState, useEffect, useMemo} from "react";
import {StyleSheet, TouchableOpacity, View, ScrollView, RefreshControl} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";

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
    const [userName, setUserName] = useState("Usuario");

    const loadDashboardData = async (force = false) => {
        try {
            const data = await getAllJobs(force);
            setJobs(Array.isArray(data) ? data : data.data || []);

            const {data: {user}} = await supabase.auth.getUser();
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name);
            }
        } catch (error) {
            console.error("Error en Dashboard:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
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

    const getDaysInMonth = () => {
        const year = today.getFullYear();
        const month = today.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
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
                        <ThemedText type="subtitle" style={{opacity: 0.7}}>Hoy es</ThemedText>
                        <ThemedText type="title" style={{textTransform: 'capitalize'}}>
                            {formatDateTitle(todayStr)}
                        </ThemedText>
                    </View>
                </ThemedView>

                <ThemedView style={styles.userInfo}>
                    <ThemedText>Hola, <ThemedText type="defaultSemiBold">{userName}</ThemedText></ThemedText>
                </ThemedView>

                <ThemedView style={styles.calendarContainer}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Calendario de Citas</ThemedText>
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

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        isSelected && styles.dayCellSelected,
                                        hasTasks && !isSelected && styles.dayCellHasTasks
                                    ]}
                                    onPress={() => setSelectedDate(dateStr)}>
                                    <ThemedText style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                                        {date.getDate()}
                                    </ThemedText>
                                    {hasTasks && <View
                                        style={[styles.dotIndicator, isSelected ? {backgroundColor: '#fff'} : {backgroundColor: '#0a7ea4'}]}/>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ThemedView>

                <ThemedView style={styles.tasksContainer}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Tareas: {selectedDate.split('-')[2]} de {today.toLocaleString('es-ES', {month: 'long'})}
                    </ThemedText>

                    {selectedDayTasks.length > 0 ? (
                        selectedDayTasks.map((task) => (
                            <TouchableOpacity
                                key={task.id}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/jobs/${task.id}` as any)}>
                                <ThemedView key={task.id} style={styles.taskCard}>
                                    <View style={styles.timeColumn}>
                                        <ThemedText type="defaultSemiBold" style={styles.timeText}>
                                            {task.fecha_cita ? new Date(task.fecha_cita).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '--:--'}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.verticalDivider}/>
                                    <View style={styles.detailsColumn}>
                                        <ThemedText type="defaultSemiBold"
                                                    style={styles.jobTitle}>{task.title}</ThemedText>
                                        <View style={styles.clientRow}>
                                            <ThemedText style={styles.clientLabel}>Estado: </ThemedText>
                                            <ThemedText style={[styles.clientName, {
                                                color: '#0a7ea4',
                                                fontWeight: 'bold'
                                            }]}>{task.status}</ThemedText>
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
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        marginTop: 10,
    },
    userInfo: {
        marginBottom: 20,
    },
    calendarContainer: {
        padding: 16,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        borderRadius: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        fontWeight: 'bold',
        width: 35,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 8,
    },
    dayCell: {
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 19,
        marginBottom: 5,
    },
    dayCellSelected: {
        backgroundColor: '#0a7ea4',
    },
    dayCellHasTasks: {
        borderWidth: 1,
        borderColor: '#0a7ea4',
    },
    dayText: {
        fontSize: 14,
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dotIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 2,
    },
    tasksContainer: {
        gap: 12,
        marginBottom: 40,
    },
    taskCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(150, 150, 150, 0.08)',
        borderLeftWidth: 4,
        borderLeftColor: '#0a7ea4',
        alignItems: 'center',
    },
    timeColumn: {
        width: 70,
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 14,
    },
    verticalDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#ccc',
        marginHorizontal: 12,
    },
    detailsColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    jobTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    clientRow: {
        flexDirection: 'row',
    },
    clientLabel: {
        fontSize: 12,
        opacity: 0.6,
    },
    clientName: {
        fontSize: 12,
        opacity: 0.8,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
    },
});