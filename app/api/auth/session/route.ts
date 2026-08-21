import { type NextRequest, NextResponse } from "next/server"
import { estaAutenticado } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const autenticado = await estaAutenticado(request)
  return NextResponse.json({ autenticado })
}
