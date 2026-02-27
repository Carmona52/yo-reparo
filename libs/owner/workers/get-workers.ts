import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/libs/supabase";

const WORKERS_CACHE_KEY = 'workers_list_cache';
const WORKERS_CACHE_TIME_KEY = 'workers_list_timestamp';
const CACHE_TTL = 1000 * 60 * 10; // 10 minutos para personal

export async function getAllWorkers(forceRefresh = false) {
    if (!forceRefresh) {
        try {
            const cachedData = await AsyncStorage.getItem(WORKERS_CACHE_KEY);
            const cacheTime = await AsyncStorage.getItem(WORKERS_CACHE_TIME_KEY);

            if (cachedData && cacheTime) {
                const now = Date.now();
                if (now - parseInt(cacheTime, 10) < CACHE_TTL) {
                    console.log("⚡ Workers cargados desde caché");
                    return JSON.parse(cachedData);
                }
            }
        } catch (e) {
            console.error("Error leyendo caché de workers", e);
        }
    }

    console.log("🌐 Consultando personal en la API...");
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke("get-all-workers", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    });

    if (error) throw new Error(error.message || 'Error al obtener personal');
    if (data && data.error) throw new Error(data.error.message || 'Error en la respuesta');

    try {
        await AsyncStorage.setItem(WORKERS_CACHE_KEY, JSON.stringify(data));
        await AsyncStorage.setItem(WORKERS_CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
        console.error("Error guardando caché de workers", e);
    }

    return data;
}