"use client";

import { useState, useEffect } from "react";
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

const getFormatDateStr = (year: number, month: number, day: number) => {
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const getColorClass = (color: string) => {
  switch (color) {
    case 'rose': return 'bg-rose-100 border-rose-300 text-rose-900';
    case 'amber': return 'bg-amber-100 border-amber-300 text-amber-900';
    case 'emerald': return 'bg-emerald-100 border-emerald-300 text-emerald-900';
    case 'purple': return 'bg-purple-100 border-purple-300 text-purple-900';
    default: return 'bg-blue-100 border-blue-300 text-blue-900';
  }
};

const getEventColor = (r: Reservation) => {
    if (r.activity?.toLowerCase().includes("complementaria")) return 'purple';
    if (r.activity?.toLowerCase().includes("extraescolar")) return 'amber';
    return 'blue';
};

export default function ResumenPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [] });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    const load = async () => {
      const res = await store.getReservations();
      const st = await store.getSettings();
      setReservations(res.filter(r => r.status !== 'rejected'));
      setSettings(st);
    };
    load();
  }, []);

  const getEventsForDay = (dateStr: string) => {
    const res = reservations.filter(r => r.dateStr === dateStr);
    const blocks = (settings.blockedDays || []).filter(b => b.dateStr === dateStr);
    const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
    const base = isBaseHidden ? null : specialEvents[dateStr];
    
    return { res, blocks, base };
  };

  const renderEventBadge = (color: string, label: string, title: string, details?: string) => (
    <div className={`p-3 rounded-lg border ${getColorClass(color)} mb-2 shadow-sm`}>
        <div className="text-[10px] font-bold uppercase opacity-70 mb-1">{label}</div>
        <div className="font-bold text-sm">{title}</div>
        {details && <div className="text-xs opacity-80 mt-1">{details}</div>}
    </div>
  );

  const renderEventsForDate = (dateStr: string) => {
    const events = getEventsForDay(dateStr);
    const totalEvents = events.res.length + events.blocks.length + (events.base ? 1 : 0);
    
    if (totalEvents === 0) {
        return <div className="text-sm text-slate-400 italic p-2 bg-slate-50 rounded-lg border border-slate-100 text-center">Sin eventos</div>;
    }

    return (
        <div className="space-y-2">
            {events.base && renderEventBadge(events.base.color, 'Base', events.base.title, events.base.details)}
            {events.blocks.map((b, idx) => renderEventBadge('emerald', 'Bloqueo Manual', b.reason || b.type || 'Bloqueado', undefined))}
            {events.res.map(r => renderEventBadge(getEventColor(r), 'Reserva', r.group, `${r.activity} - ${r.location}`))}
        </div>
    );
  };

  // --- Day logic ---
  const selectedDateStr = getFormatDateStr(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  // --- Week logic ---
  const getWeekDays = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(current.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 5; i++) {
        const nextDay = new Date(monday);
        nextDay.setDate(monday.getDate() + i);
        week.push(nextDay);
    }
    return week;
  };
  const weekDays = getWeekDays(selectedDate);

  // --- Month logic ---
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const jsDay = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfMonth = (jsDay + 6) % 7;
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-black text-slate-800">Vista Resumen</h1>
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">
                Seleccionado: {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
            
            {/* COLUMN 1: DAY */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4 shrink-0">Día: {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</h2>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {renderEventsForDate(selectedDateStr)}
                </div>
            </div>

            {/* COLUMN 2: WEEK */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4 shrink-0">Semana</h2>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {weekDays.map(date => {
                        const dateStr = getFormatDateStr(date.getFullYear(), date.getMonth(), date.getDate());
                        const isSelected = dateStr === selectedDateStr;
                        return (
                            <div key={dateStr} className={`p-4 rounded-xl border ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-100'} bg-white`}>
                                <h3 className={`font-bold capitalize mb-3 text-sm ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                                    {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                                </h3>
                                {renderEventsForDate(dateStr)}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* COLUMN 3: MONTH */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4 shrink-0">Mes</h2>
                
                {/* Mini Calendar */}
                <div className="mb-6 shrink-0">
                    <div className="flex justify-between items-center mb-4 bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <button onClick={() => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1))} className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 w-8 h-8 rounded-md transition">&larr;</button>
                        <span className="font-bold text-sm text-slate-700">{monthNames[currentMonth]} {currentYear}</span>
                        <button onClick={() => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1))} className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 w-8 h-8 rounded-md transition">&rarr;</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2">
                        {["L", "M", "X", "J", "V", "S", "D"].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = getFormatDateStr(currentYear, currentMonth, day);
                            const isSelected = selectedDateStr === dateStr;
                            const events = getEventsForDay(dateStr);
                            const hasEvents = events.res.length > 0 || events.blocks.length > 0 || events.base;
                            
                            let btnClass = "text-sm p-1 rounded-md text-slate-600 aspect-square flex items-center justify-center font-medium border border-transparent";
                            if (isSelected) btnClass = "text-sm p-1 rounded-md bg-blue-600 text-white font-bold aspect-square flex items-center justify-center shadow-md scale-105 transition";
                            else if (hasEvents) btnClass = "text-sm p-1 rounded-md bg-purple-100 text-purple-900 font-bold border border-purple-200 aspect-square flex items-center justify-center hover:bg-purple-200";
                            else btnClass += " hover:bg-slate-100 hover:border-slate-200";

                            return (
                                <button 
                                    key={day} 
                                    onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                                    className={btnClass}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Events of the month */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-3 text-xs border-b border-slate-100 pb-2 sticky top-0 bg-white z-10 pt-1">Eventos de {monthNames[currentMonth]}</h3>
                    <div className="space-y-4">
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = getFormatDateStr(currentYear, currentMonth, day);
                            const events = getEventsForDay(dateStr);
                            const hasEvents = events.res.length > 0 || events.blocks.length > 0 || events.base;
                            
                            if (!hasEvents) return null;
                            
                            return (
                                <div key={dateStr} className="pl-3 border-l-2 border-slate-200">
                                    <div className="text-xs font-bold text-slate-500 mb-2">{day} de {monthNames[currentMonth]}</div>
                                    {renderEventsForDate(dateStr)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 20px;
        }
      `}} />
    </div>
  );
}
