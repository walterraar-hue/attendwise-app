import Header from "@/components/dashboard/header";

export default function MyHistoryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header title="Mi Historial" />
      </div>
      <div>
        <p>Aquí es donde irá tu historial de asistencia.</p>
      </div>
    </div>
  );
}
