import { supabase } from "@/libs/supabase";

export async function createUser(
    email: string,
    password: string,
    name: string,
    phone: string,
    role: string
) {
    const { data, error } = await supabase.functions.invoke('register_user', {
        body: {
            email,
            password,
            name,
            phone,
            role
        }
    });

    if (error) {
        console.error("Error al invocar la Edge Function:", error);
        throw new Error(error.message || 'Error de conexión con el servidor');
    }

    if (data && data.error) {
        console.error("Error devuelto por la función:", data.error);
        throw new Error(data.error);
    }

    return data;
}