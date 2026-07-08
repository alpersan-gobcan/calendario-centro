"use client";

import { useState } from "react";
import { Reservation, Settings } from "@/lib/store";

// Copia de specialEvents para no depender de otros archivos
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

// Vacaciones borradas a petición del usuario.

export default function AdminCalendar({ 
  reservations, 
  settings, 
  onDeleteReservation, 
  onDeleteBlock, 
  onHideBaseEvent,
  selectedDates,
  onToggleDate
}: { 
  reservations: Reservation[], 
  settings: Settings, 
  onDeleteReservation: (id: string) => void, 
  onDeleteBlock: (id: string) => void, 
  onHideBaseEvent: (dateStr: string) => void,
  selectedDates?: string[],
  onToggleDate?: (dateStr: string) => void
}) {
  const today = new Date();
  const currentMonthIdx = today.getMonth();
  const currentYearActual = today.getFullYear();
  const schoolYearStart = currentMonthIdx < 6 ? currentYearActual - 1 : currentYearActual;

  const [currentDate, setCurrentDate] = useState(new Date(schoolYearStart, 8, 1));
  const [localSelectedDate, setLocalSelectedDate] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const jsDay = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfMonth = (jsDay + 6) % 7;

  const getFormatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const getEventsForDay = (dateStr: string) => {
    const safeReservations = Array.isArray(reservations) ? reservations.filter(r => r.status !== 'rejected') : [];
    const res = safeReservations.filter(r => r.dateStr.includes(dateStr));
    const blocks = (settings.blockedDays || []).filter(b => b.dateStr === dateStr);
    const base = specialEvents[dateStr];
    const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
    return { 
      res, 
      blocks, 
      base: isBaseHidden ? null : base,
      hasAny: res.length > 0 || blocks.length > 0 || (!isBaseHidden && base)
    };
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const handleDateClick = (dateStr: string) => {
    setLocalSelectedDate(dateStr);
    if (onToggleDate) {
      onToggleDate(dateStr);
    }
  };

  const selectedEvents = localSelectedDate ? getEventsForDay(localSelectedDate) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
        <button 
          onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
          className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition"
        >
          &larr;
        </button>
        <h3 className="font-bold text-slate-800 text-base">{monthNames[currentMonth]} {currentYear}</h3>
        <button 
          onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
          className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition"
        >
          &rarr;
        </button>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
          {["L", "M", "X", "J", "V", "S", "D"].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getFormatDateStr(currentYear, currentMonth, day);
            const events = getEventsForDay(dateStr);
            const isSelected = selectedDates ? selectedDates.includes(dateStr) : localSelectedDate === dateStr;
            const isWeekend = (firstDayOfMonth + i) % 7 >= 5;
            
            let bgClass = "bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium";
            if (isSelected) bgClass = "bg-slate-800 text-white shadow-inner font-bold scale-105";
            else if (events.hasAny) bgClass = "bg-purple-200 text-purple-900 font-bold border-purple-300 shadow-sm";
            else if (isWeekend) bgClass = "bg-slate-50 text-slate-400";
            
            return (
              <button
                key={day}
                onClick={() => handleDateClick(dateStr)}
                className={`aspect-square flex items-center justify-center rounded-lg border border-slate-200 text-sm transition ${bgClass}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {localSelectedDate && selectedEvents && selectedEvents.hasAny && (
        <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-3">
          <p className="font-bold text-slate-700 mb-2">{new Date(localSelectedDate).toLocaleDateString()}</p>
          
          {selectedEvents.base && (
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="truncate pr-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Base</p>
                <p className="font-bold text-slate-800 text-sm truncate">{selectedEvents.base.title}</p>
              </div>
              <button 
                onClick={() => {
                  if(confirm("¿Ocultar evento base?")) {
                    onHideBaseEvent(localSelectedDate);
                  }
                }} 
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200 transition shrink-0"
              >
                Borrar
              </button>
            </div>
          )}

          {selectedEvents.blocks.map(b => (
            <div key={b.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="truncate pr-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Manual</p>
                <p className="font-bold text-slate-800 text-sm truncate">{b.reason || b.type}</p>
              </div>
              <button 
                onClick={() => {
                  if(confirm("¿Borrar bloqueo manual?")) {
                    onDeleteBlock(b.id);
                  }
                }} 
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200 transition shrink-0"
              >
                Borrar
              </button>
            </div>
          ))}

          {selectedEvents.res.map(r => (
            <div key={r.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <div className="truncate pr-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Reserva</p>
                <p className="font-bold text-slate-800 text-sm truncate">{r.group}</p>
              </div>
              <button 
                onClick={() => {
                  if(confirm("¿Borrar reserva?")) {
                    onDeleteReservation(r.id);
                  }
                }} 
                className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200 transition shrink-0"
              >
                Borrar
              </button>
            </div>
          ))}

        </div>
      )}
      
      {selectedDate && selectedEvents && !selectedEvents.hasAny && (
         <div className="border-t border-slate-200 p-4 bg-slate-50 text-center">
            <p className="text-sm text-slate-500">Sin eventos este día.</p>
         </div>
      )}
    </div>
  );
}
