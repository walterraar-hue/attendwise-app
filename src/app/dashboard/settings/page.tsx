import Header from "@/components/dashboard/header";
import { users } from "@/lib/data";

export default function SettingsPage() {
  const currentUser = users.find(u => u.role === 'Global Admin')!;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header user={currentUser} title="Configuración" />
      </div>
      <div>
        <p>Aquí es donde irían las configuraciones de la aplicación.</p>
      </div>
    </div>
  );
}
