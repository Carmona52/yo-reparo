import React, { useState, useEffect, useMemo } from "react";
import { TouchableOpacity, View, ScrollView, RefreshControl, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getAllJobs } from "@/libs/owner/jobs/get-jobs";
import { Job } from "@/libs/types/job";
import { supabase } from "@/libs/supabase";
import { G, COLORS, shadow } from "@/styles/global-styles";

// Hook simple para tema oscuro/claro
const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        cardBg: isDark ? COLORS.cardDark : COLORS.cardLight,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        inputBg: isDark ? COLORS.inputDark : COLORS.inputLight,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
    };
};

export default function HomeScreen() {
    const router = useRouter();
    const { isDark, cardBg, surfaceBg, textColor, mutedText } = useAppTheme();
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
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
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
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
        return days;
    }, [currentViewDate]);

    const changeMonth = (offset: number) => {
        setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
    };

    const formatLongDate = (date: Date) => {
        return date.toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long"
        });
    };

    return (
        <ThemedView style={G.flex1}>
            <SafeAreaView style={G.flex1} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    contentContainerStyle={G.scrollContent}
                >
                    {/* Header */}
                    <View style={G.greetingContainer}>
                        <ThemedText style={[G.greetingText, { color: mutedText }]}>
                            Hola, {profile?.name || 'Usuario'} 👋
                        </ThemedText>
                        <ThemedText type="title" style={[G.todayTitle, { color: textColor }]}>
                            Hoy es {formatLongDate(today)}
                        </ThemedText>
                    </View>

                    {/* Calendario */}
                    <View style={[G.calendarCard, { backgroundColor: surfaceBg, borderColor: COLORS.border }]}>
                        <View style={G.calendarHeader}>
                            <ThemedText type="defaultSemiBold" style={[G.calendarMonthTitle, { color: textColor }]}>
                                {currentViewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                            </ThemedText>
                            <View style={G.calendarNavButtons}>
                                <TouchableOpacity onPress={() => changeMonth(-1)} style={G.calendarNavBtn}>
                                    <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => changeMonth(1)} style={G.calendarNavBtn}>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={G.weekDaysRow}>
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                                <ThemedText key={idx} style={[G.weekDayText, { color: mutedText }]}>{day}</ThemedText>
                            ))}
                        </View>

                        <View style={G.daysGrid}>
                            {calendarDays.map((date, idx) => {
                                if (!date) return <View key={`empty-${idx}`} style={G.dayCell} />;
                                const dateStr = date.toISOString().split('T')[0];
                                const isSelected = selectedDate === dateStr;
                                const hasTasks = tasksByDate[dateStr];
                                const isToday = date.toDateString() === new Date().toDateString();

                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            G.dayCell,
                                            isSelected && G.dayCellSelected,
                                            !isSelected && isToday && G.dayCellToday,
                                        ]}
                                        onPress={() => setSelectedDate(dateStr)}
                                    >
                                        <ThemedText
                                            style={[
                                                G.dayText,
                                                isSelected && G.dayTextSelected,
                                                !isSelected && isToday && { color: COLORS.primary, fontWeight: 'bold' },
                                                { color: isSelected ? COLORS.onPrimary : textColor }
                                            ]}
                                        >
                                            {date.getDate()}
                                        </ThemedText>
                                        {hasTasks && (
                                            <View style={[G.dotIndicator, { backgroundColor: isSelected ? COLORS.onPrimary : COLORS.primary }]} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Lista de tareas */}
                    <View style={G.tasksWrapper}>
                        <ThemedText style={[G.sectionTitle, { color: mutedText, marginBottom: 5, marginLeft: 5 }]}>
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
                                    onPress={() => router.push(`/jobs/${task.id}` as any)}
                                >
                                    <View style={[
                                        G.taskCard,
                                        { backgroundColor: surfaceBg, borderLeftColor: COLORS.primary }
                                    ]}>
                                        <View style={G.taskTimeColumn}>
                                            <ThemedText style={[G.taskTimeText, { color: textColor }]}>
                                                {task.fecha_cita ? new Date(task.fecha_cita).toLocaleTimeString([], {
                                                    hour: '2-digit', minute: '2-digit'
                                                }) : '--:--'}
                                            </ThemedText>
                                        </View>
                                        <View style={[G.taskDivider, { backgroundColor: COLORS.border }]} />
                                        <View style={G.taskDetailsColumn}>
                                            <ThemedText type="defaultSemiBold" style={[G.taskTitle, { color: textColor }]}>
                                                {task.title}
                                            </ThemedText>
                                            <ThemedText style={[G.taskStatus, { color: COLORS.primary }]}>
                                                {task.status}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={COLORS.mutedIcon} />
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={[G.emptyStateDashed, { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.borderDashed }]}>
                                <ThemedText style={{ opacity: 0.5, fontSize: 13, color: mutedText }}>
                                    Sin pendientes para este día
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}