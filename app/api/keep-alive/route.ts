import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Perform a lightweight query to keep Supabase project active
    const { data, error } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      )
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'Supabase project keep-alive ping successful!',
        timestamp: new Date().toISOString(),
        data,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  }
}
