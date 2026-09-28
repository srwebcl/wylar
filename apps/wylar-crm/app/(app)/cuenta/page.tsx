import { requireUser } from '@/lib/auth';
import { AccountForm } from '@/components/AccountForm';

export default async function CuentaPage() {
    const user = await requireUser();
    return <AccountForm name={user.name} email={user.email} />;
}
