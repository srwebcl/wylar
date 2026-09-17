/** Logo oficial de Wylar (blanco), el mismo archivo que usa el sitio público en el footer. */
export function Logo({ width = 140, className }: { width?: number; className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo-wylar.webp" alt="Wylar" style={{ width, height: 'auto' }} className={className} />
    );
}
