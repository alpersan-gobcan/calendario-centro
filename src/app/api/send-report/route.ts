import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function POST(request: Request) {
  try {
    const { start, end } = await request.json();

    if (!start || !end) {
      return NextResponse.json({ error: "Fechas de inicio y fin requeridas." }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Get reservations
    const { data: resData, error: resError } = await supabase.from('reservations').select('*');
    if (resError) throw resError;

    // Get settings
    const { data: setRow, error: setError } = await supabase.from('settings').select('*').limit(1).single();
    if (setError && setError.code !== 'PGRST116') throw setError;
    const settings = setRow ? setRow.data : { blockedDays: [], hiddenBaseEvents: [] };

    const safeReservations = Array.isArray(resData) ? resData : [];
    const safeBlockedDays = Array.isArray(settings.blockedDays) ? settings.blockedDays : [];
    const hiddenBaseEvents = Array.isArray(settings.hiddenBaseEvents) ? settings.hiddenBaseEvents : [];

    // Format events
    let emailHtml = `<h1 style="color: #0f172a;">Informe de Actividades y Eventos</h1>
      <p style="color: #475569; font-size: 16px;">Desde: <b>${startDate.toLocaleDateString('es-ES')}</b> hasta <b>${endDate.toLocaleDateString('es-ES')}</b></p>
      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />`;

    let hasEvents = false;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
      
      const dayRes = safeReservations.filter((r: any) => r.dateStr.includes(dateStr) && r.status !== 'rejected');
      const dayBlocks = safeBlockedDays.filter((b: any) => b.dateStr === dateStr);
      const isBaseHidden = hiddenBaseEvents.includes(dateStr);
      const baseEvent = !isBaseHidden ? specialEvents[dateStr] : null;

      if (dayRes.length > 0 || dayBlocks.length > 0 || baseEvent) {
        hasEvents = true;
        
        emailHtml += `<div style="margin-bottom: 24px;">
          <h2 style="background-color: #334155; color: white; padding: 10px 15px; border-radius: 6px; margin: 0 0 10px 0; font-size: 18px;">📅 ${current.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>`;

        if (baseEvent) {
          emailHtml += `<div style="background-color: #f1f5f9; padding: 10px 15px; border-left: 4px solid #94a3b8; margin-bottom: 8px;">
            <p style="margin: 0; font-weight: bold; color: #334155;">${baseEvent.title}</p>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">${baseEvent.details}</p>
          </div>`;
        }

        for (const block of dayBlocks) {
          emailHtml += `<div style="background-color: #fff1f2; padding: 10px 15px; border-left: 4px solid #fb7185; margin-bottom: 8px;">
            <p style="margin: 0; font-weight: bold; color: #9f1239;">${block.type || "Bloqueado"}</p>
            <p style="margin: 4px 0 0 0; color: #be123c; font-size: 14px;">${block.reason}</p>
          </div>`;
        }

        for (const r of dayRes) {
          emailHtml += `<div style="background-color: #ecfeff; padding: 12px 15px; border-left: 4px solid #22d3ee; margin-bottom: 10px;">
            <p style="margin: 0 0 4px 0; font-weight: bold; color: #164e63; font-size: 16px;">${r.group} - ${r.activity}</p>
            <p style="margin: 0 0 4px 0; color: #0891b2; font-size: 14px;">👤 Solicitante: <b>${r.name}</b> (${r.studentsCount} alumnos)</p>
            ${r.otherTeachers ? `<p style="margin: 0 0 4px 0; color: #0891b2; font-size: 14px;">👥 Acompañantes: ${r.otherTeachers}</p>` : ''}
            <div style="background-color: white; padding: 8px; border-radius: 4px; margin-top: 8px;">
              <p style="margin: 0; color: #334155; font-weight: bold;">🕒 Horario: ${r.transportDepartureTime || 'Salida'} - ${r.arrivalTime}</p>
              ${r.needsTransport ? `<p style="margin: 4px 0 0 0; color: #334155; font-weight: bold;">🚌 Recogida Guagua: ${r.transportReturnTime}</p>` : ''}
            </div>
            ${r.notes ? `<p style="margin: 8px 0 0 0; color: #475569; font-size: 14px; background-color: #f8fafc; padding: 6px; border: 1px solid #e2e8f0;">📝 Notas: ${r.notes}</p>` : ''}
          </div>`;
        }

        emailHtml += `</div>`;
      }
      
      current.setDate(current.getDate() + 1);
    }

    if (!hasEvents) {
      emailHtml += `<p style="color: #64748b; font-style: italic;">No hay actividades, reservas ni eventos programados para estas fechas.</p>`;
    }

    const vicedirectorEmail = process.env.VICEDIRECTOR_EMAIL;
    if (!vicedirectorEmail || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Faltan credenciales de correo electrónico en el servidor." }, { status: 500 });
    }

    await resend.emails.send({
      from: 'Calendario Actividades <onboarding@resend.dev>',
      to: [vicedirectorEmail],
      subject: `Informe Semanal de Actividades (${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')})`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Error generating report:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
