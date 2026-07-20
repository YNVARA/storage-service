type GenerateCodeOptions = {
    prefix?: string;
    length?: number;
    type?: 'number' | 'alpha' | 'alphanumeric';
    uppercase?: boolean;
    separator?: string;
    excludeAmbiguous?: boolean;
};

export function generateCode({ prefix = '', length = 8, type = 'alphanumeric', uppercase = true, separator = '-', excludeAmbiguous = false }: GenerateCodeOptions = {}): string {
    let chars = '';

    switch (type) {
        case 'number':
            chars = '0123456789';
            break;

        case 'alpha':
            chars = 'abcdefghijklmnopqrstuvwxyz';
            break;

        case 'alphanumeric':
        default:
            chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            break;
    }

    if (excludeAmbiguous) {
        chars = chars.replace(/[0O1Il]/g, '');
    }

    let code = '';

    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * chars.length);
        code += chars[index];
    }

    code = uppercase ? code.toUpperCase() : code.toLowerCase();

    if (!prefix) {
        return code;
    }

    return `${prefix}${separator}${code}`;
}
