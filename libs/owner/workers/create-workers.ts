import {supabase} from "@/libs/supabase";

export async function createWorkerByAdmin(
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'worker' | 'supervisor' | 'owner'
) {
    const {data, error} = await supabase.functions.invoke('quick-endpoint', {
        body: {
            email,
            password,
            name,
            phone,
            role
        }
    });

    if (error) {
        console.error("Error en la Edge Function:", error);
        throw new Error(error.message || 'Error al crear el trabajador');
    }

    if (data && data.error) {
        throw new Error(data.error);
    }

    return data;
}