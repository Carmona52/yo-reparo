import {supabase} from "@/libs/supabase";

export async function sendNotificationByID(userId: string, title: string, body: string, data: any = {}) {
    try {
        const { data: res, error } = await supabase.functions.invoke('send-notification', {
            body: {
                user_id: userId,
                title: title,
                body: body,
                data: data
            },
        });

        if (error) throw error;
        return res;
    } catch (error) {
        console.error('Error enviando notificación:', error);
        return null;
    }
}