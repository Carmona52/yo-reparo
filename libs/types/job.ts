export interface Job {
    id: string;
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    worker_id: string;
    created_by:string;
    status: string;
    created_at: string;
    fecha_cita: string;
    image_url?:string;
}

export interface createJob {
    title: string;
    description: string;
    address: string;
    image_url: string;
    worker_id: string;
    fecha_cita: string;
}