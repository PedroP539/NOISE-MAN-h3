import { put, list, get } from "@vercel/blob"
import type { Local } from "./ruido"

const DATA_PATH = "locais/dados.json"

// Lê a coleção de locais a partir do Blob privado.
export async function lerLocais(): Promise<Local[]> {
  try {
    const res = await get(DATA_PATH, { access: "private" })
    if (!res) return []
    const text = await new Response(res.stream).text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? (parsed as Local[]) : []
  } catch {
    // Fallback: procurar via list caso o get direto falhe
    try {
      const { blobs } = await list({ prefix: DATA_PATH })
      if (blobs.length === 0) return []
      return []
    } catch {
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
