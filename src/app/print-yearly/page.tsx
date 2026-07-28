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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for(let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
}

interface MonthData {
  title: string;
  days: DayData[];
}

function YearlyPrintContent() {
  const searchParams = useSearchParams();
  const catsParam = searchParams?.get('cats');
  const allowedCats = catsParam ? catsParam.split(',') : ['holidays', 'ephemeris', 'outings', 'family', 'eval', 'grades', 'relevant'];
  
  const showRes = allowedCats.includes('outings');

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] });

  useEffect(() => {
    Promise.all([
      store.getReservations(),
      store.getSettings()
    ]).then(([res, set]) => {
      setReservations(res);
      setSettings(set);
    });
  }, []);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["L", "M", "X", "J", "V", "S", "D"];

  // Generar de Septiembre 2026 a Junio 2027
  const monthsData: MonthData[] = [];
  for (let m = 0; m < 10; m++) {
    // 8 = Septiembre
    let month = 8 + m;
    let year = 2026;
    if (month > 11) {
      month -= 12;
      year++;
    }
    
    const calStart = new Date(year, month, 1);
    const startDay = calStart.getDay(); 
    const startOffset = startDay === 0 ? 6 : startDay - 1;
    calStart.setDate(calStart.getDate() - startOffset);

    const calEnd = new Date(year, month + 1, 0); // last day of month
    const endDay = calEnd.getDay();
    const endOffset = endDay === 0 ? 0 : 7 - endDay;
    calEnd.setDate(calEnd.getDate() + endOffset);

    const days = [];
    let current = new Date(calStart);
    while (current <= calEnd) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month
      });
      current.setDate(current.getDate() + 1);
    }
    
    monthsData.push({
      title: `${monthNames[month]} ${year}`,
      days
    });
  }

  const chunks = chunkArray(monthsData, 3);

  return (
    <div className="bg-slate-100 min-h-screen p-4 font-sans print:p-0 print:bg-white text-slate-800">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          .page-break { page-break-after: always; break-after: page; }
        }
      `}} />
      <div className="mb-6 flex gap-4 print:hidden justify-center">
        <button 
          onClick={() => window.print()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition"
        >
          📄 Imprimir / Descargar PDF (Apaisado)
        </button>
      </div>

      {chunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className="page-break w-full max-w-[297mm] mx-auto bg-white p-6 shadow-xl mb-8 print:shadow-none print:mb-0 print:p-0">
          <h1 className="text-2xl font-extrabold uppercase tracking-widest text-slate-900 text-center mb-6">Calendario del Curso Escolar (Pág. {pageIndex + 1})</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chunk.map((m, mIndex) => (
              <div key={mIndex} className="flex flex-col">
                <h2 className="text-lg font-bold text-center mb-2 text-slate-800 uppercase bg-slate-100 py-1 rounded">{m.title}</h2>
                <div className="border-t-2 border-l-2 border-slate-800 bg-slate-800 gap-[1px] grid grid-cols-1">
                  
                  {/* Header días */}
                  <div className="grid grid-cols-7 bg-white">
                    {dayNames.map(d => (
                      <div key={d} className="border-r-2 border-b-2 border-slate-800 p-1 text-center font-bold text-slate-900 text-[10px] bg-slate-200 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Cuadrícula */}
                  <div className="grid grid-cols-7 bg-white">
                    {m.days.map((d: DayData, i: number) => {
                      const dateStr = `${d.date.getFullYear()}-${(d.date.getMonth()+1).toString().padStart(2,'0')}-${d.date.getDate().toString().padStart(2,'0')}`;
                      const dayReservations = showRes ? (Array.isArray(reservations) ? reservations : []).filter(r => r.status !== 'rejected' && r.dateStr.split(',').includes(dateStr)) : [];
                      const dayBlocks = (settings.blockedDays || []).filter(b => b.dateStr === dateStr).filter(b => {
                        const t = b.type?.toLowerCase() || '';
                        if (t.includes('festiv') || t.includes('vacacion')) return allowedCats.includes('holidays');
                        if (t.includes('efemérid')) return allowedCats.includes('ephemeris');
                        if (t.includes('actividad') || t.includes('salida')) return allowedCats.includes('outings');
                        if (t.includes('familia')) return allowedCats.includes('family');
                        if (t.includes('evaluaci')) return allowedCats.includes('eval');
                        if (t.includes('boletin')) return allowedCats.includes('grades');
                        return allowedCats.includes('relevant');
                      });
                      const isBaseHidden = settings.hiddenBaseEvents?.includes(dateStr);
                      const baseEventRaw = !isBaseHidden ? specialEvents[dateStr] : null;
                      
                      let baseEvent = null;
                      if (baseEventRaw) {
                         const title = baseEventRaw.title.toLowerCase();
                         if (baseEventRaw.blockReservation) {
                            if (allowedCats.includes('holidays')) baseEvent = baseEventRaw;
                         } else if (title.includes('visita de familia')) {
                            if (allowedCats.includes('family')) baseEvent = baseEventRaw;
                         } else if (title.includes('finaos') || title.includes('paz') || title.includes('erasmus')) {
                            if (allowedCats.includes('ephemeris')) baseEvent = baseEventRaw;
                         } else {
                            if (allowedCats.includes('relevant')) baseEvent = baseEventRaw;
                         }
                      }
                      
                      return (
                        <div key={i} className={`border-r-2 border-b-2 border-slate-800 min-h-[70px] p-1 flex flex-col ${d.isCurrentMonth ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                          <div className="text-right font-black text-xs text-slate-700 mb-0.5">{d.date.getDate()}</div>
                          <div className="flex flex-col gap-0.5 flex-grow">
                            {baseEvent && (
                              <div className="bg-slate-100 border border-slate-300 rounded p-0.5 text-[7px] break-inside-avoid overflow-hidden leading-tight">
                                <div className="font-bold text-slate-900 line-clamp-2">{baseEvent.title}</div>
                              </div>
                            )}
                            {dayBlocks.map(b => (
                              <div key={b.id} className="bg-rose-50 border border-rose-400 rounded p-0.5 text-[7px] break-inside-avoid overflow-hidden leading-tight">
                                <div className="font-bold text-rose-900 line-clamp-2">{b.type || "Bloqueado"}</div>
                              </div>
                            ))}
                            {dayReservations.map(r => {
                              const isConfirmed = r.status === "confirmed";
                              const bgColor = isConfirmed ? "bg-cyan-50" : "bg-slate-50";
                              const borderColor = isConfirmed ? "border-cyan-400" : "border-slate-300";
                              return (
                                <div key={r.id} className={`${bgColor} border ${borderColor} rounded p-0.5 text-[7px] break-inside-avoid overflow-hidden leading-tight`}>
                                  <div className="font-bold text-cyan-900 leading-[1.1]">{r.group}</div>
                                  <div className="text-cyan-800 leading-[1.1] line-clamp-1">{r.activity}</div>
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function YearlyPrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <YearlyPrintContent />
    </Suspense>
  );
}
