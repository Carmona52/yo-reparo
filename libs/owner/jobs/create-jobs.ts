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

export async function createJobTemporal(jobData: any) {
    const {data: job, error} = await supabase.from('jobs')
        .insert(jobData)
        .select()
        .single()

    if (error) throw error;

    supabase.functions.invoke('notify-assigned-job', {
        body: {
            workerId: jobData.workerId,
            jobId: jobData.jobTitle
        }
    })

    return job;

}