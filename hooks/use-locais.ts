"use client"

import useSWR from "swr"
import type { Local, Medicao } from "@/lib/ruido"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useLocais() {
  const { data, error, isLoading, mutate } = useSWR<{ locais: Local[] }>("/api/locais", fetcher)

  // Atualiza o cache local imediatamente (o Blob privado tem consistência
  // eventual, por isso não revalidamos logo a seguir à escrita).
  function atualizarCache(fn: (atual: Local[]) => Local[]) {
    return mutate(
      (dados) => ({ locais: fn(dados?.locais ?? []) }),
      { revalidate: false },
    )
  }

  async function criarLocal(payload: Partial<Local>) {
    const res = await fetch("/api/locais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Falha ao criar local")
    const { local } = (await res.json()) as { local: Local }
    await atualizarCache((atual) => [local, ...atual])
    return local
  }

  async function atualizarLocal(id: string, payload: Partial<Local>) {
    const res = await fetch(`/api/locais/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Falha ao atualizar local")
    const { local } = (await res.json()) as { local: Local }
    await atualizarCache((atual) => atual.map((l) => (l.id === id ? local : l)))
  }

  async function apagarLocal(id: string) {
    const res = await fetch(`/api/locais/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Falha ao apagar local")
    await atualizarCache((atual) => atual.filter((l) => l.id !== id))
  }

  async function adicionarMedicao(id: string, payload: Partial<Medicao>) {
    const res = await fetch(`/api/locais/${id}/medicoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Falha ao registar medição")
    const { medicao } = (await res.json()) as { medicao: Medicao }
    await atualizarCache((atual) =>
      atual.map((l) =>
        l.id === id ? { ...l, medicoes: [medicao, ...l.medicoes] } : l,
      ),
    )
  }

  async function apagarMedicao(id: string, medicaoId: string) {
    const res = await fetch(`/api/locais/${id}/medicoes?medicaoId=${medicaoId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Falha ao apagar medição")
    await atualizarCache((atual) =>
      atual.map((l) =>
        l.id === id
          ? { ...l, medicoes: l.medicoes.filter((m) => m.id !== medicaoId) }
          : l,
      ),
    )
  }

  return {
    locais: data?.locais ?? [],
    isLoading,
    error,
    criarLocal,
    atualizarLocal,
    apagarLocal,
    adicionarMedicao,
    apagarMedicao,
    mutate,
  }
}
