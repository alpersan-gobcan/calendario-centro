"use client";

import { Reservation, Settings } from "@/lib/store";

const specialEvents: Record<string, { title: string, details: string, color: string }> = {
  "2026-09-08": { title: "Día del Pino", details: "Festivo Día del Pino.", color: "rose" },
  "2026-09-10": { title: "Presentación 1º ESO", details: "Presentación y taller formativo 1º ESO.", color: "amber" },
  "2026-09-11": { title: "Presentación Bach", details: "Presentación 1º y 2º Bachillerato.", color: "amber" },
  "2026-09-16": { title: "Presentación FP", details: "Presentación Ciclos Formativos.", color: "amber" },
  "2026-09-30": { title: "Visita de Familias", details: "Asamblea general.", color: "amber" },
  "2026-10-12": { title: "Fiesta Nacional", details: "Festivo.", color: "rose" },
  "2026-10-15": { title: "Erasmus", details: "Erasmus Days.", color: "purple" },
  "2026-10-30": { title: "Finaos", details: "Día de los Finaos.", color: "amber" },
  "2026-11-02": { title: "Todos los Santos", details: "Festivo.", color: "rose" },
  "2026-12-07": { title: "Puente", details: "Puente de la Constitución.", color: "emerald" },
  "2026-12-08": { title: "Inmaculada", details: "Festivo.", color: "rose" },
  "2026-12-18": { title: "Navideña", details: "Jornada Navideña.", color: "amber" },
  "2027-01-28": { title: "Día de la Paz", details: "Día de la paz.", color: "amber" },
  "2027-01-29": { title: "Día de la Paz", details: "Día de la paz.", color: "amber" },
  "2027-02-16": { title: "Carnaval", details: "Festivo en Santa Lucía.", color: "rose" },
  "2027-02-17": { title: "Libre disp.", details: "Libre disposición.", color: "emerald" },
  "2027-02-18": { title: "Libre disp.", details: "Libre disposición.", color: "emerald" },
  "2027-04-30": { title: "Libre disp.", details: "Libre disposición.", color: "emerald" },
  "2027-05-01": { title: "Trabajador", details: "Festivo Día del Trabajador.", color: "rose" },
  "2027-05-28": { title: "Día de Canarias", details: "Festivo Día de Canarias.", color: "rose" },
  "2027-05-29": { title: "Libre disp.", details: "Libre disposición.", color: "emerald" },
};

function getWeekDates(date: Date) {
  const current = new Date(date);
  const week = [];
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  for (let i = 0; i < 7; i++) {
    week.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return week;
}

export default function ThisWeekDetails({ initialReservations = [], initialSettings = { minDaysNotice: 7, blockedDays: [] } }: { initialReservations?: Reservation[], initialSettings?: Settings }) {
  const reservations = initialReservations;
  const settings = initialSettings;

  const today = new Date();
  const weekDates = getWeekDates(today);
  const safeReservations = Array.isArray(reservations) ? reservations.filter(r => r.status !== 'rejected') : [];

  const weekEvents = weekDates.map(date => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
    const dayEvent = isBaseHidden ? undefined : specialEvents[dateStr];
    const adminBlock = settings.blockedDays?.find(b => b.dateStr === dateStr);
    const dayReservations = safeReservations.filter(r => r.dateStr.includes(dateStr));
    
    return {
      date,
      dateStr,
      dayEvent,
      adminBlock,
      dayReservations
    };
  }).filter(day => day.dayEvent || day.adminBlock || day.dayReservations.length > 0);

  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-sm border border-emerald-100 mb-6 w-full max-w-7xl mx-auto px-4 lg:px-8">
      <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 capitalize">Semana en Curso</h3>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
        {weekEvents.length > 0 ? (
          weekEvents.map(({ date, dateStr, dayEvent, adminBlock, dayReservations }) => (
            <div key={dateStr} className="min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-200 p-4 snap-start border-t-4 border-t-emerald-400 shadow-sm">
              <h4 className="text-md font-semibold text-slate-700 capitalize mb-3 pb-2 border-b border-slate-200">
                {date.toLocaleDateString('es-ES', options)}
              </h4>
              
              <div className="space-y-3 flex-grow overflow-y-auto pr-1 custom-scrollbar" style={{ maxHeight: '400px' }}>
                {/* Eventos especiales */}
                {dayEvent && (
                  <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                     <div className="text-lg leading-none mt-0.5">🗓️</div>
                     <div>
                       <p className="font-bold text-amber-900 text-sm leading-tight">{dayEvent.title}</p>
                       <p className="text-xs text-amber-800 mt-1">{dayEvent.details}</p>
                     </div>
                  </div>
                )}

                {/* Bloqueos de admin */}
                {adminBlock && (
                  <div className="flex items-start gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
                     <div className="text-lg leading-none mt-0.5">🛑</div>
                     <div>
                       <p className="font-bold text-rose-900 text-sm leading-tight">Bloqueado</p>
                       <p className="text-xs text-rose-800 mt-1">{adminBlock.reason}</p>
                     </div>
                  </div>
                )}

                {/* Reservas */}
                {dayReservations.length > 0 && (
                  <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                     <div className="text-lg leading-none mt-0.5">🚌</div>
                     <div className="w-full">
                       <div className="space-y-2">
                         {dayReservations.map(r => (
                           <div key={r.id} className="bg-white p-2 rounded-lg border border-blue-200 shadow-sm">
                             <p className="font-bold text-slate-800 text-xs leading-tight">{r.group} - {r.activity}</p>
                             <p className="text-[11px] text-slate-600 mt-1">Por {r.name} ({r.studentsCount} alumnos)</p>
                           </div>
                         ))}
                       </div>
                     </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3 w-full">
             <div className="text-2xl">📅</div>
             <p className="text-slate-600 font-medium">No hay eventos ni actividades programadas para esta semana.</p>
          </div>
        )}
      </div>
    </div>
  );
}
