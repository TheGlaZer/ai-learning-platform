import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('Test route hit!');
  return NextResponse.json({ message: 'Test route working' });
} 