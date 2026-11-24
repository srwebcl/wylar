// Páginas reales de wylar.cl — lista centralizada para no repetirla a mano
// en cada selector (pop-ups hoy; útil también si se migra el selector de
// HeroSlideForm más adelante). No incluye /cookies ni /politicas-privacidad:
// no tiene sentido dirigir tráfico promocional ni mostrar pop-ups ahí.
export const SITE_PAGES = [
    { label: 'Inicio', value: '/' },
    { label: 'Catálogo', value: '/catalogo' },
    { label: 'Personas', value: '/personas' },
    { label: 'Empresas', value: '/empresas' },
    { label: 'OTEC', value: '/otec' },
    { label: 'Instituciones de Educación', value: '/instituciones' },
    { label: 'Sobre ChileValora', value: '/chilevalora' },
    { label: 'Contacto', value: '/contacto' },
    { label: 'Validador de Certificados', value: '/validador' },
] as const;
