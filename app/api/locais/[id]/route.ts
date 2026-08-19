import { type NextRequest, NextResponse } from "next/server"
import { lerLocais, gravarLocais } from "@/lib/store"
import type { Local } from "@/lib/ruido"

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const locais = await lerLocais()
  const local = locais.find((l) => l.id === id)
  if (!local) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
  return NextResponse.json({ local })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<Local>
    const locais = await lerLocais()
    const idx = locais.findIndex((l) => l.id === id)
    if (idx === -1) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })

    const atual = locais[idx]
    const atualizado: Local = {
      ...atual,
      ...body,
      id: atual.id,
      criadoEm: atual.criadoEm,
      medicoes: body.medicoes ?? atual.medicoes,
      atualizadoEm: new Date().toISOString(),
    }
    locais[idx] = atualizado
    await gravarLocais(locais)
    return NextResponse.json({ local: atualizado })
  } catch (error) {
    console.error("[v0] Erro a atualizar local:", error)
    return NextResponse.json({ error: "Falha ao atualizar local" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const locais = await lerLocais()
    const filtrados = locais.filter((l) => l.id !== id)
    if (filtrados.length === locais.length) {
      return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
    }
    await gravarLocais(filtrados)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro a apagar local:", error)
    return NextResponse.json({ error: "Falha ao apagar local" }, { status: 500 })
  }
}
