import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANT_CLASSES: Record<Variant, string> = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-navy-900 shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200',
};

const SIZE_CLASSES: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
};

const BASE = 'inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap';

interface CommonProps {
    variant?: Variant;
    size?: Size;
    icon?: ReactNode;
    loading?: boolean;
    children: ReactNode;
    className?: string;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & { href: string; target?: string; rel?: string };

/** Botón estandarizado: mismas variantes/tamaños en todo el CRM, ícono y
 * texto siempre alineados igual. Si recibe `href`, se renderiza como
 * next/link (misma apariencia, para acciones de navegación). */
export function Button(props: ButtonProps | LinkProps) {
    const { variant = 'secondary', size = 'md', icon, loading, children, className = '' } = props;
    const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

    if ('href' in props && props.href) {
        const { href, target, rel } = props;
        return (
            <Link href={href} target={target} rel={rel} className={classes}>
                {icon}
                {children}
            </Link>
        );
    }

    const { disabled, ...rest } = props as ButtonProps;
    return (
        <button {...rest} disabled={disabled || loading} className={classes}>
            {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : icon}
            {children}
        </button>
    );
}
