import Header from "@/components/dashboard/header";
import { users } from "@/lib/data";

export default function TeamManagementPage() {
  const currentUser = users.find(u => u.role === 'Global Admin')!;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header user={currentUser} title="Gestión de Equipo" />
      </div>
      <div>
        <p>Aquí es donde irá la gestión de equipos.</p>
      </div>
    </div>
  );
}
