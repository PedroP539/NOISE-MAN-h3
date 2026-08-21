import { type NextRequest, NextResponse } from "next/server"
import { lerLocais, atualizarLocais } from "@/lib/store"
import { estaAutenticado } from "@/lib/auth"
import type { Local } from "@/lib/ruido"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  const { id } = await params
  const locais = await lerLocais()
  const local = locais.find((l) => l.id === id)
  if (!local) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
  return NextResponse.json({ local })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<Local>
    const atualizado = await atualizarLocais((locais) => {
      const idx = locais.findIndex((l) => l.id === id)
      if (idx === -1) return null

      const atual = locais[idx]
      const novo: Local = {
        ...atual,
        ...body,
        id: atual.id,
        criadoEm: atual.criadoEm,
        medicoes: body.medicoes ?? atual.medicoes,
        atualizadoEm: new Date().toISOString(),
      }
      locais[idx] = novo
      return novo
    })

    if (!atualizado) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
    return NextResponse.json({ local: atualizado })
  } catch (error) {
    console.error("[v0] Erro a atualizar local:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Falha ao atualizar local: " + msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  try {
    const { id } = await params
    const removido = await atualizarLocais((locais) => {
      const idx = locais.findIndex((l) => l.id === id)
      if (idx === -1) return false
      locais.splice(idx, 1)
      return true
    })

    if (!removido) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro a apagar local:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Falha ao apagar local: " + msg }, { status: 500 })
  }
}
