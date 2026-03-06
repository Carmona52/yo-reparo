import {supabase} from "@/libs/supabase";

export async function createJob(jobData: any) {
    const {data, error} = await supabase.functions.invoke("create-job", {
        method: "POST",
        body: jobData
    });
    if (error) throw error;

    supabase.functions.invoke('notify-assigned-job', {
        body: {
            workerId: jobData.workerId,
            jobId: jobData.jobTitle
        }
    })
    return data;
}