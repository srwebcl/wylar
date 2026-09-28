import { describe, expect, it } from 'vitest';
import { slugify } from '@/lib/slugify';
import { normalizeRut } from '@/lib/rut';
import { isSafeUrl } from '@/lib/safeUrl';
import { certificateStatus, certificateStatusLabel, formatDuration } from '@/lib/constants';
import { sanitizeRichText } from '@/lib/sanitizeHtml';
import { detectSourceFromReferer, resolveSource } from '@/lib/leadSource';
import { buildLeadsWhere } from '@/lib/leadsFilter';
import { changePasswordSchema, heroSlideSchema, publicLeadSchema, userSchema } from '@/lib/validation';

describe('slugify', () => {
    it('quita tildes, pasa a minúsculas y limpia símbolos', () => {
        expect(slugify('Instalador(a) Eléctrico(a) Clase D')).toBe('instalador-a-electrico-a-clase-d');
        expect(slugify('  Cuidador/a de Personas   Mayores ')).toBe('cuidador-a-de-personas-mayores');
        expect(slugify('Ñandú & Cía.')).toBe('nandu-cia');
    });
});

describe('normalizeRut', () => {
    it('deja el RUT sin puntos, guion ni espacios y en minúscula', () => {
        expect(normalizeRut('17.625.818-7')).toBe('176258187');
        expect(normalizeRut(' 12.345.678-K ')).toBe('12345678k');
    });
});

describe('isSafeUrl', () => {
    it('acepta rutas internas y https', () => {
        expect(isSafeUrl('/catalogo')).toBe(true);
        expect(isSafeUrl('https://wylar.cl/x')).toBe(true);
    });
    it('rechaza esquemas peligrosos y rutas hacia otros sitios', () => {
        for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'http://x.cl', '//evil.com', '/\\evil.com', 'evil.com']) {
            expect(isSafeUrl(bad), bad).toBe(false);
        }
    });
});

describe('certificateStatus', () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);
    it('sin vencimiento, vigente y vencido', () => {
        expect(certificateStatus(null)).toBe('SIN_VENCIMIENTO');
        expect(certificateStatus(future)).toBe('VIGENTE');
        expect(certificateStatus(past)).toBe('VENCIDO');
    });
    it('revocado tiene prioridad sobre la vigencia', () => {
        expect(certificateStatus(future, new Date())).toBe('REVOCADO');
        expect(certificateStatus(null, new Date())).toBe('REVOCADO');
        expect(certificateStatusLabel('REVOCADO')).toBe('Revocado');
    });
});

describe('formatDuration', () => {
    it('formatea minutos, horas y días', () => {
        expect(formatDuration(30_000)).toBe('<1 min');
        expect(formatDuration(45 * 60_000)).toBe('45 min');
        expect(formatDuration(135 * 60_000)).toBe('2h 15min');
        expect(formatDuration(3 * 86_400_000)).toBe('3 días');
    });
});

describe('sanitizeRichText', () => {
    it('elimina scripts, manejadores de eventos y enlaces peligrosos', () => {
        const out = sanitizeRichText('<p onclick="x()">Hola</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">m</a><a href="//evil.com">p</a><iframe src="//x"></iframe>');
        expect(out).not.toMatch(/script|onerror|onclick|javascript:|evil\.com|iframe|<img/i);
        expect(out).toContain('<p>Hola</p>');
    });
    it('conserva el formato del editor y agrega rel a los enlaces', () => {
        const out = sanitizeRichText('<h3>T</h3><ul><li><strong>a</strong></li></ul><a href="https://wylar.cl">w</a>');
        expect(out).toContain('<h3>T</h3>');
        expect(out).toContain('<strong>a</strong>');
        expect(out).toContain('href="https://wylar.cl"');
        expect(out).toContain('noopener');
    });
});

