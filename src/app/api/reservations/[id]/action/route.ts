import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const actionType = url.searchParams.get('type');

    if (actionType !== 'confirm' && actionType !== 'reject') {
      return new NextResponse('Acción inválida', { status: 400 });
    }

    // Obtener la reserva para sacar el email y detalles
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !reservation) {
      return new NextResponse(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">Error</h1>
            <p>La reserva ya no existe o ya fue procesada.</p>
          </body>
        </html>
      `, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (actionType === 'confirm') {
      // Actualizar a confirmada
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;
    } else if (actionType === 'reject') {
      // Marcar como rechazada
      const { error: rejectError } = await supabase
        .from('reservations')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (rejectError) throw rejectError;
    }

    // Preparar el mailto
    const statusText = actionType === 'confirm' ? 'CONFIRMADA' : 'RECHAZADA';
    const emailSubject = encodeURIComponent(`Tu reserva ha sido ${statusText}: ${reservation.activity}`);
    const emailBody = encodeURIComponent(
`Hola ${reservation.name},

Tu solicitud de reserva para la actividad "${reservation.activity}" con el grupo ${reservation.group} en la fecha ${reservation.dateStr} ha sido ${statusText}.

Saludos.`
    );
    // Enlace directo a Gmail (web)
    const encodedEmail = encodeURIComponent((reservation.email || '').trim());
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}&su=${emailSubject}&body=${emailBody}`;

    const title = actionType === 'confirm' ? '¡Reserva Confirmada en la Base de Datos!' : 'Reserva Rechazada y Borrada';
    const color = actionType === 'confirm' ? '#10b981' : '#ef4444';

    return new NextResponse(`
      <html>
        <head>
          <title>${title}</title>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8fafc;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 500px; margin: 0 auto;">
            <h1 style="color: ${color};">${title}</h1>
            <p style="color: #475569; font-size: 16px;">
              La base de datos se ha actualizado correctamente.
            </p>
            
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
              <p style="margin-bottom: 20px; font-weight: bold;">Paso final: Avisar al docente</p>
              <a href="${gmailLink}" style="background-color: #ea4335; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Abrir Gmail para avisar a ${reservation.name}
              </a>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">
                Si no se abrió automáticamente, haz clic en el botón rojo.
              </p>
            </div>
          </div>
          
          <script>
            // Abrir la ventana de redacción de Gmail automáticamente
            setTimeout(function() {
              window.location.href = "${gmailLink}";
            }, 1000);
          </script>
        </body>
      </html>
    `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (error: any) {
    console.error("Error en action de reserva:", error);
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #ef4444;">Error interno</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
