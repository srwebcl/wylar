import 'server-only';
import sanitizeHtml from 'sanitize-html';

// Lista blanca del HTML que produce el editor (RichTextEditor.tsx). El sitio
// público lo renderiza con set:html, así que lo que no esté aquí se elimina.
const OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'h3', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowProtocolRelative: false,
    transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
    },
};

export function sanitizeRichText(html: string): string {
    return sanitizeHtml(html, OPTIONS);
}
