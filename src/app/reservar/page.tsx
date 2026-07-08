import Calendar from "@/components/Calendar";

export default function ReservarPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="text-center space-y-4 max-w-3xl mx-auto py-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Reservar Actividad
        </h2>
        <p className="text-slate-600">
          Elige un día disponible en el calendario para solicitar tu actividad complementaria o extraescolar.
        </p>
      </section>

      <section className="min-h-[500px]">
        <Calendar />
      </section>
    </div>
  );
}
