import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/libs/supabase";

const CACHE_KEY = 'tools_cache';
const CACHE_TIME_KEY = 'tools_timestamp';
const CACHE_TTL = 1000 * 60 * 5;

export interface ToolsFilters {
    searchQuery?: string;
    status?: string;
}

export async function getTools(forceRefresh = false, filters?: ToolsFilters) {
    const isDefaultQuery = !filters || Object.keys(filters).length === 0;

    if (!forceRefresh && isDefaultQuery) {
        try {
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            const cacheTime = await AsyncStorage.getItem(CACHE_TIME_KEY);

            if (cachedData && cacheTime) {
                const now = Date.now();
                if (now - parseInt(cacheTime, 10) < CACHE_TTL) {
                    return JSON.parse(cachedData);
                }
            }
        } catch (e) {
            console.error("Error en cache");
        }
    }

    const { data: { session } } = await supabase.auth.getSession();
    const workerId = session?.user?.id;

    if (!workerId) throw new Error('No workerId provided');

    const toolsData = await fetchToolsFromSupabase(workerId);

    if (isDefaultQuery && toolsData) {
        try {
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toolsData));
            await AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {
            console.error("Error guardando en caché:", e);
        }
    }

    return toolsData;
}


export async function getToolsByWorkerId(workerId: string) {
    if (!workerId) throw new Error('workerId es requerido');

    return await fetchToolsFromSupabase(workerId);
}

async function fetchToolsFromSupabase(workerId: string) {
    const { data, error } = await supabase
        .from('herramientas')
        .select('*')
        .neq('estado','Entregada')
        .eq('worker_id', workerId);

    if (error) {
        console.error("Error en Supabase:", error.message);
        throw error;
    }

    return data || [];
}

export async function getToolByID(id: string) {
    if (!id) throw new Error('Se necesita una ID');

    const { data, error } = await supabase
        .from('herramientas')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error al obtener herramienta:", error.message);
        throw error;
    }

    return data;
}