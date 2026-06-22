import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiCore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await callAI(body);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server nội bộ' }, { status: 500 });
  }
}
