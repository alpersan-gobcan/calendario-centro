"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { store, Reservation, Settings } from "@/lib/store";

const specialEvents: Record<string, { title: string, details: string, blockReservation?: boolean, color: string }> = {
  "2026-09-08": { title: "Día del Pino", details: "Festivo Día del Pino.", blockReservation: true, color: "rose" },
  "2026-09-10": { title: "Presentación 1º ESO", details: "Presentación y taller formativo 1º ESO. Presentaciones 2º, 3º, 4º ESO + 1º y 2 PDC.", color: "amber" },
  "2026-09-11": { title: "Presentación Bachillerato", details: "Presentación 1º y 2º Bachillerato.", color: "amber" },
  "2026-09-16": { title: "Presentación CFGB y CFGM", details: "Presentación Ciclos Formativos.", color: "amber" },
  "2026-09-30": { title: "Visita de Familias", details: "Asamblea general por tutorías.", color: "amber" },
  "2026-10-12": { title: "Fiesta Nacional", details: "Festivo. Fiesta Nacional de España.", blockReservation: true, color: "rose" },
  "2026-10-15": { title: "Erasmus Days", details: "Celebración de los Erasmus Days.", color: "purple" },
  "2026-10-30": { title: "Día de los Finaos", details: "Día de los Finaos / Halloween.", color: "amber" },
  "2026-11-02": { title: "Todos los Santos", details: "Día de todos los Santos.", blockReservation: true, color: "rose" },
  "2026-12-07": { title: "Puente Constitución", details: "Puente de la Constitución.", blockReservation: true, color: "emerald" },
  "2026-12-08": { title: "Día Inmaculada", details: "Festivo Día de la Inmaculada Concepción.", blockReservation: true, color: "rose" },
  "2026-12-18": { title: "Jornada Navideña", details: "Jornada Navideña en horario de tarde.", color: "amber" },
  "2027-01-28": { title: "Día de la Paz", details: "Día de la no violencia y la paz.", color: "amber" },
  "2027-01-29": { title: "Día de la Paz", details: "Día de la no violencia y la paz.", color: "amber" },
  "2027-02-16": { title: "Martes de Carnaval", details: "Festivo en Santa Lucía.", blockReservation: true, color: "rose" },
  "2027-02-17": { title: "Libre disposición", details: "Día de libre disposición (Carnaval).", blockReservation: true, color: "emerald" },
  "2027-02-18": { title: "Libre disposición", details: "Día de libre disposición (Carnaval).", blockReservation: true, color: "emerald" },
  "2027-04-30": { title: "Libre disposición", details: "Día de libre disposición.", blockReservation: true, color: "emerald" },
  "2027-05-01": { title: "Día del Trabajador", details: "Festivo Día del Trabajador.", blockReservation: true, color: "rose" },
  "2027-05-28": { title: "Día de Canarias", details: "Festivo Día de Canarias.", blockReservation: true, color: "rose" },
  "2027-05-29": { title: "Libre disposición", details: "Día de libre disposición.", blockReservation: true, color: "emerald" },
};

