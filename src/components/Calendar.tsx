"use client";

import { useState, useEffect } from "react";
import { store, Reservation, Settings } from "@/lib/store";

const ALL_GROUPS = [
  "1º ESO A", "1º ESO B", "1º ESO C", "1º ESO D",
  "2º ESO A", "2º ESO B", "2º ESO C", "2º ESO D",
  "3º ESO A", "3º ESO B", "3º ESO C",
  "4º ESO A", "4º ESO B", "4º ESO C",
  "1º PDC", "2º PDC",
  "1º BACH A", "1º BACH B", "1º BACH C",
  "2º BACH A", "2º BACH B", "2º BACH C",
  "1º FPB", "2º FPB",
  "1º ITE", "2º ITE",
  "1º IEA", "2º IEA",
  "Aula Enclave"
];

// Días especiales extraídos del Excel
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

const colorStyles: Record<string, string> = {
  rose: "bg-rose-400 text-white border-rose-500 hover:bg-rose-500",
  blue: "bg-blue-400 text-white border-blue-500 hover:bg-blue-500",
  emerald: "bg-emerald-400 text-white border-emerald-500 hover:bg-emerald-500",
  purple: "bg-purple-400 text-white border-purple-500 hover:bg-purple-500",
  amber: "bg-amber-400 text-white border-amber-500 hover:bg-amber-500",
};

const textColors: Record<string, string> = {
  rose: "text-rose-100",
  blue: "text-blue-100",
  emerald: "text-emerald-100",
  purple: "text-purple-100",
  amber: "text-amber-100",
};

