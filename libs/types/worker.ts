export type Worker = {
    id: string,
    role: 'worker' | 'owner' | 'user',
    name: string,
    phone: string,
    created_at: string,
    email: string,
}