"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { useLocais } from "@/hooks/use-locais"
import { LocalForm } from "@/components/local-form"
import { LocalDetalhe } from "@/components/local-detalhe"
import { LoginPanel } from "@/components/login-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { avaliarIncomodidade, ZONAS, type Local } from "@/lib/ruido"
import { Activity, Plus, MapPin, ChevronRight, AudioLines, LogOut } from "lucide-react"
import { toast } from "sonner"

export default function Page() {
  // Estado de sessão: decide entre o painel de login e a aplicação
  const {
    data: sessao,
    isLoading: sessaoAcarregar,
    mutate: mutarSessao,
  } = useSWR<{ autenticado: boolean }>("/api/auth/session", (url: string) =>
    fetch(url).then((r) => r.json()),
  )

  if (sessaoAcarregar) {
    return (
      <Shell>
        <p className="py-20 text-center text-sm text-muted-foreground">A carregar...</p>
      </Shell>
    )
  }

  if (!sessao?.autenticado) {
    return (
      <Shell>
        <LoginPanel onSuccess={() => mutarSessao()} />
      </Shell>
    )
  }

  return (
    <Shell>
      <Conteudo />
    </Shell>
  )
}

function Conteudo() {
  const {
    locais,
    isLoading,
    criarLocal,
    apagarLocal,
    adicionarMedicao,
    apagarMedicao,
  } = useLocais()
  const [vista, setVista] = useState<"lista" | "novo">("lista")
  const [selecionado, setSelecionado] = useState<string | null>(null)

  const localAtivo = locais.find((l) => l.id === selecionado) ?? null

  if (localAtivo) {
    return (
      <>
        <LocalDetalhe
          local={localAtivo}
          onVoltar={() => setSelecionado(null)}
          onAdicionarMedicao={adicionarMedicao}
          onApagarMedicao={apagarMedicao}
          onApagarLocal={apagarLocal}
        />
      </>
    )
  }

  return (
    <>
      {vista === "novo" ? (
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">Novo local</h2>
          <LocalForm
            onCancel={() => setVista("lista")}
            onSubmit={async (payload) => {
              const novo = await criarLocal(payload)
              toast.success("Local criado.")
              setVista("lista")
              setSelecionado(novo.id)
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <Hero onNovo={() => setVista("novo")} />

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Locais monitorizados</h2>
              <Button size="sm" onClick={() => setVista("novo")} className="gap-2">
                <Plus className="size-4" />
                Novo local
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">A carregar...</p>
            ) : locais.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <AudioLines className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Ainda não há locais. Crie o primeiro para começar a medir e a documentar o ruído.
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {locais.map((l) => (
                  <LocalCard key={l.id} local={l} onClick={() => setSelecionado(l.id)} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig()

  async function terminarSessao() {
    await fetch("/api/auth/logout", { method: "POST" })
    await mutate("/api/auth/session", { autenticado: false }, { revalidate: false })
    toast.success("Sessão terminada.")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground">Medidor de Ruído</h1>
            <p className="text-xs leading-tight text-muted-foreground">
              Registo e denúncia · Decreto-Lei n.º 9/2007
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={terminarSessao}
            className="ml-auto gap-2 text-muted-foreground"
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-4xl px-4 pb-10 pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ferramenta de apoio ao cidadão. As medições por microfone são indicativas e não
          calibradas; não têm valor pericial. Baseado no Regulamento Geral do Ruído (Decreto-Lei n.º
          9/2007, de 17 de janeiro).
        </p>
      </footer>
    </div>
  )
}

function Hero({ onNovo }: { onNovo: () => void }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-balance text-2xl font-semibold text-foreground sm:text-3xl">
            Meça, registe e documente o ruído excessivo
          </h2>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            Use o microfone do dispositivo para obter uma leitura indicativa em dB(A), registe todos
            os dados do local e da fonte, e gere um documento de denúncia pronto a apresentar, com
            enquadramento no Regulamento Geral do Ruído.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <PeriodoBox titulo="Diurno" horario="07h – 20h" limite="5 dB(A)" />
          <PeriodoBox titulo="Entardecer" horario="20h – 23h" limite="4 dB(A)" />
          <PeriodoBox titulo="Noturno" horario="23h – 07h" limite="3 dB(A)" />
        </div>
        <Button onClick={onNovo} className="w-fit gap-2">
          <Plus className="size-4" />
          Adicionar local
        </Button>
      </div>
    </section>
  )
}

function PeriodoBox({ titulo, horario, limite }: { titulo: string; horario: string; limite: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</div>
      <div className="font-mono text-sm text-foreground">{horario}</div>
      <div className="mt-1 text-xs text-accent">Incomodidade máx. {limite}</div>
    </div>
  )
}

function LocalCard({ local, onClick }: { local: Local; onClick: () => void }) {
  const zona = ZONAS[local.classificacaoZona]
  const excede = local.medicoes.some((m) => avaliarIncomodidade(m).excede)
  const ultimaMedicao = local.medicoes[0]

  return (
    <li>
      <button
        onClick={onClick}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-card/80"
      >
        <div className="flex flex-col gap-2">
          <span className="font-medium text-foreground">{local.nome}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {local.morada}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {zona.label}
            </Badge>
            {ultimaMedicao && (
              <span className="font-mono text-xs text-muted-foreground">
                {ultimaMedicao.laeqAmbiente.toFixed(1)} dB(A)
              </span>
            )}
            {excede && (
              <Badge variant="destructive" className="text-xs">
                Excede
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  )
}
