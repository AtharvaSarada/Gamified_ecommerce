
import Filter from 'bad-words';

const filter = new Filter();

export function checkProfanity(text: { title?: string; comment?: string }): boolean {
    try {
        const titleProfane = text.title ? filter.isProfane(text.title) : false;
        const commentProfane = text.comment ? filter.isProfane(text.comment) : false;
        return titleProfane || commentProfane;
    } catch (error) {
        console.error('Profanity filter error:', error);
        return false; // Fail open - allow submission if filter fails
    }
}

export function filterProfanity(text: string): string {
    try {
        return filter.clean(text);
    } catch (error) {
        console.error('Profanity filter error:', error);
        return text; // Return original text if filter fails
    }
}
