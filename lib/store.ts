import { put, list, get, del } from "@vercel/blob"
import type { Local } from "./ruido"

const DATA_PATH = "locais/dados.json"
const BACKUP_PREFIX = "locais/backups/dados-"
const SNAPSHOT_RETENCAO = 10

// Lê a coleção de locais a partir do Blob privado.
export async function lerLocais(): Promise<Local[]> {
  try {
    const res = await get(DATA_PATH, { access: "private" })
    if (!res) return []
    const text = await new Response(res.stream).text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? (parsed as Local[]) : []
  } catch (erro) {
    // Fallback: obter o URL via list e descarregar diretamente
    try {
      const { blobs } = await list({ prefix: DATA_PATH })
      if (blobs.length === 0) return []
      const res = await fetch(blobs[0].url)
      const parsed = JSON.parse(await res.text())
      return Array.isArray(parsed) ? (parsed as Local[]) : []
    } catch {
      console.error("[store] Falha ao ler locais:", erro)
      return []
    }
  }
}

// Grava a coleção completa de locais.
export async function gravarLocais(locais: Local[]): Promise<void> {
  await put(DATA_PATH, JSON.stringify(locais, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

// Guarda uma cópia do estado atual antes de o substituir; mantém só os últimos SNAPSHOT_RETENCAO.
async function snapshot(): Promise<void> {
  try {
    const atual = await get(DATA_PATH, { access: "private" })
    if (!atual) return
    const conteudo = await new Response(atual.stream).text()
    await put(`${BACKUP_PREFIX}${Date.now()}.json`, conteudo, {
      access: "private",
      contentType: "application/json",
    })
    const { blobs } = await list({ prefix: BACKUP_PREFIX })
    if (blobs.length > SNAPSHOT_RETENCAO) {
      const antigos = blobs
        .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
        .slice(SNAPSHOT_RETENCAO)
        .map((b) => b.url)
      if (antigos.length) await del(antigos)
    }
  } catch (erro) {
    // Um snapshot falhado não deve bloquear a escrita — apenas regista.
    console.error("[store] Snapshot falhou (escrita continua):", erro)
  }
}

// Serializa todas as mutações dentro da instância do servidor:
// evita o clássico read-modify-write em que duas escritas simultâneas perdem dados.
let cadeiaEscritas: Promise<unknown> = Promise.resolve()

/**
 * Executa uma mutação sobre os locais de forma transacional:
 * lock → leitura fresca → snapshot do estado anterior → mutação → gravação.
 * O mutador altera o array recebido (in place) e pode devolver um resultado.
 */
export function atualizarLocais<T>(
  mutador: (locais: Local[]) => T | Promise<T>,
): Promise<T> {
  const tarefa = cadeiaEscritas.then(async () => {
    const locais = await lerLocais()
    await snapshot()
    const resultado = await mutador(locais)
    await gravarLocais(locais)
    return resultado
  })
  // A cadeia continua mesmo que esta tarefa falhe (não bloqueia as seguintes)
  cadeiaEscritas = tarefa.catch(() => undefined)
  return tarefa
}
