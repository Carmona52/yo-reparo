import { supabase } from "@/libs/supabase";

export async function updateWorkerInfo(workerId: string, updates: any) {
    const { data, error } = await supabase.functions.invoke('update-worker', {
        body: { workerId, ...updates },
        method: 'PUT',
    });

    if (error) throw error;
    return data;
}