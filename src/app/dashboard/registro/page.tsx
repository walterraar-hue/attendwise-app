import Header from "@/components/dashboard/header";

export default function RegistroPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Header title="Registro" />
      </div>
      <div>
        <p>Aquí es donde irá el contenido de la página de Registro.</p>
      </div>
    </div>
  );
}