export default function Calendar() {
  const today = new Date();
  const currentMonthIdx = today.getMonth();
  const currentYearActual = today.getFullYear();
  // Si estamos entre enero y junio (0-5), el curso empezó el año pasado.
  // A partir de julio (6), ya cargamos el curso de ese año (ej: en julio 2026 cargamos 26/27).
  const schoolYearStart = currentMonthIdx < 6 ? currentYearActual - 1 : currentYearActual;

  const [currentDate, setCurrentDate] = useState(new Date(schoolYearStart, 8, 1));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  
  // Datos del formulario
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [formData, setFormData] = useState({ 
    name: "", email: "", activity: "", location: "", cost: "", description: "",
    studentsCount: "", notes: "", otherTeachers: "", 
    needsTransport: false, transportDepartureTime: "", transportReturnTime: "", arrivalTime: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado local
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] });
  const [warningModal, setWarningModal] = useState<{dateStr: string, reason: string} | null>(null);

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

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const jsDay = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfMonth = (jsDay + 6) % 7;

  const handlePrevMonth = () => {
    if (currentYear === schoolYearStart && currentMonth === 8) return;
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const handleNextMonth = () => {
    if (currentYear === schoolYearStart + 1 && currentMonth === 5) return;
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getFormatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const handleDateClick = (day: number) => {
    const dateStr = getFormatDateStr(currentYear, currentMonth, day);

    if (selectedGroups.length === 0) {
      alert("Por favor, selecciona primero al menos un grupo en el menú de la derecha.");
      return;
    }
    
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (selectedDates.length > 0 && selectedGroups.length > 0) {
      try {
        const warningsList: string[] = [];
        selectedDates.forEach(dStr => {
          const sEvent = specialEvents[dStr];
          if (sEvent) {
            warningsList.push(`${dStr}: ${sEvent.title}`);
          }
          const adminEvent = settings.blockedDays?.find(b => b.dateStr === dStr);
          if (adminEvent) {
            warningsList.push(`${dStr}: ${adminEvent.type || adminEvent.reason}`);
          }
          
          const safeReservations = Array.isArray(reservations) ? reservations.filter(r => r.status !== 'rejected') : [];
          const resForDay = safeReservations.filter(r => {
            if (r.dateStr.split(',').includes(dStr)) {
              const rGroups = r.group.split(', ');
              return selectedGroups.some(g => rGroups.includes(g));
            }
            return false;
          });
          if (resForDay.length > 0) {
            const groupNames = resForDay.map(r => r.group).join(", ");
            warningsList.push(`${dStr}: Ya hay reservas previas para grupos seleccionados (${groupNames})`);
          }
        });
        const warnings = warningsList.length > 0 ? Array.from(new Set(warningsList)).join(" | ") : undefined;

        await store.addReservation({
          dateStr: selectedDates.sort().join(","),
          name: formData.name,
          email: formData.email,
          group: selectedGroups.join(", "),
          activity: formData.activity,
          location: formData.location,
          cost: formData.cost,
          description: formData.description,
          studentsCount: Number(formData.studentsCount),
          notes: formData.notes,
          otherTeachers: formData.otherTeachers,
          needsTransport: formData.needsTransport,
          transportDepartureTime: formData.transportDepartureTime,
          transportReturnTime: formData.transportReturnTime,
          arrivalTime: formData.arrivalTime,
          warnings,
        });
        
        const updatedRes = await store.getReservations();
        setReservations(updatedRes);
        alert(`¡Reserva enviada para ${selectedDates.length} días! El vicedirector recibirá una notificación.`);
        
        setFormData({ 
          name: "", email: "", activity: "", location: "", cost: "", description: "",
          studentsCount: "", notes: "", otherTeachers: "", 
          needsTransport: false, transportDepartureTime: "", transportReturnTime: "", arrivalTime: "" 
        });
        setSelectedDates([]);
        setSelectedGroups([]);
      } catch (err: any) {
        console.error("Error al guardar reserva:", err);
        alert("Hubo un error al enviar la reserva: " + (err.message || "Error desconocido"));
      }
    }
    setIsSubmitting(false);
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 relative">
      {/* Calendario */}
      <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handlePrevMonth} 
            disabled={currentYear === schoolYearStart && currentMonth === 8}
            className="p-2 hover:bg-slate-100 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
          >&larr;</button>
          <h3 className="text-xl font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</h3>
          <button 
            onClick={handleNextMonth} 
            disabled={currentYear === schoolYearStart + 1 && currentMonth === 5}
            className="p-2 hover:bg-slate-100 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
          >&rarr;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-sm font-semibold text-slate-500">
          {dayNames.map(day => <div key={day}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 sm:p-4" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getFormatDateStr(currentYear, currentMonth, day);
            const isSelected = selectedDates.includes(dateStr);
            const jsDay = new Date(currentYear, currentMonth, day).getDay();
            const isWeekend = jsDay === 0 || jsDay === 6;
            const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
            const event = isBaseHidden ? undefined : specialEvents[dateStr];
            
            const safeReservations = Array.isArray(reservations) ? reservations.filter(r => r.status !== 'rejected') : [];
            const isGroupReserved = selectedGroups.length > 0 ? safeReservations.some(r => {
              if (r.dateStr.split(',').includes(dateStr)) {
                const rGroups = r.group.split(', ');
                return selectedGroups.some(g => rGroups.includes(g));
              }
              return false;
            }) : false;
            
            const hasAnyReservation = safeReservations.some(r => r.dateStr.split(',').includes(dateStr));
            
            // Comprobar días bloqueados por admin
            const adminBlocked = settings.blockedDays?.find(b => b.dateStr === dateStr);
            const isStrictAdminBlock = adminBlocked && (
              adminBlocked.type === "Festivos y Vacaciones" || 
              adminBlocked.type?.toLowerCase().includes("festiv") ||
              adminBlocked.type?.toLowerCase().includes("vacacion") ||
              adminBlocked.type?.toLowerCase().includes("libre")
            );
            
            // Comprobar antelación
            const today = new Date();
            today.setHours(0,0,0,0);
            const targetDate = new Date(currentYear, currentMonth, day);
            const diffTime = targetDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const tooClose = diffDays < settings.minDaysNotice;
            
            const isBlocked = isWeekend || (event && event.blockReservation) || tooClose || selectedGroups.length === 0 || !!isStrictAdminBlock;

            let warningReason = "";
            if (!isBlocked) {
              if (adminBlocked) warningReason = `${adminBlocked.type}: ${adminBlocked.reason}`;
              else if (isGroupReserved) warningReason = "Ya existen grupos seleccionados con reservas este día.";
              else if (event) warningReason = event.title;
            }
            const isWarningDay = !!warningReason;

            let btnClasses = "relative aspect-square flex flex-col items-center justify-start p-[4%] font-medium rounded-md sm:rounded-xl transition-transform overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 border ";
            
            if (isSelected) {
              btnClasses += "bg-blue-600 text-white shadow-md border-blue-600 font-bold scale-105 ";
            } else if (event) {
              btnClasses += `${colorStyles[event.color]} font-bold shadow-sm hover:scale-105 border-transparent `;
            } else if (isStrictAdminBlock) {
              btnClasses += "bg-slate-700 text-slate-300 border-slate-800 cursor-not-allowed ";
            } else if (isGroupReserved) {
              btnClasses += "bg-slate-700 text-white font-bold border-slate-800 opacity-90 hover:opacity-100 ";
            } else if (isWeekend) {
              btnClasses += "bg-slate-200 text-slate-500 border-slate-300 ";
            } else if (tooClose || selectedGroups.length === 0) {
              btnClasses += "bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed ";
            } else {
              btnClasses += "bg-white text-slate-700 hover:bg-slate-50 border-slate-100 hover:scale-105 ";
            }
            
            return (
              <button
                key={day}
                onClick={() => {
                  if (isBlocked) return;
                  if (isWarningDay && !isSelected) {
                    setWarningModal({ dateStr, reason: warningReason });
                  } else {
                    handleDateClick(day);
                  }
                }}
                disabled={isBlocked}
                className={btnClasses}
                style={{ containerType: 'inline-size' }}
              >
                <span 
                  className="font-bold"
                  style={{ fontSize: 'clamp(0.8rem, 28cqi, 4rem)', marginBottom: (event || adminBlocked || isGroupReserved) ? '4cqi' : '0' }}
                >
                  {day}
                </span>
                {event && !adminBlocked && (
                  <span 
                    className={`w-full px-1 break-words text-center font-semibold ${isSelected ? 'text-white' : textColors[event.color] || 'text-amber-100'}`}
                    style={{ fontSize: 'clamp(0.45rem, 16cqi, 1.5rem)', lineHeight: '1.1' }}
                  >
                    {event.title}
                  </span>
                )}
                {adminBlocked && (
                  <span 
                    className="w-full px-1 break-words text-center text-slate-400 font-bold"
                    style={{ fontSize: 'clamp(0.45rem, 16cqi, 1.5rem)', lineHeight: '1.1' }}
                  >
                    {adminBlocked.reason || "Bloqueado"}
                  </span>
                )}
                {isGroupReserved && !event && !adminBlocked && (
                  <span 
                    className="w-full px-1 break-words text-center text-slate-200"
                    style={{ fontSize: 'clamp(0.45rem, 16cqi, 1.5rem)', lineHeight: '1.1' }}
                  >
                    Ocupado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario de Reserva */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:sticky lg:top-8 h-fit">
        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">
          {selectedDates.length > 0 ? (
            <span className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                {selectedDates.length} días seleccionados
              </span>
            </span>
          ) : "Solicitar Reserva"}
        </h3>
        
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">1. Selecciona los grupos</label>
          <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3 bg-white grid grid-cols-2 gap-2">
            {ALL_GROUPS.filter(g => !settings.activeGroups || settings.activeGroups.includes(g)).map(g => (
              <label key={g} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedGroups.includes(g)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedGroups([...selectedGroups, g]);
                    else setSelectedGroups(selectedGroups.filter(x => x !== g));
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  disabled={isSubmitting}
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        {selectedGroups.length === 0 ? (
          <p className="text-sm text-slate-500 mb-6">
            Selecciona primero al menos un grupo para ver los días disponibles en el calendario.
          </p>
        ) : selectedDates.length > 0 ? (
          <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-6 border border-blue-100">
            2. <strong>{selectedDates.length}</strong> días seleccionados.
          </p>
        ) : (
          <p className="text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
            2. Haz clic en el calendario para seleccionar los días.
          </p>
        )}

        <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${selectedDates.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre y Apellidos <span className="text-red-500">*</span></label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Tu nombre y apellidos" disabled={selectedDates.length === 0 || isSubmitting} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="correo@centro.edu" disabled={selectedDates.length === 0 || isSubmitting} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Actividad <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Ej: Visita al museo" disabled={selectedDates.length === 0 || isSubmitting} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lugar <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Ej: Museo Elder" disabled={selectedDates.length === 0 || isSubmitting} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coste de la actividad (Opcional)</label>
              <input type="text" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Ej: 5€ / Gratuito" disabled={selectedDates.length === 0 || isSubmitting} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de alumnado <span className="text-red-500">*</span></label>
              <input required type="number" min="1" value={formData.studentsCount} onChange={e => setFormData({...formData, studentsCount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Ej: 25" disabled={selectedDates.length === 0 || isSubmitting} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la actividad (Opcional)</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm" placeholder="Breve descripción de lo que se va a hacer..." rows={2} disabled={selectedDates.length === 0 || isSubmitting}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cosas a tener en cuenta (Opcional)</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm" placeholder="Ej: Llevar comida, protector solar, toalla..." rows={2} disabled={selectedDates.length === 0 || isSubmitting}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Otros docentes acompañantes (Opcional)</label>
            <input type="text" value={formData.otherTeachers} onChange={e => setFormData({...formData, otherTeachers: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="Nombres de otros docentes" disabled={selectedDates.length === 0 || isSubmitting} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora de salida del centro <span className="text-red-500">*</span></label>
              <input required type="time" value={formData.transportDepartureTime} onChange={e => setFormData({...formData, transportDepartureTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition mt-auto" disabled={selectedDates.length === 0 || isSubmitting} />
            </div>
            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora est. de llegada <span className="text-red-500">*</span></label>
              <input required type="time" value={formData.arrivalTime} onChange={e => setFormData({...formData, arrivalTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition mt-auto" disabled={selectedDates.length === 0 || isSubmitting} />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mt-2">
            <div className="flex items-center">
              <input type="checkbox" id="transport" checked={formData.needsTransport} onChange={e => setFormData({...formData, needsTransport: e.target.checked})} disabled={selectedDates.length === 0 || isSubmitting} className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500" />
              <label htmlFor="transport" className="ml-2 block text-sm font-bold text-slate-700">¿Es necesario transporte (Guagua)?</label>
            </div>
            
            {formData.needsTransport && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-700 mb-1">Hora de recogida del transporte en el lugar de la actividad <span className="text-red-500">*</span></label>
                <input required type="time" value={formData.transportReturnTime} onChange={e => setFormData({...formData, transportReturnTime: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" disabled={selectedDates.length === 0 || isSubmitting} />
              </div>
            )}
          </div>
          
          <p className="text-xs text-slate-500 mb-2">* Campos obligatorios</p>
          <button type="submit" disabled={selectedDates.length === 0 || isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition">
            {isSubmitting ? "Enviando..." : "Solicitar Reserva"}
          </button>
        </form>
      </div>

      {warningModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Atención
            </h3>
            <p className="text-slate-600 mb-4 text-sm">
              Este día ({warningModal.dateStr}) tiene la siguiente advertencia:
              <br/><br/>
              <strong className="text-slate-800">{warningModal.reason}</strong>
              <br/><br/>
              ¿Deseas continuar y seleccionarlo de todos modos?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setWarningModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  handleDateClick(parseInt(warningModal.dateStr.split('-')[2]));
                  setWarningModal(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition shadow-sm"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
