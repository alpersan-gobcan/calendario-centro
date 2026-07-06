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
      // Borrar la reserva
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    }

    // Enviar correo al profesor
    if (process.env.RESEND_API_KEY && reservation.email) {
      const statusText = actionType === 'confirm' ? 'CONFIRMADA' : 'RECHAZADA';
      const statusColor = actionType === 'confirm' ? '#10b981' : '#ef4444';
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Estado de tu solicitud de salida</h2>
          <p>Hola ${reservation.name},</p>
          <p>Tu solicitud de reserva para la actividad <strong>${reservation.activity}</strong> con el grupo <strong>${reservation.group}</strong> ha sido:</p>
          <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0;">
            ${statusText}
          </div>
          <p>Fechas solicitadas: ${reservation.dateStr}</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #666; font-size: 12px;">Este es un mensaje automático del sistema de reservas del centro.</p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: 'Reservas Calendario <onboarding@resend.dev>', // Usar correo verificado en prod
          to: [reservation.email],
          subject: `Tu reserva ha sido ${statusText}: ${reservation.activity}`,
          html: emailHtml
        });
      } catch (emailError) {
        console.error("Error enviando email al profesor:", emailError);
      }
    }

    // Responder al vicedirector con una página HTML de éxito
    const title = actionType === 'confirm' ? '¡Reserva Confirmada!' : 'Reserva Rechazada y Borrada';
    const color = actionType === 'confirm' ? '#10b981' : '#ef4444';

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8fafc;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 500px; margin: 0 auto;">
            <h1 style="color: ${color};">${title}</h1>
            <p style="color: #475569; font-size: 16px;">
              Se ha enviado un correo automáticamente al profesor (${reservation.email}) notificándole la decisión.
            </p>
            <p style="margin-top: 30px;">
              Ya puedes cerrar esta ventana.
            </p>
          </div>
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
