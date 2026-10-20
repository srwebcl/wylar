'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import type { SafeUser as User } from '@/lib/safeUser';

export function AppShell({ currentUser, children }: { currentUser: User; children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    // Cierra el menú móvil automáticamente al navegar
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Cierra con la tecla Escape y bloquea scroll cuando está abierto
    useEffect(() => {
        if (!mobileOpen) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setMobileOpen(false);
        }
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [mobileOpen]);

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
            {/* Fondos decorativos con blur suave */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] lg:w-[40%] h-[40%] rounded-full bg-cyan-100/40 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] lg:w-[30%] h-[40%] rounded-full bg-amber-100/40 blur-[100px]"></div>
            </div>

            {/* Backdrop para móvil/tablet */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-[#050B14]/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 animate-fadeIn"
                    aria-label="Cerrar menú de navegación"
                />
            )}

            {/* Sidebar responsivo: cajón deslizante en móvil (<lg), columna fija en desktop (>=lg) */}
            <Sidebar
                currentUser={currentUser}
                isOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            {/* Contenido principal */}
            <div className="flex-1 relative z-10 min-w-0 flex flex-col w-full">
                <TopBar
                    currentUser={currentUser}
                    onToggleMenu={() => setMobileOpen((v) => !v)}
                />
                <main className="p-3.5 sm:p-5 md:p-8 flex-1 min-w-0">
                    <div className="max-w-7xl mx-auto w-full min-w-0">{children}</div>
                </main>
            </div>
        </div>
    );
}
