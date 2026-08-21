// Autenticação simples por password (ferramenta pessoal).
// Sessão em cookie HttpOnly assinado com HMAC-SHA256 — sem dependências externas.
import { createHmac, timingSafeEqual, createHash } from "node:crypto"

export const COOKIE_SESSAO = "noiseman_sessao"
const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

function chaveSecreta(): string {
  const explicita = process.env.AUTH_SECRET
  if (explicita) return explicita
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error("ADMIN_PASSWORD (ou AUTH_SECRET) não está configurado")
  }
  // Deriva uma chave estável da própria password
  return createHash("sha256").update(`noiseman:${password}`).digest("hex")
}

function assinar(valor: string): string {
  return createHmac("sha256", chaveSecreta()).update(valor).digest("base64url")
}

export function verificarPassword(password: string | undefined | null): boolean {
  const esperada = process.env.ADMIN_PASSWORD
  if (!esperada || !password) return false
  const a = createHash("sha256").update(password).digest()
  const b = createHash("sha256").update(esperada).digest()
  return timingSafeEqual(a, b)
}

// Cria o valor do cookie de sessão: "<expira>.<assinatura>"
export function criarTokenSessao(): { token: string; maxAgeSegundos: number } {
  const expira = Date.now() + DURACAO_SESSAO_MS
  return { token: `${expira}.${assinar(String(expira))}`, maxAgeSegundos: Math.floor(DURACAO_SESSAO_MS / 1000) }
}

export function sessaoValida(token: string | undefined | null): boolean {
  if (!token) return false
  const dot = token.lastIndexOf(".")
  if (dot <= 0) return false
  const expira = token.slice(0, dot)
  const assinatura = token.slice(dot + 1)
  const esperada = assinar(expira)
  if (assinatura.length !== esperada.length) return false
  try {
    if (!timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))) return false
  } catch {
    return false
  }
  const expiraMs = Number(expira)
  return Number.isFinite(expiraMs) && expiraMs > Date.now()
}

// Verifica o cookie de um Request e devolve true se a sessão for válida.
export async function estaAutenticado(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_SESSAO}=`))
  if (!match) return false
  return sessaoValida(decodeURIComponent(match.slice(COOKIE_SESSAO.length + 1)))
}

// ---- Rate limit simples de tentativas de login (por instância de servidor) ----
const TENTATIVAS_MAX = 5
const JANELA_MS = 5 * 60 * 1000
const tentativas = new Map<string, { count: number; resetEm: number }>()

export function loginPermitido(ip: string): boolean {
  const agora = Date.now()
  const registo = tentativas.get(ip)
  if (!registo || registo.resetEm < agora) {
    tentativas.set(ip, { count: 1, resetEm: agora + JANELA_MS })
    return true
  }
  registo.count += 1
  return registo.count <= TENTATIVAS_MAX
}
