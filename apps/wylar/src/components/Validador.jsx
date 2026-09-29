import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, AlertTriangle, Clock, XCircle, Users, Shield, Download } from 'lucide-react';

const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

// Se muestra solo antes de la primera búsqueda (ver !hasSearched más abajo)
// para llenar el espacio con algo útil — no decorativo — en vez de dejar la
// pantalla vacía: el proceso real de validación. Es una secuencia de verdad
// (el paso 2 depende del 1, el 3 del 2), así que se dibuja como una línea de
// tiempo conectada en vez de 3 tarjetas sueltas — ver el bloque más abajo.
const STEPS = [
    { title: 'Ingresa el RUT o el código', text: 'El mismo dato que aparece impreso en el certificado o en su código QR.' },
    { title: 'Lo verificamos al instante', text: 'Se cruza con el registro oficial de certificados emitidos por Wylar.' },
    { title: 'Revisa el resultado', text: 'Vigente, vencido o revocado — con el PDF firmado si corresponde.' },
];

// Vigente y sin vencimiento son el mismo estado visual (verde). Vencido y
// revocado se distinguen: un certificado vencido fue legítimo y expiró por
// tiempo (ámbar), uno revocado fue invalidado activamente (rojo) — son
// situaciones distintas para quien está verificando, así que se marcan
// distinto en vez de agrupar todo lo "no vigente" en un solo rojo.
const STATUS_TONE = {
    VIGENTE: { icon: CheckCircle, bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SIN_VENCIMIENTO: { icon: CheckCircle, bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    VENCIDO: { icon: Clock, bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
    REVOCADO: { icon: XCircle, bar: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200' },
};

export default function Validador() {
    const [query, setQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // El QR del PDF abre /validador?code=WYL-… : se busca automáticamente.
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code && code.trim()) {
            setQuery(code.trim());
            runSearch(code.trim());
        }
    }, []);

    function handleValidate(e) {
        e.preventDefault();
        runSearch(query);
    }

    async function runSearch(rawQuery) {
        if (!rawQuery.trim()) return;

        setIsSearching(true);
        setHasSearched(false);
        setErrorMessage('');

        try {
            const res = await fetch(`${CRM_ORIGIN}/api/public/certificates/validate?q=${encodeURIComponent(rawQuery.trim())}`);
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'No pudimos validar el certificado.');
            setResults(data.results);
        } catch (err) {
            setErrorMessage(err.message || 'No pudimos conectar con el validador. Intenta nuevamente.');
            setResults([]);
        } finally {
            setHasSearched(true);
            setIsSearching(false);
        }
    }

    return (
        <div className="animate-in fade-in duration-500 bg-slate-50 min-h-screen pb-20">
            {/* Cabecera interna — mismo lenguaje visual que PageHero.astro (catálogo,
                ChileValora, contacto): franja baja con barrido de luz en loop y
                entrada escalonada (.hero-sweep/.hero-in-* en global.css). Este
                componente es React, no puede importar un componente .astro, así
                que replica el mismo markup. */}
            <div className="bg-[#050B14] py-5 md:py-6 relative overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 hero-sweep"></div>

                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-5">
                        <h1 className="hero-in-1 text-xl sm:text-2xl md:text-[28px] font-extrabold text-white tracking-tight leading-tight shrink-0">
                            Validador de Certificados
                        </h1>
                        <span className="hero-in-2 hidden sm:block w-px h-8 bg-white/15 shrink-0"></span>
                        <p className="hero-in-3 text-xs sm:text-sm text-white/65 leading-snug max-w-lg">
                            Verifique la autenticidad y vigencia de las certificaciones emitidas por Wylar ingresando el RUT de la persona o el Código del Certificado.
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-500"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 relative z-20">
                <form onSubmit={handleValidate}>
                    <label className="block text-slate-700 font-bold mb-2.5 text-sm" htmlFor="searchInput">
                        Ingresa el RUT de la persona o el código del certificado
                    </label>
                    <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-shadow overflow-hidden">
                        <div className="relative flex-grow flex items-center">
                            <Search className="absolute left-4 text-slate-400" size={20} />
                            <input
                                id="searchInput"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-transparent outline-none text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="Ej: 11.817.652-9 o WYL-2026-K3F9A2"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm sm:text-base py-4 px-6 sm:px-8 transition-colors flex items-center justify-center gap-2.5 disabled:bg-blue-400 shrink-0"
                        >
                            {isSearching ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Buscando
                                </>
                            ) : 'Validar'}
                        </button>
                    </div>
                </form>

                {/* Antes de buscar: cómo funciona, no un vacío. Desaparece en cuanto hay
                    resultados. Los 3 pasos van conectados por una línea (vertical en
                    mobile, horizontal en desktop) porque son una secuencia real, no 3
                    características independientes — el paso 2 depende del 1. */}
                {!hasSearched && (
                    <div className="mt-14 sm:mt-20 sm:grid sm:grid-cols-3 relative">
                        {/* Línea — mobile: vertical a la izquierda. Desktop: horizontal entre los círculos. */}
                        <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200 sm:left-[16.6667%] sm:right-[16.6667%] sm:top-4 sm:bottom-auto sm:w-auto sm:h-px"></div>

                        {STEPS.map((step, i) => (
                            <div key={step.title} className="relative flex gap-4 pb-10 last:pb-0 sm:flex-col sm:items-center sm:text-center sm:px-4 sm:pb-0">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-blue-600 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                                    {i + 1}
                                </div>
                                <div className="sm:mt-4 sm:max-w-[15rem]">
                                    <p className="font-bold text-slate-900 text-sm mb-1">{step.title}</p>
                                    <p className="text-slate-500 text-sm leading-relaxed">{step.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* RESULTADOS */}
                {hasSearched && (
                    <div className="mt-10 sm:mt-12">
                        {errorMessage ? (
                            <div className="border-l-[3px] border-red-400 bg-red-50/60 rounded-r-xl p-5 flex items-start gap-3.5">
                                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-900 text-sm">No pudimos completar la búsqueda</p>
                                    <p className="text-red-700/90 text-sm mt-0.5">{errorMessage}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-slate-900">Resultados de la búsqueda</h3>
                                    <span className="text-slate-500 text-sm font-medium">
                                        {results.length} {results.length === 1 ? 'coincidencia' : 'coincidencias'}
                                    </span>
                                </div>

                                {results.length === 0 ? (
                                    <div className="border-l-[3px] border-red-400 bg-red-50/60 rounded-r-xl p-5 flex items-start gap-3.5">
                                        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-red-900 text-sm">No encontramos ningún certificado</p>
                                            <p className="text-red-700/90 text-sm mt-0.5">Revisa que el RUT o el código estén escritos correctamente. Si el problema persiste, es posible que el certificado no exista en nuestros registros.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {results.map((cert) => {
                                            const tone = STATUS_TONE[cert.status] ?? STATUS_TONE.REVOCADO;
                                            const StatusIcon = tone.icon;
                                            return (
                                                <div key={cert.code} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                                    <div className={`h-[3px] ${tone.bar}`}></div>

                                                    <div className="p-5 sm:p-7">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 pb-6 border-b border-slate-100">
                                                            <div>
                                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1.5">
                                                                    <Shield size={13} /> {cert.categoryLabel}
                                                                </div>
                                                                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">{cert.certificationTitle}</h4>
                                                            </div>
                                                            <div className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 self-start shrink-0 border ${tone.chip}`}>
                                                                <StatusIcon size={14} /> {cert.statusLabel}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-4 text-sm mb-6">
                                                            <div>
                                                                <span className="flex items-center gap-1 text-slate-400 text-xs font-medium mb-1"><Users size={12} /> Titular</span>
                                                                <span className="text-slate-900 font-semibold">{cert.holderName}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-slate-400 text-xs font-medium mb-1">RUT</span>
                                                                <span className="text-slate-900 font-semibold">{cert.holderRut}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-slate-400 text-xs font-medium mb-1">Código</span>
                                                                <span className="text-blue-900 font-mono font-semibold">{cert.code}</span>
                                                            </div>
                                                            <div>
                                                                <span className="block text-slate-400 text-xs font-medium mb-1">Vigencia</span>
                                                                <span className="text-slate-900 font-semibold block">{new Date(cert.issueDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                <span className="text-slate-500 text-xs">{cert.expiryDate ? `hasta ${new Date(cert.expiryDate).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}` : 'Sin fecha de vencimiento'}</span>
                                                            </div>
                                                        </div>

                                                        {cert.pdfUrl && (
                                                            <a
                                                                href={`${CRM_ORIGIN}${cert.pdfUrl}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-2 bg-[#0B1E40] hover:bg-blue-900 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors"
                                                            >
                                                                <Download size={16} /> Descargar certificado (PDF)
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
