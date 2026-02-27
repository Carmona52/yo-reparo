import { supabase } from "@/libs/supabase";

export async function updateJob(jobId: string, updates: { status?: string, worker_id?: string,image_url?: string }) {
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke("update-job", {
        method: "POST",
        body: { jobId, ...updates },
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    });

    if (error) throw new Error(error.message);
    if (data && data.error) throw new Error(data.error);

    return data;
}