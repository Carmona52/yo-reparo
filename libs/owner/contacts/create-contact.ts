import { supabase } from "@/libs/supabase";

import {CreateContact} from "@/libs/types/contact";

export const createContact = async (contact: CreateContact) => {
    try {
        const { data, error } = await supabase.functions.invoke('create-contact', {
            body: contact,
        });

        if (error) {
            throw new Error(error.message);
        }

        return { data, error: null };
    } catch (error: any) {
        console.error("Error en createContact service:", error.message);
        return { data: null, error: error.message };
    }
};