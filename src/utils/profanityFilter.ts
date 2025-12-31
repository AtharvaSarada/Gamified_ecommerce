
import * as BadWords from 'bad-words';

let filterInstance: any = null;

function getFilter() {
    if (filterInstance) return filterInstance;
    try {
        // Handle CJS/ESM interop safely inside the function
        const FilterConstructor = (BadWords as any).default || BadWords;
        // Verify it's a constructor
        if (typeof FilterConstructor === 'function') {
            filterInstance = new FilterConstructor();
        } else {
            console.warn('BadWords library not loaded correctly, defaulting to pass-through.');
            filterInstance = { isProfane: () => false, clean: (t: string) => t };
        }
    } catch (e) {
        console.warn('Failed to initialize profanity filter:', e);
        filterInstance = { isProfane: () => false, clean: (t: string) => t };
    }
    return filterInstance;
}

export function checkProfanity(text: { title?: string; comment?: string }): boolean {
    const filter = getFilter();
    try {
        const titleProfane = text.title ? filter.isProfane(text.title) : false;
        const commentProfane = text.comment ? filter.isProfane(text.comment) : false;
        return titleProfane || commentProfane;
    } catch (error) {
        console.error('Profanity filter check error:', error);
        return false; // Fail open
    }
}

export function filterProfanity(text: string): string {
    const filter = getFilter();
    try {
        return filter.clean(text);
    } catch (error) {
        console.error('Profanity filter clean error:', error);
        return text; // Return original
    }
}
