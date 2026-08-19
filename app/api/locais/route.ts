import { type NextRequest, NextResponse } from "next/server"
import { lerLocais, gravarLocais } from "@/lib/store"
import type { Local } from "@/lib/ruido"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const locais = await lerLocais()
    // ordena por atualização mais recente
    locais.sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))
    return NextResponse.json({ locais })
  } catch (error) {
    console.error("[v0] Erro a ler locais:", error)
    return NextResponse.json({ error: "Falha ao carregar locais" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Local>
    if (!body.nome || !body.morada) {
      return NextResponse.json({ error: "Nome e morada são obrigatórios" }, { status: 400 })
    }
    const locais = await lerLocais()
    const agora = new Date().toISOString()
    const novo: Local = {
      id: crypto.randomUUID(),
      criadoEm: agora,
      atualizadoEm: agora,
      nome: body.nome,
      morada: body.morada,
      concelho: body.concelho ?? "",
      freguesia: body.freguesia ?? "",
      classificacaoZona: body.classificacaoZona ?? "nao_classificada",
      fonteRuido: body.fonteRuido ?? "",
      descricaoFonte: body.descricaoFonte ?? "",
      horarioIncomodo: body.horarioIncomodo ?? "",
      nomeDenunciante: body.nomeDenunciante ?? "",
      contactoDenunciante: body.contactoDenunciante ?? "",
      moradaDenunciante: body.moradaDenunciante ?? "",
      notas: body.notas ?? "",
      medicoes: [],
    }
    locais.push(novo)
    await gravarLocais(locais)
    return NextResponse.json({ local: novo }, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro a criar local:", error)
    return NextResponse.json({ error: "Falha ao criar local" }, { status: 500 })
  }
}
