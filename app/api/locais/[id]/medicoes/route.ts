import { type NextRequest, NextResponse } from "next/server"
import { atualizarLocais } from "@/lib/store"
import { estaAutenticado } from "@/lib/auth"
import type { Medicao } from "@/lib/ruido"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = (await request.json()) as Partial<Medicao>
    const medicao = await atualizarLocais((locais) => {
      const local = locais.find((l) => l.id === id)
      if (!local) return null

      const nova: Medicao = {
        id: crypto.randomUUID(),
        criadoEm: new Date().toISOString(),
        periodo: body.periodo ?? "diurno",
        laeqAmbiente: Number(body.laeqAmbiente ?? 0),
        laeqResidual: body.laeqResidual == null ? null : Number(body.laeqResidual),
        lafMax: body.lafMax == null ? null : Number(body.lafMax),
        duracaoMinutos: body.duracaoMinutos == null ? null : Number(body.duracaoMinutos),
        observacoes: body.observacoes ?? "",
      }
      local.medicoes.unshift(nova)
      local.atualizadoEm = new Date().toISOString()
      return nova
    })

    if (!medicao) return NextResponse.json({ error: "Local não encontrado" }, { status: 404 })
    return NextResponse.json({ medicao }, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro a registar medição:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Falha ao registar medição: " + msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const medicaoId = searchParams.get("medicaoId")
    if (!medicaoId) return NextResponse.json({ error: "medicaoId em falta" }, { status: 400 })

    const removido = await atualizarLocais((locais) => {
      const local = locais.find((l) => l.id === id)
      if (!local) return false
      const antes = local.medicoes.length
      local.medicoes = local.medicoes.filter((m) => m.id !== medicaoId)
      if (local.medicoes.length === antes) return false
      local.atualizadoEm = new Date().toISOString()
      return true
    })

    if (!removido) return NextResponse.json({ error: "Medição não encontrada" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro a apagar medição:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Falha ao apagar medição: " + msg }, { status: 500 })
  }
}
