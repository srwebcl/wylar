import { HeroSlideForm } from '@/components/HeroSlideForm';

export default function NuevoHeroSlidePage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Nuevo slide del hero</h1>
                <p className="text-slate-500 text-sm mt-1">Recuerda publicar los cambios en wylar.cl desde el listado una vez que termines.</p>
            </div>
            <HeroSlideForm />
        </div>
    );
}
