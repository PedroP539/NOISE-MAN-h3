import { type NextRequest, NextResponse } from "next/server"
import { lerLocais, atualizarLocais } from "@/lib/store"
import { estaAutenticado } from "@/lib/auth"
import type { Local } from "@/lib/ruido"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
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
  if (!(await estaAutenticado(request))) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  try {
    const body = (await request.json()) as Partial<Local>
    if (!body.nome || body.nome.trim().length < 2) {
      return NextResponse.json({ error: "Indica um nome para o local" }, { status: 400 })
    }
    const agora = new Date().toISOString()
    const novo = await atualizarLocais((locais) => {
      const criado: Local = {
        id: crypto.randomUUID(),
        criadoEm: agora,
        atualizadoEm: agora,
        nome: body.nome!,
        morada: body.morada!,
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
      locais.push(criado)
      return criado
    })
    return NextResponse.json({ local: novo }, { status: 201 })
  } catch (error) {
    console.error("[v0] Erro a criar local:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Falha ao criar local: " + msg }, { status: 500 })
  }
}
