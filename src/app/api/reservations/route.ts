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
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('reservations')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email via Resend
    if (process.env.RESEND_API_KEY && process.env.VICEDIRECTOR_EMAIL) {
      try {
        await resend.emails.send({
          from: 'Reservas Calendario <onboarding@resend.dev>', // Usar correo verificado en prod
          to: [process.env.VICEDIRECTOR_EMAIL],
          subject: `Nueva Reserva: ${body.group} - ${body.activity}`,
          html: `
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
          `
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
