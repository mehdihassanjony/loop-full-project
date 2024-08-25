export function toIntOrNull(value: any): number | null {
    if (value && !isNaN(value)) {
        return parseInt(value);
    }
    return null;
}

export function toFloatOrNull(value: any, precision: number = 3): number | null {
    if (value && !isNaN(value)) {
        return parseFloat(parseFloat(value).toFixed(precision));
    }
    return null;
}

export function NonNumberToZero(value: any): number | null {
    if (value && !isNaN(value)) {
        return value;
    }
    return 0;
}
