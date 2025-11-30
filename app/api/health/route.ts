import { NextResponse } from 'next/server'

/**
 * ヘルスチェックAPI
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ai-powered-site',
  })
}