function PrintContent() {
  const searchParams = useSearchParams();
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] });
  const [calendarDays, setCalendarDays] = useState<{date: Date, isCurrentRange: boolean}[]>([]);

  useEffect(() => {
    Promise.all([
      store.getReservations(),
      store.getSettings()
    ]).then(([res, set]) => {
      setReservations(res);
      setSettings(set);
    });

    if (startParam && endParam) {
      const start = new Date(startParam);
      const end = new Date(endParam);
      
      const calStart = new Date(start);
      const startDay = calStart.getDay(); 
      const startOffset = startDay === 0 ? 6 : startDay - 1;
      calStart.setDate(calStart.getDate() - startOffset);

      const calEnd = new Date(end);
      const endDay = calEnd.getDay();
      const endOffset = endDay === 0 ? 0 : 7 - endDay;
      calEnd.setDate(calEnd.getDate() + endOffset);

      const days = [];
      let current = new Date(calStart);
      while (current <= calEnd) {
        days.push({
          date: new Date(current),
          isCurrentRange: current >= start && current <= end
        });
        current.setDate(current.getDate() + 1);
      }
      setCalendarDays(days);
    }
    
    const t = setTimeout(() => {
      window.print();
    }, 1200);
    return () => clearTimeout(t);
  }, [startParam, endParam]);

  if (!startParam || !endParam) return <div className="p-8">Faltan parámetros de fecha.</div>;

  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0 font-sans">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold uppercase tracking-widest text-slate-900">Calendario de Salidas</h1>
        <p className="text-xl text-slate-600 font-semibold mt-2">
          {new Date(startParam).toLocaleDateString()} - {new Date(endParam).toLocaleDateString()}
        </p>
      </div>

      <div className="w-full border-t-[3px] border-l-[3px] border-slate-800 bg-slate-800 gap-[2px] grid grid-cols-1">
        <div className="grid grid-cols-7 bg-white">
          {dayNames.map(d => (
            <div key={d} className="border-r-[3px] border-b-[3px] border-slate-800 p-2 text-center font-bold text-slate-900 text-sm uppercase bg-slate-100 print:bg-slate-200">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((d, i) => {
            const dateStr = `${d.date.getFullYear()}-${(d.date.getMonth()+1).toString().padStart(2,'0')}-${d.date.getDate().toString().padStart(2,'0')}`;
            const dayReservations = (Array.isArray(reservations) ? reservations : []).filter(r => r.dateStr.split(',').includes(dateStr));
            const dayBlocks = (settings.blockedDays || []).filter(b => b.dateStr === dateStr);
            const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
            const baseEvent = !isBaseHidden ? specialEvents[dateStr] : null;
            
            return (
              <div key={i} className={`border-r-[3px] border-b-[3px] border-slate-800 min-h-[160px] p-2 flex flex-col ${d.isCurrentRange ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                <div className="text-right font-black text-xl text-slate-700 mb-2">{d.date.getDate()}</div>
                <div className="flex flex-col gap-2 flex-grow">
                  
                  {/* Evento Base Hardcodeado */}
                  {baseEvent && (
                    <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-1.5 text-[10px] sm:text-xs break-inside-avoid shadow-sm overflow-hidden break-words">
                      <div className="font-extrabold text-slate-900 text-[11px] sm:text-sm mb-0.5 leading-tight">{baseEvent.title}</div>
                      <div className="text-slate-700 font-medium leading-tight">{baseEvent.details}</div>
                    </div>
                  )}

                  {/* Bloqueos Manuales / Excel */}
                  {dayBlocks.map(b => (
                    <div key={b.id} className="bg-rose-50 border-2 border-rose-400 rounded-lg p-1.5 text-[10px] sm:text-xs break-inside-avoid shadow-sm overflow-hidden break-words">
                      <div className="font-extrabold text-rose-900 text-[11px] sm:text-sm mb-0.5 leading-tight">{b.type || "Bloqueado"}</div>
                      <div className="text-rose-800 font-medium leading-tight">{b.reason}</div>
                    </div>
                  ))}

                  {/* Reservas */}
                  {dayReservations.map(r => {
                    const isConfirmed = r.status === "confirmed";
                    const bgColor = isConfirmed ? "bg-cyan-50" : "bg-slate-50";
                    const borderColor = isConfirmed ? "border-cyan-400 print:border-cyan-600" : "border-slate-300 print:border-slate-400";
                    const titleColor = isConfirmed ? "text-cyan-900" : "text-slate-800";
                    const subColor = isConfirmed ? "text-cyan-800" : "text-slate-700";
                    
                    return (
                      <div key={r.id} className={`${bgColor} border-2 ${borderColor} rounded-lg p-1.5 text-[10px] sm:text-xs break-inside-avoid shadow-sm overflow-hidden break-words`}>
                        <div className={`font-extrabold ${titleColor} text-[11px] sm:text-sm leading-tight mb-0.5`}>{r.group}</div>
                        <div className={`${subColor} font-medium leading-tight mb-1`}>{r.activity} {isConfirmed ? "" : "(Pendiente)"}</div>
                        <div className="text-slate-600 font-medium leading-tight mb-0.5">👤 {r.name} ({r.studentsCount} alu)</div>
                        {r.otherTeachers && <div className="text-slate-600 font-medium leading-tight mb-0.5">👥 {r.otherTeachers}</div>}
                        
                        <div className="text-slate-700 mt-1 font-bold bg-white/50 p-1 rounded text-[9px] sm:text-[10px] leading-tight">🕒 {r.transportDepartureTime || "Salida"} - {r.arrivalTime}</div>
                        {r.needsTransport && <div className="text-slate-700 font-bold mt-0.5 text-[9px] sm:text-[10px] leading-tight">🚌 {r.transportReturnTime}</div>}
                        {r.notes && <div className="text-slate-600 font-medium mt-1 bg-white p-1 rounded text-[9px] sm:text-[10px] leading-tight break-words">📝 {r.notes}</div>}
                      </div>
                    );
                  })}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando vista de impresión...</div>}>
      <PrintContent />
    </Suspense>
  );
}
