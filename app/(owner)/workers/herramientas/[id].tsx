import {useEffect, useState} from 'react';
import {View, ActivityIndicator, TouchableOpacity, Alert, useColorScheme} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {ThemedView} from "@/components/themed-view";
import {ThemedText} from "@/components/themed-text";
import {getToolByID} from "@/libs/workers/tools";
import {supabase} from "@/libs/supabase";
import {Tools} from "@/libs/types/tools";
import {G, COLORS} from "@/styles/global-styles";

const useAppTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    return {
        isDark,
        textColor: isDark ? '#fff' : '#000',
        mutedText: COLORS.muted,
        surfaceBg: isDark ? COLORS.surfaceMedium : COLORS.surfaceLight,
        borderColor: COLORS.border,
    };
};

export default function ToolDetailAdminScreen() {
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const {textColor, mutedText, surfaceBg} = useAppTheme();
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
                        const {error} = await supabase
                            .from('herramientas')
                            .update({estado: 'Entregada'})
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

    if (loading) return <ThemedView style={G.center}><ActivityIndicator color={COLORS.primary}/></ThemedView>;

    return (
        <ThemedView style={[G.flex1, {padding: 25, paddingTop: 60}]}>
            <View style={[G.center, {marginBottom: 40}]}>
                <View style={[
                    G.center,
                    {
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: COLORS.primaryBg,
                        marginBottom: 15
                    }
                ]}>
                    <Ionicons name="construct" size={40} color={COLORS.primary}/>
                </View>
                <ThemedText type="title" style={{color: textColor}}>{tool?.tool}</ThemedText>
                <ThemedText style={[G.infoValueSm, {color: mutedText, marginTop: 5}]}>
                    Prestada el: {new Date(tool?.created_at!).toLocaleDateString()}
                </ThemedText>
            </View>

            <View style={{gap: 15}}>
                <ThemedText style={[G.sectionLabel, {marginBottom: 5}]}>Acciones de Administrador</ThemedText>

                <TouchableOpacity style={[G.row, {backgroundColor: surfaceBg, padding: 15, borderRadius: 15}]}
                                  onPress={handleReturn}>
                    <View style={[G.center, {
                        width: 45,
                        height: 45,
                        borderRadius: 12,
                        backgroundColor: COLORS.success,
                        marginRight: 15
                    }]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.onPrimary}/>
                    </View>
                    <ThemedText style={[G.infoValue, {color: textColor}]}>Marcar como Entregada</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[G.row, {backgroundColor: surfaceBg, padding: 15, borderRadius: 15}]}
                                  onPress={() => Alert.alert("Reporte", "Abriendo formulario de reporte...")}>
                    <View style={[G.center, {
                        width: 45,
                        height: 45,
                        borderRadius: 12,
                        backgroundColor: COLORS.danger,
                        marginRight: 15
                    }]}>
                        <Ionicons name="alert-circle-outline" size={24} color={COLORS.onPrimary}/>
                    </View>
                    <ThemedText style={[G.infoValue, {color: textColor}]}>Reportar Daño o Pérdida</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}