import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileWizard } from '@/components/ProfileWizard';

export default function NuevoPerfilPage() {
    return (
        <div>
            <div className="mb-6">
                <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0B1E40] transition-colors mb-2"
                >
                    <ArrowLeft size={14} /> Volver al Catálogo
                </Link>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nuevo perfil</h1>
                <p className="text-slate-500 text-sm mt-1">Se publicará en wylar.cl apenas quede marcado como Activo y publiques los cambios.</p>
            </div>
            <ProfileWizard />
        </div>
    );
}
