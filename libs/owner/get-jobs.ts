import {supabase} from "@/libs/supabase";

export async function getAllJobs() {
    const { data: { session } } = await supabase.auth.getSession();
    const {data, error} = await supabase.functions.invoke("get-all-jobs",{
        method: "GET",
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    });

    if (error) throw new Error(error.message || 'Error al obtener trabajos');

    if (data && data.error) throw new Error(data.error.message || 'Error al obtener trabajos');
    console.log(data)
    return data;
}