const pad = (n) => String(n).padStart(2, '0');

export const toLocalIsoDate = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Extrai a parte de data (aaaa-mm-dd) de valores vindos do Supabase.
// O PostgREST devolve timestamp como "2026-09-15 00:00:00+00" (sem "T"),
// o que quebrava o padrão antigo de `.split('T')[0]`.
export const toDatePart = (value) => {
    if (!value) return '';
    if (value instanceof Date) return toLocalIsoDate(value);
    return String(value).trim().slice(0, 10);
};

export const toLocalIsoDateTime = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${toLocalIsoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const formatDateTime = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};