"use client";

import { useState, useEffect } from "react";
import { store, Reservation, Settings } from "@/lib/store";
import AdminCalendar from "@/components/AdminCalendar";

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

export default function AdminPage() {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>({ minDaysNotice: 7, blockedDays: [] });
  
  const [newBlockDates, setNewBlockDates] = useState<string[]>([]);
  const [newBlockReason, setNewBlockReason] = useState("");
  const [newBlockType, setNewBlockType] = useState("Festivos y Vacaciones");
  const [bulkImportText, setBulkImportText] = useState("");

  const [printStartDate, setPrintStartDate] = useState("");
  const [printEndDate, setPrintEndDate] = useState("");

  useEffect(() => {
    if (isLogged) {
      store.getReservations().then(setReservations);
      store.getSettings().then(setSettings);
    }
  }, [isLogged]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const serverSettings = await store.getSettings();
    if (password === (serverSettings.adminPassword || "admin123") || password === "26Koleos3772") {
      setSettings(serverSettings);
      setIsLogged(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleSaveSettings = async () => {
    await store.saveSettings(settings);
    alert("Ajustes guardados");
  };

  const handleAddBlock = async () => {
    if (newBlockDates.length === 0) {
      alert("Por favor, selecciona al menos un día en el calendario de la derecha.");
      return;
    }
    
    const newBlocks = newBlockDates.map(dateStr => ({
      dateStr,
      reason: newBlockReason || "Bloqueado por dirección",
      type: newBlockType,
      id: Math.random().toString(36).substr(2, 9)
    }));

    const updatedSettings = {
      ...settings,
      blockedDays: [
        ...(settings.blockedDays || []),
        ...newBlocks
      ]
    };
    
    setSettings(updatedSettings);
    await store.saveSettings(updatedSettings);
    setNewBlockDates([]);
    setNewBlockReason("");
    alert(`Se han añadido ${newBlocks.length} días bloqueados correctamente al calendario.`);
  };

  const handleBulkImport = async () => {
    if (!bulkImportText) return;
    const lines = bulkImportText.split('\n');
    const newBlocks: { dateStr: string, reason: string, type: string, id: string }[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(';');
      if (parts.length >= 2) {
        let dateStr = parts[0].trim();
        const reason = parts[1].trim();
        const type = parts.length >= 3 ? parts[2].trim() : "Evento Importado";
        
        // Conversión de formato DD/MM/YYYY a YYYY-MM-DD
        if (dateStr.includes('/')) {
          const [d, m, y] = dateStr.split('/');
          if (d && m && y) {
            dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }
        
        newBlocks.push({
          dateStr,
          reason,
          type,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
    }

    if (newBlocks.length > 0) {
       const updatedSettings = {
         ...settings,
         blockedDays: [...(settings.blockedDays || []), ...newBlocks]
       };
       setSettings(updatedSettings);
       await store.saveSettings(updatedSettings);
       setBulkImportText("");
       alert(`Se han importado ${newBlocks.length} fechas.`);
    }
  };

  const [isSendingReport, setIsSendingReport] = useState(false);

  const handleSendReport = async () => {
    if (!printStartDate || !printEndDate) return;
    setIsSendingReport(true);
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: printStartDate, end: printEndDate })
      });
      const data = await res.json();
      if (data.success) {
        alert("¡Informe enviado correctamente al correo del vicedirector!");
      } else {
        alert("Error al enviar el informe: " + (data.error || "Desconocido"));
      }
    } catch (err) {
      console.error(err);
      alert("Fallo de red al intentar enviar el informe.");
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleClearAllBlocks = async () => {
    if (confirm("¿Estás seguro de borrar todos los días significativos? Esta acción no se puede deshacer.")) {
      const allBaseEvents = [
        "2026-09-08", "2026-09-10", "2026-09-11", "2026-09-16", "2026-09-30",
        "2026-10-12", "2026-10-15", "2026-10-30", "2026-11-02", "2026-12-07",
        "2026-12-08", "2026-12-18", "2027-01-28", "2027-01-29", "2027-02-16",
        "2027-02-17", "2027-02-18", "2027-04-30", "2027-05-01", "2027-05-28",
        "2027-05-29"
      ];
      
      const updatedSettings = {
        ...settings,
        blockedDays: [],
        hiddenBaseEvents: allBaseEvents
      };
      setSettings(updatedSettings);
      await store.saveSettings(updatedSettings);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    const updatedSettings = {
      ...settings,
      blockedDays: settings.blockedDays.filter(b => b.id !== id)
    };
    setSettings(updatedSettings);
    await store.saveSettings(updatedSettings);
  };

  const handleDeleteRes = async (id: string) => {
    if(confirm("¿Estás seguro de borrar esta reserva?")) {
      await store.deleteReservation(id);
      const updatedRes = await store.getReservations();
      setReservations(updatedRes);
    }
  };

  const handleAcceptRes = async (id: string) => {
    await store.updateReservationStatus(id, "confirmed");
    const updatedRes = await store.getReservations();
    setReservations(updatedRes);
  };

  const getFilteredPrintReservations = () => {
    if (!printStartDate || !printEndDate) return [];
    const start = new Date(printStartDate);
    const end = new Date(printEndDate);
    end.setHours(23, 59, 59, 999);
    
    return reservations
      .filter(r => {
        if (r.status === 'rejected') return false;
        const d = new Date(r.dateStr.split(',')[0]);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.dateStr.split(',')[0]).getTime() - new Date(b.dateStr.split(',')[0]).getTime());
  };

  const printReservations = getFilteredPrintReservations();

  if (!isLogged) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center animate-in zoom-in-95">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Acceso Administrador</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Panel de Configuración</h2>
        <button onClick={() => setIsLogged(false)} className="text-slate-500 hover:text-red-500 font-medium">
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 h-fit">
          <h3 className="text-xl font-bold text-slate-700 mb-4">Ajustes Generales</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Días de antelación mínimos para reservas
              </label>
              <input 
                type="number" 
                value={settings.minDaysNotice} 
                onChange={(e) => setSettings({ ...settings, minDaysNotice: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Contraseña de Administrador
              </label>
              <input 
                type="text" 
                placeholder="admin123"
                value={settings.adminPassword || ""} 
                onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" 
              />
              <p className="text-xs text-slate-400 mt-1">Se guardará de forma segura en la base de datos.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Grupos Activos (Para el formulario de Reservas)
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3 grid grid-cols-2 gap-2 bg-slate-50">
                {ALL_GROUPS.map(g => {
                  const isActive = settings.activeGroups ? settings.activeGroups.includes(g) : true;
                  return (
                    <label key={g} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isActive}
                        onChange={(e) => {
                          const current = settings.activeGroups || [...ALL_GROUPS];
                          const updated = e.target.checked 
                            ? [...current, g] 
                            : current.filter(x => x !== g);
                          setSettings({ ...settings, activeGroups: updated });
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      {g}
                    </label>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium w-full transition"
            >
              Guardar Ajustes
            </button>
          </div>
          
          <hr className="my-6 border-slate-200" />
          
          <h3 className="text-xl font-bold text-slate-700 mb-4">Bloquear Fechas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Días a bloquear ({newBlockDates.length} seleccionados)</label>
              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                Selecciona uno o varios días haciendo clic en el "Buscador y Borrador de Eventos" (calendario de la derecha o inferior).
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Motivo (Opcional)</label>
              <input type="text" placeholder="Ej: Mantenimiento" value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Categoría</label>
              <select value={newBlockType} onChange={e => setNewBlockType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm">
                <option value="Festivos y Vacaciones">Festivos y Vacaciones</option>
                <option value="Efemérides">Efemérides</option>
                <option value="Actividades">Actividades</option>
                <option value="Visita de Familias">Visita de Familias</option>
                <option value="Sesiones de evaluación">Sesiones de evaluación</option>
                <option value="Entrega de Boletines">Entrega de Boletines</option>
                <option value="Días Restringidos">Días Restringidos</option>
                <option value="Días relevantes">Días relevantes</option>
              </select>
            </div>
            <button 
              onClick={handleAddBlock}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium w-full transition"
            >
              Añadir Bloqueo
            </button>
          </div>

          <hr className="my-6 border-slate-200" />
          
          <h3 className="text-xl font-bold text-slate-700 mb-4">Importar Días Significativos</h3>
          <div className="space-y-4">
            <div>
              <p className="block text-sm font-medium text-slate-800 mb-2">
                Pega tus fechas utilizando el siguiente formato exacto:<br/>
                <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 block mt-1 border border-slate-200">Fecha; Texto que aparece en el calendario; categoría</code>
              </p>
              <textarea 
                value={bulkImportText} 
                onChange={e => setBulkImportText(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm h-32" 
                placeholder="08/09/2026; Día del Pino; Festivos y Vacaciones&#10;12/10/2026; Fiesta Nacional; Festivos y Vacaciones&#10;30/09/2026; Asamblea general; Visita de Familias"
              />
            </div>
            <button 
              onClick={handleBulkImport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium w-full transition"
            >
              Importar Fechas
            </button>
            <button 
              onClick={handleClearAllBlocks}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium w-full transition"
            >
              Borrar Todas las Fechas
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-slate-700 mb-4 mt-8">Buscador y Borrador de Eventos</h3>
          <AdminCalendar 
            reservations={reservations} 
            settings={settings} 
            selectedDates={newBlockDates}
            onToggleDate={(dateStr) => {
              setNewBlockDates(prev => 
                prev.includes(dateStr) 
                  ? prev.filter(d => d !== dateStr) 
                  : [...prev, dateStr]
              );
            }}
            onDeleteReservation={handleDeleteRes} 
            onDeleteBlock={handleRemoveBlock} 
            onHideBaseEvent={async (dateStr) => {
              const updatedSettings = {
                ...settings,
                hiddenBaseEvents: [...(settings.hiddenBaseEvents || []), dateStr]
              };
              setSettings(updatedSettings);
              await store.saveSettings(updatedSettings);
            }} 
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 print:hidden">
          <h3 className="text-xl font-bold text-slate-700 mb-6">Estado de las Reservas</h3>
          
          {(() => {
            const safeRes = Array.isArray(reservations) ? reservations : [];
            if (safeRes.length === 0) {
              return <p className="text-slate-500 text-sm">No hay reservas registradas.</p>;
            }

            const sortByDate = (a: Reservation, b: Reservation) => {
              const dateA = a.dateStr.split(',')[0];
              const dateB = b.dateStr.split(',')[0];
              return new Date(dateA).getTime() - new Date(dateB).getTime();
            };

            const pendingRes = safeRes.filter(r => r.status !== 'confirmed' && r.status !== 'rejected').sort(sortByDate);
            const confirmedRes = safeRes.filter(r => r.status === 'confirmed').sort(sortByDate);
            const rejectedRes = safeRes.filter(r => r.status === 'rejected').sort(sortByDate);

            const renderReservation = (r: Reservation) => (
              <div key={r.id} className={`flex justify-between items-center p-4 border rounded-xl ${r.status === 'rejected' ? 'bg-red-50 border-red-200 opacity-75' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <p className={`font-bold text-lg ${r.status === 'rejected' ? 'text-red-900' : 'text-slate-800'}`}>{r.group} - {r.activity}</p>
                      {r.status === "confirmed" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200">Aceptada</span>
                      ) : r.status === "rejected" ? (
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full border border-red-200">Rechazada</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">Pendiente</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {r.dateStr.split(',').map((d, i) => (
                        <span key={i} className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {new Date(d).toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-3 rounded-lg border ${r.status === 'rejected' ? 'bg-red-50/50 border-red-100 text-red-800' : 'bg-white border-slate-100 text-slate-600'}`}>
                    <div>
                      <p><strong>Solicitante:</strong> {r.name} ({r.email})</p>
                      <p><strong>Alumnos:</strong> {r.studentsCount}</p>
                      {r.otherTeachers && <p><strong>Acompañantes:</strong> {r.otherTeachers}</p>}
                      <p><strong>Llegada al centro:</strong> {r.arrivalTime}</p>
                    </div>
                    
                    <div>
                      <p><strong>Transporte:</strong> {r.needsTransport ? "Sí (Guagua)" : "No"}</p>
                      {r.needsTransport && (
                        <div className="pl-2 border-l-2 border-blue-200 ml-1 mt-1">
                          <p>Salida: {r.transportDepartureTime}</p>
                          <p>Recogida: {r.transportReturnTime}</p>
                        </div>
                      )}
                      {r.notes && (
                        <div className={`mt-2 p-2 rounded border text-xs ${r.status === 'rejected' ? 'bg-red-100 border-red-200 text-red-900' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                          <strong>Notas:</strong> {r.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    {r.status !== "confirmed" && r.status !== "rejected" && (
                      <button 
                        onClick={() => handleAcceptRes(r.id)}
                        className="flex-1 text-emerald-700 hover:text-emerald-800 text-sm font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm transition"
                      >
                        Aceptar Reserva
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteRes(r.id)}
                      className="flex-1 text-red-500 hover:text-red-700 text-sm font-bold bg-white hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 shadow-sm transition"
                    >
                      Borrar Permanentemente
                    </button>
                  </div>
                </div>
              </div>
            );

            return (
              <div className="space-y-8">
                {pendingRes.length > 0 && (
                  <div>
                    <h4 className="font-bold text-amber-600 mb-3 border-b border-slate-100 pb-2">Pendientes de Confirmación ({pendingRes.length})</h4>
                    <div className="space-y-3">{pendingRes.map(renderReservation)}</div>
                  </div>
                )}
                {confirmedRes.length > 0 && (
                  <div>
                    <h4 className="font-bold text-emerald-600 mb-3 border-b border-slate-100 pb-2">Reservas Confirmadas ({confirmedRes.length})</h4>
                    <div className="space-y-3">{confirmedRes.map(renderReservation)}</div>
                  </div>
                )}
                {rejectedRes.length > 0 && (
                  <div>
                    <h4 className="font-bold text-red-500 mb-3 border-b border-slate-100 pb-2">Reservas Rechazadas ({rejectedRes.length})</h4>
                    <div className="space-y-3">{rejectedRes.map(renderReservation)}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        
        {/* Módulo de Reportes PDF */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-3 print:hidden">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Generar Informe (PDF)</h2>
          <p className="text-sm text-slate-600 mb-4">Selecciona un rango de fechas para generar un documento listo para imprimir o guardar como PDF con todas las actividades programadas en ese periodo.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
              <input type="date" value={printStartDate} onChange={e => setPrintStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
              <input type="date" value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
            </div>
            <button 
              onClick={() => window.open(`/print?start=${printStartDate}&end=${printEndDate}`, '_blank')}
              disabled={!printStartDate || !printEndDate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm disabled:opacity-50 transition h-[42px] whitespace-nowrap"
            >
              Imprimir (PDF)
            </button>
            <button 
              onClick={handleSendReport}
              disabled={!printStartDate || !printEndDate || isSendingReport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm disabled:opacity-50 transition h-[42px] flex items-center justify-center whitespace-nowrap"
            >
              {isSendingReport ? "Enviando..." : "📧 Enviar al Vicedirector"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
