import { type NextRequest, NextResponse } from "next/server"
import { lerLocais, gravarLocais } from "@/lib/store"
import type { Medicao } from "@/lib/ruido"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<Medicao>
    const locais = await lerLocais()
    const idx = locais.findIndex((l) => l.id === id)
    if (idx === -1) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })

    const medicao: Medicao = {
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
      periodo: body.periodo ?? "diurno",
      laeqAmbiente: Number(body.laeqAmbiente ?? 0),
      laeqResidual: body.laeqResidual == null ? null : Number(body.laeqResidual),
      lafMax: body.lafMax == null ? null : Number(body.lafMax),
      duracaoMinutos: body.duracaoMinutos == null ? null : Number(body.duracaoMinutos),
      observacoes: body.observacoes ?? "",
    }
    locais[idx].medicoes.unshift(medicao)
    locais[idx].atualizadoEm = new Date().toISOString()
    await gravarLocais(locais)
    return NextResponse.json({ medicao }, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro a criar medição:", error)
    return NextResponse.json({ error: "Falha ao registar medição" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const medicaoId = searchParams.get("medicaoId")
    if (!medicaoId) return NextResponse.json({ error: "medicaoId em falta" }, { status: 400 })

    const locais = await lerLocais()
    const idx = locais.findIndex((l) => l.id === id)
    if (idx === -1) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })

    locais[idx].medicoes = locais[idx].medicoes.filter((m) => m.id !== medicaoId)
    locais[idx].atualizadoEm = new Date().toISOString()
    await gravarLocais(locais)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro a apagar medição:", error)
    return NextResponse.json({ error: "Falha ao apagar medição" }, { status: 500 })
  }
}
