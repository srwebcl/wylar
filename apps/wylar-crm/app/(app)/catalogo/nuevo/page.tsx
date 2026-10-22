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
                    <ArrowLeft size={14} /> Volver a Fichas Web
                </Link>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nueva ficha web</h1>
                <p className="text-slate-500 text-sm mt-1">Se publicará en wylar.cl apenas quede marcada como Activa y publiques los cambios.</p>
            </div>
            <ProfileWizard />
        </div>
    );
}
