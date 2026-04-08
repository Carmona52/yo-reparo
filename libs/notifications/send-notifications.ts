import {supabase} from "@/libs/supabase";

type notification = {
    role: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}

export async function sendGenericNotification(notification: notification) {
    supabase.functions.invoke('send-to-admins', {
        body: {
            role: notification.role,
            title: notification.title,
            body: notification.body,
            data: {
                ...notification.data,
            }
        }
    })
}