describe('leadSource', () => {
    it('respeta un canal válido del cliente y descarta uno desconocido', () => {
        expect(resolveSource('FACEBOOK', null)).toBe('FACEBOOK');
        expect(resolveSource('HACKER', 'https://www.instagram.com/x')).toBe('INSTAGRAM');
        expect(resolveSource(undefined, null)).toBe('OTRO');
    });
    it('no confunde dominios parecidos con el propio', () => {
        expect(detectSourceFromReferer('https://wylar.cl/otec')).toBe('WEB');
        expect(detectSourceFromReferer('https://www.wylar.cl/otec')).toBe('WEB');
        expect(detectSourceFromReferer('https://evilwylar.cl/')).toBe('OTRO');
    });
});

describe('buildLeadsWhere', () => {
    it('combina filtros y busca en varios campos', () => {
        const where = buildLeadsWhere({ q: 'juan', status: 'NUEVO', source: 'WEB' });
        expect(where.status).toBe('NUEVO');
        expect(where.source).toBe('WEB');
        expect(where.OR).toHaveLength(5);
    });
    it('responsable: sin asignar, número válido y basura', () => {
        expect(buildLeadsWhere({ assignedToId: 'sin-asignar' }).assignedToId).toBeNull();
        expect(buildLeadsWhere({ assignedToId: '7' }).assignedToId).toBe(7);
        expect(buildLeadsWhere({ assignedToId: 'abc' }).assignedToId).toBe(-1);
    });
});

describe('validaciones', () => {
    const valid = { type: 'PERSONA', name: 'Ana Pérez', email: 'ana@correo.cl', phone: '+56912345678' };
    it('lead público: acepta OTEC y rechaza campos gigantes o tipos desconocidos', () => {
        expect(publicLeadSchema.safeParse({ ...valid, type: 'OTEC' }).success).toBe(true);
        expect(publicLeadSchema.safeParse({ ...valid, type: 'XXX' }).success).toBe(false);
        expect(publicLeadSchema.safeParse({ ...valid, name: 'a'.repeat(300) }).success).toBe(false);
        expect(publicLeadSchema.safeParse({ ...valid, email: `${'a'.repeat(300)}@x.cl` }).success).toBe(false);
    });
    it('lead público: el campo trampa se acepta para poder ignorarlo sin delatar el filtro', () => {
        expect(publicLeadSchema.safeParse({ ...valid, website: 'spam.com' }).success).toBe(true);
    });
    it('usuario nuevo: contraseña de al menos 12 caracteres', () => {
        const u = { name: 'Nuevo Usuario', email: 'n@wylar.cl', role: 'COMERCIAL' };
        expect(userSchema.safeParse({ ...u, password: '1234' }).success).toBe(false);
        expect(userSchema.safeParse({ ...u, password: 'una-clave-larga-2026' }).success).toBe(true);
    });
    it('cambio de contraseña: confirmación igual y distinta de la actual', () => {
        const base = { currentPassword: 'actual-clave-2026', newPassword: 'nueva-clave-2026', confirmPassword: 'nueva-clave-2026' };
        expect(changePasswordSchema.safeParse(base).success).toBe(true);
        expect(changePasswordSchema.safeParse({ ...base, confirmPassword: 'otra-clave-2026' }).success).toBe(false);
        expect(changePasswordSchema.safeParse({ ...base, newPassword: 'actual-clave-2026', confirmPassword: 'actual-clave-2026' }).success).toBe(false);
        expect(changePasswordSchema.safeParse({ ...base, newPassword: 'corta', confirmPassword: 'corta' }).success).toBe(false);
    });
    it('banner: el enlace del botón no admite javascript:', () => {
        const slide = { order: 0, active: true, image: '/images/a.jpg', eyebrowLead: 'a', eyebrowAccent: 'b', title: 't', titleHighlight: 'h', description: 'd', ctaLabel: 'x' };
        expect(heroSlideSchema.safeParse({ ...slide, ctaHref: '/catalogo' }).success).toBe(true);
        expect(heroSlideSchema.safeParse({ ...slide, ctaHref: 'javascript:alert(1)' }).success).toBe(false);
        expect(heroSlideSchema.safeParse({ ...slide, ctaHref: '/catalogo', image: 'javascript:x' }).success).toBe(false);
    });
});
