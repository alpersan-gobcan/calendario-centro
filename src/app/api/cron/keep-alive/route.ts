import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Secret for security
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Perform a simple query to register database activity
    const { data, error } = await supabase.from('settings').select('*').limit(1);
    
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Database keep-alive ping successful" });

  } catch (err: any) {
    console.error("Error in keep-alive cron:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
