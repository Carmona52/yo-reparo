import {useEffect, useState} from 'react';
import {StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getToolByID} from "@/libs/workers/tools";
import {supabase} from "@/libs/supabase";
import {Tools} from "@/libs/types/tools";

export default function ToolDetailAdminScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const [tool, setTool] = useState<Tools | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTool = async () => {
            try {
                const data = await getToolByID(String(id));
                setTool(data);
            } catch (e) {
                Alert.alert("Error", "No se pudo cargar la información de la herramienta");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchTool();
    }, [id]);

    const handleReturn = async () => {
        Alert.alert(
            "Confirmar Devolución",
            "¿Confirmas que la herramienta ha sido entregada?",
            [
                {text: "Cancelar", style: "cancel"},
                {
                    text: "Confirmar",
                    style: "default",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('herramientas')
                            .update({ estado: 'Entregada' })
                            .eq('id', id); 
                        if (!error) {
                            Alert.alert("Éxito", "Herramienta liberada");
                            router.back();
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <ThemedView style={styles.center}><ActivityIndicator color="#0a7ea4"/></ThemedView>;

    return (
        <ThemedView style={styles.container}>

            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Ionicons name="construct" size={40} color="#0a7ea4"/>
                </View>
                <ThemedText type="title">{tool?.tool}</ThemedText>
                <ThemedText style={styles.dateText}>
                    Prestada el: {new Date(tool?.created_at!).toLocaleDateString()}
                </ThemedText>
            </View>

            <View style={styles.actions}>
                <ThemedText style={styles.sectionLabel}>Acciones de Administrador</ThemedText>

                <TouchableOpacity style={styles.actionBtn} onPress={handleReturn}>
                    <View style={[styles.btnIcon, {backgroundColor: '#10b981'}]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#fff"/>
                    </View>
                    <ThemedText style={styles.btnText}>Marcar como Entregada</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}
                                  onPress={() => Alert.alert("Reporte", "Abriendo formulario de reporte...")}>
                    <View style={[styles.btnIcon, {backgroundColor: '#ff4444'}]}>
                        <Ionicons name="alert-circle-outline" size={24} color="#fff"/>
                    </View>
                    <ThemedText style={styles.btnText}>Reportar Daño o Pérdida</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 25, paddingTop: 60},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    backBtn: {flexDirection: 'row', alignItems: 'center', marginBottom: 30},
    backText: {color: '#0a7ea4', marginLeft: 5, fontWeight: 'bold'},
    header: {alignItems: 'center', marginBottom: 40},
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    dateText: {opacity: 0.5, marginTop: 5},
    actions: {gap: 15},
    sectionLabel: {fontSize: 12, fontWeight: 'bold', opacity: 0.4, textTransform: 'uppercase', marginBottom: 5},
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(150,150,150,0.08)',
        padding: 15,
        borderRadius: 15
    },
    btnIcon: {width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15},
    btnText: {fontSize: 16, fontWeight: '600'}
});