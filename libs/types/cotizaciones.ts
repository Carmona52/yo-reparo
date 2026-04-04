export interface Cotizacion {
    id: string;
    servicio: string;
    estado: string;
    pdf_url: string | null;
    costo_estimado: string | null;
    evidencia_url: string | null;
    descripcion: string | null;
    created_by: string;
    created_at: string;
    job_id?: string | null;
    direccion?: string;
    fecha_preferida?:string;
}