import {supabase} from "@/libs/supabase";
import {Cotizacion} from "@/libs/types/cotizaciones";

export const cotizacionesService = {
    async getMyCotizaciones() {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) throw new Error("No hay usuario autenticado");

            const {data, error} = await supabase
                .from('cotizaciones')
                .select('*')
                .eq('created_by', session.user.id)
                .neq('estado', 'Cancelada')
                .order('created_at', {ascending: false});

            if (error) throw error;
            return data as Cotizacion[];
        } catch (error: any) {
            console.error("Error en getMyCotizaciones:", error.message);
            throw error;
        }
    },

    async getCotizacionDetails(id: string) {
        try {
            const {data, error} = await supabase
                .from('cotizaciones')
                .select(`
        *,
        profiles:created_by (
          name,id
        )
    `)
                .eq('id', id);

            if (error) throw error;
            console.log(data)
            return data as Cotizacion[];
        } catch (error: any) {
            console.error("Error en getCotizacionDetails:", error.message);
            throw error;
        }
    },

    async updateStatus(id: string, nuevoEstado: 'Aceptada' | 'Rechazada' | 'Cancelada') {
        const {data, error} = await supabase
            .from('cotizaciones')
            .update({estado: nuevoEstado})
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAllCotizaciones() {
        try {
            const {data, error} = await supabase
                .from('cotizaciones')
                .select('*')
                .order('created_at', {ascending: false});

            if (error) throw error;
            return data as Cotizacion[];
        } catch (error: any) {
            console.error("Error en getAllCotizaciones:", error.message);
            throw error;
        }
    },

    deleteCotizacion: async (id: string) => {
        try {
            const {error} = await supabase
                .from('cotizaciones')
                .update({estado: 'cancelada'})
                .eq('id', id);

            if (error) {
                console.error("Error de Supabase al eliminar:", error.message);
                throw new Error(error.message);
            }

            return true;
        } catch (error) {
            console.error("Error en deleteCotizacion:", error);
            throw error;
        }
    }
};