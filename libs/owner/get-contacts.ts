import {supabase} from "@/libs/supabase";

export async function getAllContacts() {
    try {
        const { data, error } = await supabase.functions.invoke("super-action", {
            method: "GET",
        });

        if (error) {
            console.error("SDK Error:", error);
            throw new Error(`Error de red/servidor: ${error.message}`);
        }

        // Error personalizado devuelto por tu bloque catch en Deno
        if (data && data.error) {
            console.error("Function Logic Error:", data.error);
            throw new Error(data.error);
        }

        return data.data;
    } catch (err) {
        console.error("Full Catch Error:", err);
        throw err;
    }
}