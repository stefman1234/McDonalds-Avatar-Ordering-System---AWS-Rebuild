import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/supabase/client';

export async function GET() {
  try {
    const result = await testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '✅ Supabase connection successful!',
        details: result.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '❌ Connection failed',
          error: result.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: '❌ Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
