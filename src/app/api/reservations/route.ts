import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Remove createdAt because Supabase uses created_at
    const { createdAt, ...insertData } = body;
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('reservations')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email via Resend
    if (process.env.RESEND_API_KEY && process.env.VICEDIRECTOR_EMAIL) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const actionBaseUrl = `${siteUrl}/api/reservations/${data.id}/action`;

        const emailHtml = `
          <h2>Nueva solicitud de salida</h2>
          <p><strong>Docente:</strong> ${body.name}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Grupo:</strong> ${body.group}</p>
          <p><strong>Actividad:</strong> ${body.activity}</p>
          <p><strong>Fecha:</strong> ${body.dateStr}</p>
          <p><strong>Alumnos participantes:</strong> ${body.studentsCount}</p>
          <p><strong>Hora de salida:</strong> ${body.transportDepartureTime}</p>
          <p><strong>Hora est. llegada:</strong> ${body.arrivalTime}</p>
          ${body.needsTransport ? '<p><strong>Requiere transporte (Guagua)</strong></p>' : ''}
          ${body.otherTeachers ? `<p><strong>Acompañantes:</strong> ${body.otherTeachers}</p>` : ''}
          ${body.notes ? `<p><strong>Notas:</strong> ${body.notes}</p>` : ''}
          
          <div style="margin-top: 30px; display: flex; gap: 15px;">
            <a href="${actionBaseUrl}?type=confirm" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar Reserva</a>
            <a href="${actionBaseUrl}?type=reject" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-left: 10px;">Rechazar Reserva</a>
          </div>
        `;

        await resend.emails.send({
          from: 'Reservas Calendario <onboarding@resend.dev>', // Usar correo verificado en prod
          to: [process.env.VICEDIRECTOR_EMAIL],
          subject: `Nueva Reserva: ${body.group} - ${body.activity}`,
          html: emailHtml
        });
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
        // No bloqueamos la respuesta si falla el email, pero lo logueamos
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
