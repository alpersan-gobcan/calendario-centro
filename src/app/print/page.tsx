"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { store, Reservation } from "@/lib/store";

export default function PrintPage() {
  const searchParams = useSearchParams();
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendarDays, setCalendarDays] = useState<{date: Date, isCurrentRange: boolean}[]>([]);

  useEffect(() => {
    store.getReservations().then(setReservations);

    if (startParam && endParam) {
      const start = new Date(startParam);
      const end = new Date(endParam);
      
      // Expandir a semanas completas (Lunes a Domingo) para la cuadrícula
      const calStart = new Date(start);
      const startDay = calStart.getDay(); // 0 es Domingo, 1 es Lunes
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
    
    // Auto print al cargar
    const t = setTimeout(() => {
      window.print();
    }, 800);
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
        {/* Cabecera Días */}
        <div className="grid grid-cols-7 bg-white">
          {dayNames.map(d => (
            <div key={d} className="border-r-[3px] border-b-[3px] border-slate-800 p-2 text-center font-bold text-slate-900 text-sm uppercase bg-slate-100 print:bg-slate-200">
              {d}
            </div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((d, i) => {
            const dateStr = `${d.date.getFullYear()}-${(d.date.getMonth()+1).toString().padStart(2,'0')}-${d.date.getDate().toString().padStart(2,'0')}`;
            const dayReservations = (Array.isArray(reservations) ? reservations : []).filter(r => r.dateStr === dateStr);
            
            return (
              <div key={i} className={`border-r-[3px] border-b-[3px] border-slate-800 min-h-[160px] p-2 flex flex-col ${d.isCurrentRange ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                <div className="text-right font-black text-xl text-slate-700 mb-2">{d.date.getDate()}</div>
                <div className="flex flex-col gap-2 flex-grow">
                  {dayReservations.map(r => (
                    <div key={r.id} className="bg-cyan-50 print:border-2 print:border-cyan-600 border-2 border-cyan-400 rounded-lg p-2 text-xs break-inside-avoid shadow-sm">
                      <div className="font-extrabold text-cyan-900 text-sm leading-tight mb-1">{r.group}</div>
                      <div className="text-cyan-800 font-medium leading-snug">{r.activity}</div>
                      <div className="text-slate-700 mt-2 font-bold bg-white/50 p-1 rounded">🕒 {r.transportDepartureTime} - {r.arrivalTime}</div>
                      {r.needsTransport && <div className="text-slate-700 font-bold mt-1">🚌 Recogida: {r.transportReturnTime}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
