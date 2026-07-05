import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to get or insert default settings row
async function getOrCreateSettings() {
  let { data, error } = await supabase.from('settings').select('*').limit(1).single();
  
  if (error && error.code === 'PGRST116') {
    // Row not found, create it
    const { data: newData, error: insertError } = await supabase
      .from('settings')
      .insert([{ data: { minDaysNotice: 7, blockedDays: [], hiddenBaseEvents: [] } }])
      .select()
      .single();
      
    if (insertError) throw insertError;
    return newData;
  }
  
  if (error) throw error;
  return data;
}

export async function GET() {
  try {
    const row = await getOrCreateSettings();
    return NextResponse.json(row.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newSettings = await request.json();
    const row = await getOrCreateSettings();
    
    const { error } = await supabase
      .from('settings')
      .update({ data: newSettings })
      .eq('id', row.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
