export interface Cotizacion {
    id: string;
    servicio: string;
    estado: string;
    pdf_url: string | null;
    costo_estimado: string | null;
    evidencia_url: string | null;
    descripcion: string | null;
    created_by: { name: string; } | null;
    created_at: string;
    job_id?: string | null;
    direccion?: string;
    fecha_preferida?: string;
    profiles: { id: string, name: string }
    price:number,
    en_apelacion?: boolean;
    apelacion_usada?: boolean;
    apelacion_estado?: 'activa' | 'aceptada' | 'cerrada_sin_acuerdo' | null;
}