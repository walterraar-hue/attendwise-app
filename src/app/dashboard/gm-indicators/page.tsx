import Header from "@/components/dashboard/header";
import { users } from "@/lib/data";
import { redirect } from "next/navigation";

export default function GeneralManagerIndicatorsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const role = searchParams?.role;

  if (role !== 'admin') {
    redirect(`/dashboard?role=${role || 'manager'}`);
  }

  const currentUser = users.find(u => u.role === 'Global Admin')!;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header user={currentUser} title="Indicadores del Gerente General" />
      </div>
      <div>
        <p>Aquí es donde irán los indicadores para el Gerente General.</p>
      </div>
    </div>
  );
}
