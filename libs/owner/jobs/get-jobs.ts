import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/libs/supabase";

const CACHE_KEY = 'jobs_data_cache';
const CACHE_TIME_KEY = 'jobs_data_timestamp';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos en milisegundos

export interface JobFilters {
    searchQuery?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export async function getAllJobs(forceRefresh = false, filters?: JobFilters) {
    const isDefaultQuery = !filters || Object.keys(filters).length === 0;

    if (!forceRefresh && isDefaultQuery) {
        try {
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            const cacheTime = await AsyncStorage.getItem(CACHE_TIME_KEY);

            if (cachedData && cacheTime) {
                const now = Date.now();
                const timePassed = now - parseInt(cacheTime, 10);

                if (timePassed < CACHE_TTL) {
                    console.log("⚡ Devolviendo trabajos desde caché (AsyncStorage)");
                    return JSON.parse(cachedData);
                }
            }
        } catch (e) {
            console.error("Error leyendo el caché de AsyncStorage:", e);
        }
    }
    console.log("🌐 Obteniendo trabajos desde Supabase API...");
    const { data: { session } } = await supabase.auth.getSession();

    let functionPath = "get-all-jobs";

    if (filters && Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
        functionPath = `${functionPath}?${queryParams}`;
    }

    const { data, error } = await supabase.functions.invoke(functionPath, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    });

    if (error) throw new Error(error.message || 'Error al obtener trabajos');
    if (data && data.error) throw new Error(data.error.message || 'Error en lógica de trabajos');

    if (isDefaultQuery && data) {
        try {
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
            await AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {
            console.error("Error guardando en caché:", e);
        }
    }

    return data;
}