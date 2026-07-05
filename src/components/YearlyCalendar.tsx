"use client";

import { useState, useEffect } from "react";
import { store, Reservation, Settings } from "@/lib/store";

// Mismos días especiales
const specialEvents: Record<string, { title: string, details: string, blockReservation?: boolean, color: string, type: string }> = {
  "2026-09-08": { title: "Día del Pino", details: "Festivo Día del Pino.", blockReservation: true, color: "rose", type: "festivo" },
  "2026-09-10": { title: "Presentación 1º ESO", details: "Presentación y taller formativo 1º ESO.", color: "amber", type: "efemeride" },
  "2026-09-11": { title: "Presentación Bach", details: "Presentación 1º y 2º Bachillerato.", color: "amber", type: "efemeride" },
  "2026-09-16": { title: "Presentación FP", details: "Presentación Ciclos Formativos.", color: "amber", type: "efemeride" },
  "2026-09-30": { title: "Visita de Familias", details: "Asamblea general.", color: "amber", type: "efemeride" },
  "2026-10-12": { title: "Fiesta Nacional", details: "Festivo.", blockReservation: true, color: "rose", type: "festivo" },
  "2026-10-15": { title: "Erasmus", details: "Erasmus Days.", color: "purple", type: "efemeride" },
  "2026-10-30": { title: "Finaos", details: "Día de los Finaos.", color: "amber", type: "efemeride" },
  "2026-11-02": { title: "Todos los Santos", details: "Festivo.", blockReservation: true, color: "rose", type: "festivo" },
  "2026-12-07": { title: "Puente", details: "Puente de la Constitución.", blockReservation: true, color: "emerald", type: "festivo" },
  "2026-12-08": { title: "Inmaculada", details: "Festivo.", blockReservation: true, color: "rose", type: "festivo" },
  "2026-12-18": { title: "Navideña", details: "Jornada Navideña.", color: "amber", type: "efemeride" },
  "2027-01-28": { title: "Día de la Paz", details: "Día de la paz.", color: "amber", type: "efemeride" },
  "2027-01-29": { title: "Día de la Paz", details: "Día de la paz.", color: "amber", type: "efemeride" },
  "2027-02-16": { title: "Carnaval", details: "Festivo en Santa Lucía.", blockReservation: true, color: "rose", type: "festivo" },
  "2027-02-17": { title: "Libre disp.", details: "Libre disposición.", blockReservation: true, color: "emerald", type: "festivo" },
  "2027-02-18": { title: "Libre disp.", details: "Libre disposición.", blockReservation: true, color: "emerald", type: "festivo" },
  "2027-04-30": { title: "Libre disp.", details: "Libre disposición.", blockReservation: true, color: "emerald", type: "festivo" },
  "2027-05-01": { title: "Trabajador", details: "Festivo Día del Trabajador.", blockReservation: true, color: "rose", type: "festivo" },
  "2027-05-28": { title: "Día de Canarias", details: "Festivo Día de Canarias.", blockReservation: true, color: "rose", type: "festivo" },
  "2027-05-29": { title: "Libre disp.", details: "Libre disposición.", blockReservation: true, color: "emerald", type: "festivo" },
};

for (let i = 23; i <= 31; i++) specialEvents[`2026-12-${i}`] = { title: "Navidad", details: "Vacaciones", blockReservation: true, color: "blue", type: "festivo" };
for (let i = 1; i <= 10; i++) specialEvents[`2027-01-${i.toString().padStart(2, '0')}`] = { title: "Navidad", details: "Vacaciones", blockReservation: true, color: "blue", type: "festivo" };
for (let i = 22; i <= 26; i++) specialEvents[`2027-03-${i}`] = { title: "Semana Santa", details: "Semana Santa", blockReservation: true, color: "blue", type: "festivo" };

const colorStyles: Record<string, string> = {
  rose: "bg-rose-400 text-white hover:bg-rose-500",
  blue: "bg-blue-400 text-white hover:bg-blue-500",
  emerald: "bg-emerald-400 text-white hover:bg-emerald-500",
  purple: "bg-purple-400 text-white hover:bg-purple-500",
  amber: "bg-amber-400 text-white hover:bg-amber-500",
  cyan: "bg-cyan-500 text-white hover:bg-cyan-600", // Para salidas
};

const textColors: Record<string, string> = {
  rose: "text-rose-500",
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  purple: "text-purple-500",
  amber: "text-amber-500",
  cyan: "text-cyan-600",
};

