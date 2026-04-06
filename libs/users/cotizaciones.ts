import {supabase} from "@/libs/supabase";

export const quotesService = {
    uploadQuotePDF: async (fileUri: string, quoteId: string): Promise<string> => {
        try {
            const response = await fetch(fileUri);
            const blob = await response.blob();

            const fileName = `presupuesto_${quoteId}_${Date.now()}.pdf`;
            const filePath = `cotizaciones/${fileName}`;
            const {error: uploadError} = await supabase.storage
                .from('pdfs') // o el bucket que hayas creado
                .upload(filePath, blob, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública (usando el mismo bucket)
            const {data: {publicUrl}} = supabase.storage
                .from('pdfs')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error(error);
            throw new Error('Error al subir PDF');
        }
    },

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
    }
};