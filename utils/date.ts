
export const toTimestamp = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatDateTime = (dateString?: string) => {
    if (!dateString) return "No especificada";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric',
    }) + ' a las ' + date.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};