const months = [
  { name: "Septiembre 2026", year: 2026, month: 8 },
  { name: "Octubre 2026", year: 2026, month: 9 },
  { name: "Noviembre 2026", year: 2026, month: 10 },
  { name: "Diciembre 2026", year: 2026, month: 11 },
  { name: "Enero 2027", year: 2027, month: 0 },
  { name: "Febrero 2027", year: 2027, month: 1 },
  { name: "Marzo 2027", year: 2027, month: 2 },
  { name: "Abril 2027", year: 2027, month: 3 },
  { name: "Mayo 2027", year: 2027, month: 4 },
  { name: "Junio 2027", year: 2027, month: 5 },
];

const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

export default function YearlyCalendar() {
  const [modalEvent, setModalEvent] = useState<{ dateStr: string, title: string, details: string } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] });
  
  const [filters, setFilters] = useState({
    festivos: true,
    efemerides: true,
    salidas: true,
    familias: true,
    evaluacion: true,
    boletines: true,
    relevantes: true
  });

  const categoryMap: Record<string, { type: string, color: string, filterKey: keyof typeof filters }> = {
    "Festivos y Vacaciones": { type: "festivo", color: "rose", filterKey: "festivos" },
    "Efemérides": { type: "efemeride", color: "amber", filterKey: "efemerides" },
    "Salidas": { type: "salida", color: "cyan", filterKey: "salidas" },
    "Visita de Familias": { type: "familias", color: "purple", filterKey: "familias" },
    "Sesiones de evaluación": { type: "evaluacion", color: "emerald", filterKey: "evaluacion" },
    "Entrega de Boletines": { type: "boletines", color: "blue", filterKey: "boletines" },
    "Días relevantes": { type: "relevantes", color: "amber", filterKey: "relevantes" },
  };

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

  const getFormatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Modal de Eventos */}
      {modalEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{modalEvent.title}</h2>
            <p className="text-sm text-slate-500 mb-4">{new Date(modalEvent.dateStr).toLocaleDateString()}</p>
            <div className="bg-amber-50 text-amber-900 p-4 rounded-xl text-lg mb-6 border border-amber-100 whitespace-pre-wrap">
              {modalEvent.details}
            </div>
            <button 
              onClick={() => setModalEvent(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl transition text-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8">
        
        {/* Filtros */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4 mb-12">
          <span className="font-bold text-slate-700 text-center text-lg">Filtros</span>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.festivos} onChange={e => setFilters({...filters, festivos: e.target.checked})} className="w-5 h-5 text-rose-500 rounded focus:ring-rose-500" />
              <span className="text-slate-600 font-medium">Festivos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.efemerides} onChange={e => setFilters({...filters, efemerides: e.target.checked})} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
              <span className="text-slate-600 font-medium">Efemérides</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.salidas} onChange={e => setFilters({...filters, salidas: e.target.checked})} className="w-5 h-5 text-cyan-500 rounded focus:ring-cyan-500" />
              <span className="text-slate-600 font-medium">Salidas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.familias} onChange={e => setFilters({...filters, familias: e.target.checked})} className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500" />
              <span className="text-slate-600 font-medium">Visita de Familias</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.evaluacion} onChange={e => setFilters({...filters, evaluacion: e.target.checked})} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500" />
              <span className="text-slate-600 font-medium">Evaluación</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.boletines} onChange={e => setFilters({...filters, boletines: e.target.checked})} className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500" />
              <span className="text-slate-600 font-medium">Boletines</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.relevantes} onChange={e => setFilters({...filters, relevantes: e.target.checked})} className="w-5 h-5 text-amber-600 rounded focus:ring-amber-600" />
              <span className="text-slate-600 font-medium">Relevantes</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-16">
          {months.map((m, index) => {
            const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
            const jsDay = new Date(m.year, m.month, 1).getDay();
            const firstDayOfMonth = (jsDay + 6) % 7;

          // Combinar eventos especiales y reservas para la leyenda y render
          let eventsInMonth: {dateStr: string, title: string, details: string, color: string, type: string}[] = [];
          
          if (filters.festivos || filters.efemerides) {
            Object.entries(specialEvents).forEach(([dateStr, evt]) => {
              if (settings.hiddenBaseEvents?.includes(dateStr)) return;
              const d = new Date(dateStr);
              if (d.getFullYear() === m.year && d.getMonth() === m.month) {
                if ((evt.type === 'festivo' && filters.festivos) || (evt.type === 'efemeride' && filters.efemerides)) {
                  eventsInMonth.push({ dateStr, title: evt.title, details: evt.details, color: evt.color, type: evt.type });
                }
              }
            });
          }

          if (settings.blockedDays) {
            settings.blockedDays.forEach(b => {
              const d = new Date(b.dateStr);
              if (d.getFullYear() === m.year && d.getMonth() === m.month) {
                 const cat = categoryMap[b.type || "Días relevantes"] || categoryMap["Días relevantes"];
                 if (filters[cat.filterKey]) {
                    eventsInMonth.push({
                      dateStr: b.dateStr,
                      title: b.reason || b.type || "Día significativo",
                      details: b.reason || "Día significativo marcado por el centro",
                      color: cat.color,
                      type: cat.type
                    });
                 }
              }
            });
          }

          if (filters.salidas) {
            const safeReservations = Array.isArray(reservations) ? reservations : [];
            safeReservations.forEach(r => {
              const d = new Date(r.dateStr);
              if (d.getFullYear() === m.year && d.getMonth() === m.month) {
                let transportInfo = r.needsTransport ? `Salida guagua: ${r.transportDepartureTime}` : "Sin transporte";
                let details = `Actividad: ${r.activity}\nGrupo: ${r.group}\nAlumnos: ${r.studentsCount}\n${transportInfo}\nLlegada: ${r.arrivalTime}`;
                eventsInMonth.push({ 
                  dateStr: r.dateStr, 
                  title: `Salida\n${r.group}`, 
                  details: details, 
                  color: "cyan", 
                  type: "salida" 
                });
              }
            });
          }

          eventsInMonth.sort((a, b) => new Date(a.dateStr).getDate() - new Date(b.dateStr).getDate());

          // Agrupar eventos consecutivos del mismo tipo (solo para festivos/efemerides para no liar con reservas)
          const groupedEvents = [];
          if (eventsInMonth.length > 0) {
            let currentGroup = { 
              title: eventsInMonth[0].title, 
              color: eventsInMonth[0].color,
              start: new Date(eventsInMonth[0].dateStr).getDate(), 
              end: new Date(eventsInMonth[0].dateStr).getDate(),
              type: eventsInMonth[0].type
            };
            
            for (let i = 1; i < eventsInMonth.length; i++) {
              const evt = eventsInMonth[i];
              const dayNum = new Date(evt.dateStr).getDate();
              
              if (evt.title === currentGroup.title && dayNum === currentGroup.end + 1 && evt.type !== "salida") {
                currentGroup.end = dayNum;
              } else {
                groupedEvents.push(currentGroup);
                currentGroup = { title: evt.title, color: evt.color, start: dayNum, end: dayNum, type: evt.type };
              }
            }
            groupedEvents.push(currentGroup);
          }

          // Crear diccionario para acceso rápido en el render del grid
          const eventsDict: Record<string, any> = {};
          eventsInMonth.forEach(e => {
            // Si hay colisión, priorizamos mostrar el que sea (el dict sobreescribirá, pero es raro misma fecha)
            eventsDict[e.dateStr] = e;
          });

          return (
            <div key={index} className="bg-white p-3 sm:p-8 lg:p-16 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
              <h3 className="text-center font-bold text-2xl sm:text-4xl lg:text-6xl text-slate-700 mb-6 sm:mb-12">{m.name}</h3>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-4 mb-4 sm:mb-6 text-center text-sm sm:text-xl lg:text-3xl font-bold text-slate-400">
                {dayNames.map(d => <div key={d}>{d}</div>)}
              </div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-4">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1 sm:p-2 lg:p-3" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = getFormatDateStr(m.year, m.month, day);
                  const event = eventsDict[dateStr];
                  const isWeekend = (firstDayOfMonth + i) % 7 >= 5;
                  
                  let cellClasses = "aspect-square flex flex-col items-center justify-start p-[4%] font-medium rounded-md sm:rounded-xl transition-transform cursor-default overflow-hidden ";
                  
                  if (event) {
                    cellClasses += `${colorStyles[event.color]} hover:scale-105 shadow-md cursor-pointer `;
                  } else if (isWeekend) {
                    cellClasses += "bg-slate-100 text-slate-400 justify-center ";
                  } else {
                    cellClasses += "text-slate-600 hover:bg-slate-50 justify-center ";
                  }
                  
                  return (
                    <button
                      key={day}
                      title={event?.title}
                      onClick={() => event && setModalEvent({ dateStr, title: event.title, details: event.details })}
                      className={cellClasses}
                      disabled={!event}
                      style={{ containerType: 'inline-size' }}
                    >
                      <span 
                        className="font-bold"
                        style={{ fontSize: 'clamp(0.8rem, 28cqi, 4rem)', marginBottom: event ? '4cqi' : '0' }}
                      >
                        {day}
                      </span>
                      {event && (
                        <span 
                          className="font-bold text-center leading-[1.1] break-words w-full px-[2%] line-clamp-4 whitespace-pre-line"
                          style={{ fontSize: 'clamp(0.65rem, 15cqi, 2rem)' }}
                        >
                          {event.title}
                        </span>
                      )}
                    </button>
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
