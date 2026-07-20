export function generate_slug(
    text: string,
    options?: {
        maxLength?: number;
        fallback?: string;
    },
): string {
    const maxLength = options?.maxLength ?? 100;
    const fallback = options?.fallback ?? 'n-a';

    const slug = text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, maxLength);

    return slug || fallback;
}
