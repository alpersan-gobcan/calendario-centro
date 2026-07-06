import YearlyCalendar from "@/components/YearlyCalendar";
import TodayDetails from "@/components/TodayDetails";

export default function Home() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="text-center space-y-1 max-w-7xl mx-auto py-4 px-4 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Calendario del Centro
        </h2>
        <p className="text-sm sm:text-base text-slate-600">
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
