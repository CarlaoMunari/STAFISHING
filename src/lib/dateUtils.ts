export function parseLocalDate(dateVal: string | Date | null | undefined): Date {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === "string") {
        // Match YYYY-MM-DD from any ISO timestamp (e.g., "2026-10-03", "2026-10-03T00:00:00.000Z")
        const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // 0-indexed month
            const day = parseInt(match[3], 10);
            // Construct local Date at 12:00 PM (noon) to guarantee timezone immunity
            return new Date(year, month, day, 12, 0, 0);
        }
    }
    return new Date(dateVal);
}

export function formatDateBR(dateVal: string | Date | null | undefined): string {
    if (!dateVal) return "";
    const d = parseLocalDate(dateVal);
    return d.toLocaleDateString("pt-BR");
}

