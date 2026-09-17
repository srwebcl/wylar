import { requireUser } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const currentUser = await requireUser();

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-100/40 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-amber-100/40 blur-[100px]"></div>
            </div>

            <Sidebar currentUser={currentUser} />

            <div className="flex-1 relative z-10 min-w-0">
                <main className="p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
