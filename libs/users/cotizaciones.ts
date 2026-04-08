import {supabase} from "@/libs/supabase";

export const quotesService = {
    updateQuoteWithEstimate: async (quoteId: string, costo: string, pdfUrl: string): Promise<void> => {
        try {
            const costoNumerico = parseFloat(costo);
            if (isNaN(costoNumerico) || costoNumerico <= 0) {
                throw new Error("El costo debe ser un número válido mayor a cero");
            }

            const {error: updateError} = await supabase
                .from('cotizaciones')
                .update({
                    costo_estimado: costoNumerico,
                    pdf_url: pdfUrl,
                    estado: 'Enviada'
                })
                .eq('id', quoteId);

            if (updateError) throw new Error(updateError.message);
        } catch (error: any) {
            console.error("Error detallado en updateQuoteWithEstimate:", error);
            throw new Error(`Error al actualizar: ${error.message}`);
        }
    },
    updateStateQuote: async (id: string, estado: string): Promise<void> => {
        if (id.length === 0) throw new Error("Falta la id de la cotizacion");
        try {
            const {error: updateError} = await supabase
                .from('cotizaciones')
                .update({estado: estado})
                .eq('id', id);

            if (updateError) throw new Error(updateError.message);

        } catch (error) {
            console.error("Error detallado en updateStateQuote:", error);
        }
    }
};