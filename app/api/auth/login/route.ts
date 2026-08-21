import { type NextRequest, NextResponse } from "next/server"
import { COOKIE_SESSAO, criarTokenSessao, loginPermitido, verificarPassword } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "desconhecido"

    if (!loginPermitido(ip)) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." },
        { status: 429 },
      )
    }

    const body = (await request.json()) as { password?: string }
    if (!verificarPassword(body.password)) {
      return NextResponse.json({ error: "Password incorreta" }, { status: 401 })
    }

    const { token, maxAgeSegundos } = criarTokenSessao()
    const resposta = NextResponse.json({ ok: true })
    resposta.cookies.set(COOKIE_SESSAO, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSegundos,
    })
    return resposta
  } catch (error) {
    console.error("[auth] Erro no login:", error)
    return NextResponse.json({ error: "Falha no login" }, { status: 500 })
  }
}
