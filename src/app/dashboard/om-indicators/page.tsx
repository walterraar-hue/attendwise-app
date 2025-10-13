import Header from "@/components/dashboard/header";
import { users } from "@/lib/data";

export default function OperationsManagerIndicatorsPage() {
  const currentUser = users.find(u => u.role === 'Manager')!;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header user={currentUser} title="Indicadores del Gerente de Operaciones" />
      </div>
      <div>
        <p>Aquí es donde irán los indicadores para el Gerente de Operaciones.</p>
      </div>
    </div>
  );
}
