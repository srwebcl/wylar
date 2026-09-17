import React, { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, Users, Shield, Download } from 'lucide-react';

const CRM_ORIGIN = import.meta.env.PUBLIC_CRM_ORIGIN || 'https://wylar-crm.vercel.app';

export default function Validador() {
    const [query, setQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function handleValidate(e) {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setHasSearched(false);
        setErrorMessage('');

        try {
            const res = await fetch(`${CRM_ORIGIN}/api/public/certificates/validate?q=${encodeURIComponent(query.trim())}`);
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
            <div className="bg-[#0f172a] py-24 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
                <div className="max-w-3xl mx-auto px-4 relative z-10 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20">
                        <CheckCircle size={40} className="text-cyan-300" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Validador de Certificados</h1>
                    <p className="text-lg md:text-xl text-slate-300 font-light">Verifique la autenticidad y vigencia de las certificaciones emitidas por Wylar ingresando el RUT de la persona o el Código del Certificado.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20">
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
                                                <div className={`w-full md:w-6 flex md:flex-col items-center justify-center p-2 md:p-0 ${cert.status === 'VIGENTE' ? 'bg-green-500' : 'bg-red-500'}`}>
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
                                                        <div className={`px-5 py-2 rounded-xl font-black text-sm inline-flex items-center gap-2 self-start shadow-sm border ${cert.status === 'VIGENTE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                            {cert.status === 'VIGENTE' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
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

                                                    <a
                                                        href={`${CRM_ORIGIN}${cert.pdfUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 bg-[#0B1E40] hover:bg-blue-900 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-md"
                                                    >
                                                        <Download size={18} /> Descargar Certificado (PDF)
                                                    </a>
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
