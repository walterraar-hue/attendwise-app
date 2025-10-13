import Header from "@/components/dashboard/header";

export default function GeneralManagerIndicatorsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header title="Indicadores del Gerente General" />
      </div>
      <div>
        <p>Aquí es donde irán los indicadores para el Gerente General.</p>
      </div>
    </div>
  );
}
