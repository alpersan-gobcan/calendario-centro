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

const colorStyles: Record<string, string> = {
  rose: "bg-rose-400 text-white hover:bg-rose-500",
  blue: "bg-blue-400 text-white hover:bg-blue-500",
  emerald: "bg-emerald-400 text-white hover:bg-emerald-500",
  purple: "bg-purple-400 text-white hover:bg-purple-500",
  amber: "bg-amber-400 text-white hover:bg-amber-500",
  cyan: "bg-cyan-500 text-white hover:bg-cyan-600",
  indigo: "bg-indigo-400 text-white hover:bg-indigo-500",
  slate: "bg-slate-400 text-white hover:bg-slate-500",
};

const textColors: Record<string, string> = {
  rose: "text-rose-500",
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  purple: "text-purple-500",
  amber: "text-amber-500",
  cyan: "text-cyan-600",
  indigo: "text-indigo-500",
  slate: "text-slate-500",
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
  const [modalEvent, setModalEvent] = useState<{ dateStr: string, title: string, details?: string, dayEvents?: { title: string, details: string, type: string, color: string }[] } | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleAllMonths = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    months.forEach(m => {
      newState[`${m.year}-${m.month}`] = expand;
    });
    setExpandedMonths(newState);
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  
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
    "Actividades": { type: "salida", color: "cyan", filterKey: "salidas" },
    "Visita de Familias": { type: "familias", color: "purple", filterKey: "familias" },
    "Sesiones de evaluación": { type: "evaluacion", color: "emerald", filterKey: "evaluacion" },
    "Entrega de Boletines": { type: "boletines", color: "blue", filterKey: "boletines" },
    "Días relevantes": { type: "relevantes", color: "indigo", filterKey: "relevantes" },
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 flex flex-col max-h-[90vh]">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center">{modalEvent.title}</h2>
            <p className="text-sm text-slate-500 mb-4 text-center capitalize">{new Date(modalEvent.dateStr).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="bg-slate-50 p-4 md:p-6 rounded-xl text-sm md:text-base border border-slate-200 text-left overflow-y-auto flex-grow mb-6 shadow-inner relative">
              {modalEvent.dayEvents && modalEvent.dayEvents.length > 1 && (
                <div className="sticky top-0 bg-blue-100 text-blue-800 font-semibold py-2 px-4 rounded-lg mb-4 text-center shadow-sm z-10 text-sm">
                  ↓ Hay {modalEvent.dayEvents.length} eventos en total. Desplázate hacia abajo para verlos todos.
                </div>
              )}
              {modalEvent.dayEvents && modalEvent.dayEvents.length > 1 ? (
                <div className="space-y-4">
                  {modalEvent.dayEvents.map((evt, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-2">{evt.title.replace('\n', ' ')}</h3>
                      <div className="whitespace-pre-wrap text-slate-700">{evt.details}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-slate-700">{modalEvent.details}</div>
              )}
            </div>
            <button 
              onClick={() => setModalEvent(null)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl transition text-lg mt-auto shrink-0"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8">
        
        {/* Controles del calendario */}
        <div className="flex flex-wrap justify-end items-center gap-3 mb-6 relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          <button 
            onClick={() => toggleAllMonths(true)}
            className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition shadow-sm"
          >
            Maximizar todo
          </button>
          <button 
            onClick={() => toggleAllMonths(false)}
            className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition shadow-sm"
          >
            Minimizar todo
          </button>

          {showFilters && (
            <div className="absolute top-12 right-0 z-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-3 min-w-[200px] animate-in fade-in slide-in-from-top-2">
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
                <span className="text-slate-600 font-medium">Actividades</span>
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
          )}
        </div>

        <div className="flex flex-col gap-6">
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
                 const typeStr = b.type || "Días relevantes";
                 let catKey = "Días relevantes";
                 
                 const lowerType = typeStr.toLowerCase();
                 if (lowerType.includes("festivo") || lowerType.includes("vacaciones")) catKey = "Festivos y Vacaciones";
                 else if (lowerType.includes("efeméride") || lowerType.includes("efemeride")) catKey = "Efemérides";
                 else if (lowerType.includes("familia")) catKey = "Visita de Familias";
                 else if (lowerType.includes("evaluaci")) catKey = "Sesiones de evaluación";
                 else if (lowerType.includes("boletin")) catKey = "Entrega de Boletines";
                 else if (lowerType.includes("salida") || lowerType.includes("actividad")) catKey = "Actividades";

                 const cat = categoryMap[catKey] || categoryMap["Días relevantes"];
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
            const safeReservations = Array.isArray(reservations) ? reservations.filter(r => r.status !== 'rejected') : [];
            safeReservations.forEach(r => {
              const dates = r.dateStr.split(',');
              const groupsArray = r.group.split(', ');
              const groupTitle = groupsArray.length > 1 ? `${groupsArray.length} Grupos` : r.group;
              const status = r.status || "pending";
              
              dates.forEach(dStr => {
                const d = new Date(dStr);
                if (d.getFullYear() === m.year && d.getMonth() === m.month) {
                  let transportInfo = r.needsTransport ? `Salida guagua: ${r.transportDepartureTime}` : "Sin transporte";
                  let details = `Actividad: ${r.activity}\nGrupos: ${r.group}\nAlumnos: ${r.studentsCount}\n${transportInfo}\nLlegada: ${r.arrivalTime}\nEstado: ${status === "confirmed" ? "Aceptada" : "Pendiente"}`;
                  eventsInMonth.push({ 
                    dateStr: dStr, 
                    title: `Actividad\n${groupTitle}`, 
                    details: details, 
                    color: status === "confirmed" ? "cyan" : "slate", 
                    type: "salida" 
                  });
                }
              });
            });
          }

          eventsInMonth.sort((a, b) => new Date(a.dateStr).getDate() - new Date(b.dateStr).getDate());

          // Agrupar eventos consecutivos del mismo tipo (ej. vacaciones) para la leyenda
          const groupedLegendEvents: (typeof eventsInMonth[0] & { startDay: number, endDay: number })[] = [];
          if (eventsInMonth.length > 0) {
            let currentGroup = { 
              ...eventsInMonth[0],
              startDay: new Date(eventsInMonth[0].dateStr).getDate(),
              endDay: new Date(eventsInMonth[0].dateStr).getDate()
            };
            
            for (let i = 1; i < eventsInMonth.length; i++) {
              const evt = eventsInMonth[i];
              const dayNum = new Date(evt.dateStr).getDate();
              
              if (evt.title === currentGroup.title && dayNum === currentGroup.endDay + 1 && evt.type !== "salida") {
                currentGroup.endDay = dayNum;
              } else {
                groupedLegendEvents.push(currentGroup);
                currentGroup = { 
                  ...evt,
                  startDay: dayNum,
                  endDay: dayNum
                };
              }
            }
            groupedLegendEvents.push(currentGroup);
          }

          // Crear diccionario para acceso rápido en el render del grid
          const eventsDict: Record<string, any[]> = {};
          eventsInMonth.forEach(e => {
            if (!eventsDict[e.dateStr]) {
              eventsDict[e.dateStr] = [];
            }
            eventsDict[e.dateStr].push(e);
          });

          const monthKey = `${m.year}-${m.month}`;
          const isExpanded = expandedMonths[monthKey];

          return (
            <div key={index} className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-4 w-full">
              
              <button 
                onClick={() => toggleMonth(monthKey)}
                className="flex items-center justify-between w-full font-bold text-2xl sm:text-3xl text-slate-700 hover:text-blue-600 transition group"
              >
                <span>{m.name}</span>
                <div className="flex items-center gap-4">
                  {!isExpanded && eventsInMonth.length > 0 && (
                    <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-blue-50 transition">
                      {eventsInMonth.length} eventos
                    </span>
                  )}
                  <svg 
                    className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 text-slate-400 group-hover:text-blue-500 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="flex flex-col lg:flex-row gap-8 pt-6 border-t border-slate-100 mt-2 animate-in fade-in slide-in-from-top-4">
                  {/* Calendario a la izquierda */}
                  <div className="flex-1 lg:w-1/2">

                
                <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-bold text-slate-400">
                  {dayNames.map(d => <div key={d}>{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = getFormatDateStr(m.year, m.month, day);
                    const dayEvents = eventsDict[dateStr];
                    const primaryEvent = dayEvents ? dayEvents[0] : undefined;
                    const isWeekend = (firstDayOfMonth + i) % 7 >= 5;
                    
                    let cellClasses = "aspect-square flex items-center justify-center font-medium rounded-xl transition-transform cursor-default overflow-hidden ";
                    
                    if (primaryEvent) {
                      cellClasses += `${colorStyles[primaryEvent.color]} hover:scale-105 shadow-md cursor-pointer `;
                    } else if (isWeekend) {
                      cellClasses += "bg-slate-100 text-slate-400 ";
                    } else {
                      cellClasses += "text-slate-600 hover:bg-slate-50 border border-slate-100 ";
                    }
                    
                    return (
                      <button
                        key={day}
                        title={primaryEvent?.title}
                        onClick={() => dayEvents && setModalEvent({ dateStr, title: primaryEvent?.title || "", details: primaryEvent?.details, dayEvents: dayEvents })}
                        className={cellClasses}
                        disabled={!dayEvents}
                      >
                        <span className="font-bold text-base sm:text-lg">{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Leyenda a la derecha */}
              <div className="flex-1 lg:w-1/2 flex flex-col bg-slate-50 rounded-2xl p-6 border border-slate-100 max-h-[600px] overflow-hidden">
                <h4 className="font-bold text-xl lg:text-2xl text-slate-700 mb-4 border-b pb-2">Eventos del Mes</h4>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {groupedLegendEvents.length === 0 ? (
                    <p className="text-slate-500 italic text-base">No hay eventos programados en este mes.</p>
                  ) : (
                    groupedLegendEvents.map((evt, evtIdx) => (
                      <div 
                        key={evtIdx} 
                        className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-400 transition"
                        onClick={() => {
                          const dayEvts = eventsDict[evt.dateStr];
                          setModalEvent({ 
                            dateStr: evt.dateStr, 
                            title: evt.title, 
                            details: evt.details, 
                            dayEvents: dayEvts 
                          });
                        }}
                      >
                        <div className={`w-5 h-5 rounded-full mt-1 shrink-0 shadow-inner ${colorStyles[evt.color].split(' ')[0]}`} />
                        <div className="flex-1">
                          <p className="font-bold text-lg lg:text-xl text-slate-800">
                            {evt.startDay === evt.endDay ? evt.startDay : `${evt.startDay} al ${evt.endDay}`} - {evt.title.replace('\n', ' ')}
                          </p>
                          <p className="text-sm lg:text-base text-slate-600 mt-2 whitespace-pre-wrap">{evt.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
      </div>
    </div>
  );
}
