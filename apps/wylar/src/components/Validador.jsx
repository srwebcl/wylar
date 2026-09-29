import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, AlertTriangle, Users, Shield, Download } from 'lucide-react';

const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

// Marcas radiales del sello del hero — idénticas a PageHero.astro (ver ese
// archivo para la explicación del diseño). Módulo, no useMemo: son estáticas.
// Coordenadas a 1 decimal (SVG liviano).
const round = (n) => Math.round(n * 10) / 10;
const SEAL_TICKS = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * 2 * Math.PI - Math.PI / 2;
    const [r1, r2] = [86, 94];
    return {
        x1: round(100 + r1 * Math.cos(angle)),
        y1: round(100 + r1 * Math.sin(angle)),
        x2: round(100 + r2 * Math.cos(angle)),
        y2: round(100 + r2 * Math.sin(angle)),
        accent: i === 0,
    };
});

// Solo vigente o sin vencimiento es válido; vencido y revocado se muestran en rojo.
const isValid = (cert) => cert.status === 'VIGENTE' || cert.status === 'SIN_VENCIMIENTO';

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
                ChileValora, contacto): anillo de sello de verificación en vez de un
                gradiente abstracto, girando lento (.hero-seal en global.css). Este
                componente es React, no puede importar un componente .astro, así
                que replica el mismo anillo (ver SEAL_TICKS arriba). */}
            <div
                className="bg-[#050B14] pt-16 pb-12 md:pt-24 md:pb-16 relative overflow-hidden border-b border-white/10"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), 50% 100%, 0 calc(100% - 20px))' }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_82%_0%,rgba(34,211,238,0.12),transparent_65%)]"></div>

                {/* El giro se anima en el div envolvente, no en el <svg> (ver nota
                    en PageHero.astro: varios navegadores no aceleran por
                    hardware transforms CSS sobre el propio elemento SVG). */}
                <div className="hero-seal absolute -top-14 -right-14 md:-top-16 md:-right-10 w-[240px] h-[240px] md:w-[320px] md:h-[320px] pointer-events-none">
                    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
                        <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(125,211,252,0.22)" strokeWidth="1" />
                        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(125,211,252,0.14)" strokeWidth="1" />
                        {SEAL_TICKS.map((t, i) => (
                            <line
                                key={i}
                                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                stroke={t.accent ? '#F59E0B' : 'rgba(226,240,255,0.3)'}
                                strokeWidth={t.accent ? 2 : 1}
                                strokeLinecap="round"
                            />
                        ))}
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="max-w-2xl">
                        <h1 className="font-serif font-semibold text-3xl sm:text-4xl md:text-5xl text-[#F5F8FC] tracking-tight leading-[1.05]">
                            Validador de Certificados
                        </h1>
                        <div className="flex items-center gap-2 my-4">
                            <span className="h-px w-12 md:w-16 bg-cyan-300/40"></span>
                            <span className="w-1.5 h-1.5 bg-amber-400"></span>
                        </div>
                        <p className="text-sm md:text-base text-white/70 font-normal leading-relaxed max-w-lg">
                            Verifique la autenticidad y vigencia de las certificaciones emitidas por Wylar ingresando el RUT de la persona o el Código del Certificado.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 relative z-20">
                <form onSubmit={handleValidate} className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 animate-in zoom-in-95 duration-700 delay-200">
                    <label className="block text-slate-700 font-black mb-4 text-lg" htmlFor="searchInput">
                        Ingrese RUT o Código de Certificado
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Search className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
                            </div>
                            <input
                                id="searchInput"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-xl font-medium"
                                placeholder="Ej: 11.817.652-9 o WYL-2026-K3F9A2"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-black text-lg py-5 px-10 rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(29,78,216,0.6)] hover:shadow-[0_12px_25px_-6px_rgba(29,78,216,0.8)] flex items-center justify-center gap-3 disabled:bg-blue-400 disabled:shadow-none min-w-[200px]"
                        >
                            {isSearching ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Buscando...
                                </>
                            ) : 'Validar Ahora'}
                        </button>
                    </div>
                </form>

                {/* RESULTADOS */}
                {hasSearched && (
                    <div className="mt-16 animate-in slide-in-from-bottom-8 duration-700">
                        {errorMessage ? (
                            <div className="bg-red-50 border border-red-100 text-red-800 p-8 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left shadow-lg shadow-red-900/5">
                                <div className="bg-red-100 p-4 rounded-full flex-shrink-0">
                                    <AlertTriangle size={36} className="text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl mb-2">No pudimos completar la búsqueda</h4>
                                    <p className="text-red-700/80 text-lg">{errorMessage}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-8">
                                    <h3 className="text-2xl font-black text-slate-900">Resultados de la búsqueda</h3>
                                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full font-bold text-sm">
                                        {results.length} encontrado{results.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {results.length === 0 ? (
                                    <div className="bg-red-50 border border-red-100 text-red-800 p-8 rounded-[2rem] flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left shadow-lg shadow-red-900/5">
                                        <div className="bg-red-100 p-4 rounded-full flex-shrink-0">
                                            <AlertTriangle size={36} className="text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xl mb-2">No se encontraron resultados</h4>
                                            <p className="text-red-700/80 text-lg">Verifique que el RUT o Código esté escrito correctamente. Si el problema persiste, es posible que el certificado no exista en nuestros registros.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {results.map((cert) => (
                                            <div key={cert.code} className="bg-white rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col md:flex-row transform hover:-translate-y-1 transition-transform duration-300">
                                                <div className={`w-full md:w-6 flex md:flex-col items-center justify-center p-2 md:p-0 ${isValid(cert) ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    <span className="md:-rotate-90 text-white font-black tracking-widest text-xs uppercase opacity-90 whitespace-nowrap">{cert.statusLabel}</span>
                                                </div>

                                                <div className="p-8 md:p-10 flex-grow">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                                                        <div>
                                                            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 bg-blue-50 px-3 py-1 rounded-full">
                                                                <Shield size={14} /> {cert.categoryLabel}
                                                            </div>
                                                            <h4 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{cert.certificationTitle}</h4>
                                                        </div>
                                                        <div className={`px-5 py-2 rounded-xl font-black text-sm inline-flex items-center gap-2 self-start shadow-sm border ${isValid(cert) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                            {isValid(cert) ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                                            {cert.statusLabel.toUpperCase()}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6 text-sm mb-8">
                                                        <div>
                                                            <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={14} /> Titular</span>
                                                            <span className="text-slate-900 font-bold text-lg">{cert.holderName}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">RUT</span>
                                                            <span className="text-slate-900 font-bold text-lg">{cert.holderRut}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Código</span>
                                                            <span className="text-blue-900 font-mono font-bold bg-blue-50 px-3 py-1 rounded-lg text-lg border border-blue-100">{cert.code}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Período de Vigencia</span>
                                                            <span className="text-slate-900 font-bold text-base block">{new Date(cert.issueDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                            <span className="text-slate-500 font-medium text-sm">{cert.expiryDate ? `hasta ${new Date(cert.expiryDate).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}` : 'Sin fecha de vencimiento'}</span>
                                                        </div>
                                                    </div>

                                                    {cert.pdfUrl && (
                                                    <a
                                                            href={`${CRM_ORIGIN}${cert.pdfUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 bg-[#0B1E40] hover:bg-blue-900 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-md"
                                                        >
                                                            <Download size={18} /> Descargar Certificado (PDF)
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
