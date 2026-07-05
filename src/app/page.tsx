import YearlyCalendar from "@/components/YearlyCalendar";
import TodayDetails from "@/components/TodayDetails";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="text-center space-y-4 max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Calendario del Centro
        </h2>
        <p className="text-lg text-slate-600">
          Vista general del curso. Haz clic en los días marcados para ver más información.
        </p>
      </section>

      <section>
        <TodayDetails />
      </section>

      <section>
        <YearlyCalendar />
      </section>
    </div>
  );
}
