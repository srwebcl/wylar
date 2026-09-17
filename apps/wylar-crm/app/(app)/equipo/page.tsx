import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { TeamManagement } from '@/components/TeamManagement';

export default async function EquipoPage() {
    const currentUser = await requireAdmin();
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

    return <TeamManagement users={users} currentUserId={currentUser.id} />;
}
