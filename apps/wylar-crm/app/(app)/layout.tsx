import { requireUser } from '@/lib/auth';
import { toSafeUser } from '@/lib/safeUser';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const currentUser = await requireUser();
    const safeUser = toSafeUser(currentUser);

    return <AppShell currentUser={safeUser}>{children}</AppShell>;
}
