import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/libs/supabase";

const CONTACTS_CACHE_KEY = 'contacts_list_cache';
const CONTACTS_CACHE_TIME_KEY = 'contacts_list_timestamp';
const CACHE_TTL = 1000 * 60 * 25;

export async function getAllContacts(forceRefresh = false) {
    if (!forceRefresh) {
        try {
            const cachedData = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
            const cacheTime = await AsyncStorage.getItem(CONTACTS_CACHE_TIME_KEY);

            if (cachedData && cacheTime) {
                const now = Date.now();
                if (now - parseInt(cacheTime, 10) < CACHE_TTL) {
                    console.log("⚡ Contactos cargados desde caché local");
                    return JSON.parse(cachedData);
                }
            }
        } catch (e) {
            console.error("Error al leer caché de contactos", e);
        }
    }
    console.log("🌐 Consultando contactos en la API...");
    try {
        const { data, error } = await supabase.functions.invoke("super-action", {
            method: "GET",
        });

        if (error) throw new Error(error.message);
        if (data && data.error) throw new Error(data.error);

        const contactsData = data.data;

        await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(contactsData));
        await AsyncStorage.setItem(CONTACTS_CACHE_TIME_KEY, Date.now().toString());

        return contactsData;
    } catch (err) {
        console.error("Error en getAllContacts:", err);
        throw err;
    }
}