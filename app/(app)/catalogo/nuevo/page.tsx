import { ProfileForm } from '@/components/ProfileForm';

export default function NuevoPerfilPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Nuevo perfil</h1>
                <p className="text-slate-500 text-sm mt-1">Se publicará en wylar.cl apenas quede marcado como Activo.</p>
            </div>
            <ProfileForm />
        </div>
    );
}
