import React, {useState} from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

import {ThemedText} from "@/components/themed-text";
import {ThemedView} from "@/components/themed-view";
import {useRouter} from "expo-router";

const MOCK_TASKS: Record<string, { id: string; job: string; client: string; time: string }[]> = {
    "2026-02-21": [
        {id: "1", job: "Plomería - Fuga en baño", client: "Juan Pérez", time: "09:00 AM"},
        {id: "2", job: "Electricidad - Instalación", client: "Maria Garcia", time: "12:30 PM"},
    ],
};

export default function HomeScreen() {
    const router = useRouter();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);


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

    const daysInMonth = getDaysInMonth();

    const formatDateTitle = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    };

    return (
        <SafeAreaView style={{flex: 1}}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

                <ThemedView style={styles.headerContainer}>
                    <View>
                        <ThemedText type="subtitle" style={{opacity: 0.7}}>Hoy es</ThemedText>
                        <ThemedText type="title" style={{textTransform: 'capitalize'}}>
                            {formatDateTitle(todayStr)}
                        </ThemedText>
                    </View>
                </ThemedView>

                <ThemedView style={styles.userInfo}>
                    <ThemedText>Hola, <ThemedText type="defaultSemiBold">{"Usuario"}</ThemedText></ThemedText>
                </ThemedView>

                <ThemedView style={styles.calendarContainer}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Mes</ThemedText>
                    <View style={styles.weekDaysRow}>
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                            <ThemedText key={index} style={styles.weekDayText}>{day}</ThemedText>
                        ))}
                    </View>
                    <View style={styles.daysGrid}>
                        {daysInMonth.map((date, index) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;
                            const hasTasks = MOCK_TASKS[dateStr];

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
                <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                    <ThemedText>Salir</ThemedText>
                </TouchableOpacity>

                <ThemedView style={styles.tasksContainer}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Tareas para el {selectedDate.split('-')[2]}
                    </ThemedText>

                    {MOCK_TASKS[selectedDate] ? (
                        MOCK_TASKS[selectedDate].map((task) => (
                            <ThemedView key={task.id} style={styles.taskCard}>
                                <View style={styles.timeColumn}>
                                    <ThemedText type="defaultSemiBold" style={styles.timeText}>{task.time}</ThemedText>
                                </View>
                                <View style={styles.verticalDivider}/>
                                <View style={styles.detailsColumn}>
                                    <ThemedText type="defaultSemiBold" style={styles.jobTitle}>{task.job}</ThemedText>
                                    <View style={styles.clientRow}>
                                        {/* SOLUCIÓN 2: Cambiar Text por ThemedText */}
                                        <ThemedText style={styles.clientLabel}>Cliente: </ThemedText>
                                        <ThemedText style={styles.clientName}>{task.client}</ThemedText>
                                    </View>
                                </View>
                            </ThemedView>
                        ))
                    ) : (
                        <ThemedView style={styles.emptyState}>
                            <ThemedText style={{opacity: 0.6, textAlign: 'center'}}>No hay tareas
                                agendadas.</ThemedText>
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