"use client";

import { useState, useEffect } from "react";
import { store, Reservation, Settings } from "@/lib/store";

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

// Vacaciones borradas a petición del usuario.

export default function TodayDetails() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      store.getReservations(),
      store.getSettings()
    ]).then(([res, set]) => {
      setReservations(res);
      setSettings(set);
      setIsLoading(false);
    });
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
  const todayEvent = isBaseHidden ? undefined : specialEvents[dateStr];
  const adminBlock = settings.blockedDays?.find(b => b.dateStr === dateStr);
  const safeReservations = Array.isArray(reservations) ? reservations.filter(r => r.status !== 'rejected') : [];
  const todayReservations = safeReservations.filter(r => r.dateStr.includes(dateStr));
  
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('es-ES', options);

  if (isLoading) {
    return (
      <div className="bg-white p-6 sm:p-10 lg:p-14 rounded-3xl shadow-sm border border-blue-100 mb-12 w-full max-w-7xl mx-auto px-4 lg:px-8 flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-10 lg:p-14 rounded-3xl shadow-sm border border-blue-100 mb-12 w-full max-w-7xl mx-auto px-4 lg:px-8">
      <h3 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-8 capitalize">Hoy, {formattedDate}</h3>
      <div className="space-y-4">
        
        {/* Eventos especiales */}
        {todayEvent && (
          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
             <div className="text-2xl">🗓️</div>
             <div>
               <p className="font-bold text-amber-900 text-lg">{todayEvent.title}</p>
               <p className="text-amber-800">{todayEvent.details}</p>
             </div>
          </div>
        )}

        {/* Bloqueos de admin */}
        {adminBlock && (
          <div className="flex items-start gap-3 bg-rose-50 p-4 rounded-xl border border-rose-100">
             <div className="text-2xl">🛑</div>
             <div>
               <p className="font-bold text-rose-900 text-lg">Día Significativo / Bloqueado</p>
               <p className="text-rose-800">{adminBlock.reason}</p>
             </div>
          </div>
        )}

        {/* Reservas */}
        {todayReservations.length > 0 ? (
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div className="text-2xl">🚌</div>
             <div className="w-full">
               <p className="font-bold text-blue-900 text-lg mb-2">Salidas Programadas Hoy</p>
               <div className="space-y-3">
                 {todayReservations.map(r => (
                   <div key={r.id} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                     <p className="font-bold text-slate-800">{r.group} - {r.activity}</p>
                     <p className="text-sm text-slate-600 mt-1">Alumnos: {r.studentsCount} | Docentes: {r.name} {r.otherTeachers ? `, ${r.otherTeachers}` : ''}</p>
                     <p className="text-sm text-slate-600 mt-1">Salida centro: {r.transportDepartureTime} | Llegada est.: {r.arrivalTime}</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        ) : (
          !todayEvent && !adminBlock && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
               <div className="text-2xl">📅</div>
               <p className="text-slate-600 font-medium">No hay eventos ni salidas programadas para el día de hoy.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
