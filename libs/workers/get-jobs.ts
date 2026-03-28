import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from "@/libs/supabase";

const CACHE_KEY = 'worker_jobs_cache';
const CACHE_TIME_KEY = 'worker_jobs_timestamp';
const CACHE_TTL = 1000 * 60 * 5;

export interface JobFilters {
    searchQuery?: string;
    status?: string;
}

export async function getWorkerJobs(forceRefresh = false, filters?: JobFilters) {
    const isDefaultQuery = !filters || Object.keys(filters).length === 0;

    if (!forceRefresh && isDefaultQuery) {
        try {
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            const cacheTime = await AsyncStorage.getItem(CACHE_TIME_KEY);

            if (cachedData && cacheTime) {
                const now = Date.now();
                if (now - parseInt(cacheTime, 10) < CACHE_TTL) {
                    console.log("⚡ Devolviendo trabajos asignados desde caché");
                    return JSON.parse(cachedData);
                }
            }
        } catch (e) {
            console.error("Error en caché:", e);
        }
    }

    console.log("🌐 Obteniendo trabajos asignados desde Edge Function...");

    const {data: {session}} = await supabase.auth.getSession();
    const workerId = session?.user?.id;

    if (!workerId) throw new Error("No se encontró una sesión activa");
    const {data, error} = await supabase.functions.invoke('get-worker-jobs', {
        method: "POST",
        body: {
            worker_id: workerId,
        },
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    });

    if (error) throw new Error(error.message || 'Error al obtener tus trabajos');

    const jobsData = data?.jobs || data;

    if (isDefaultQuery && jobsData) {
        try {
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(jobsData));
            await AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {
            console.error("Error guardando en caché:", e);
        }
    }

    return jobsData;
}