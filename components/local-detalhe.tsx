"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MedicaoForm } from "@/components/medicao-form"
import { MedicoesLista } from "@/components/medicoes-lista"
import { DenunciaPanel } from "@/components/denuncia-panel"
import { avaliarIncomodidade, ZONAS, type Local, type Medicao } from "@/lib/ruido"
import { ArrowLeft, MapPin, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Props = {
  local: Local
  abaInicial?: "medir" | "historico" | "denuncia"
  onVoltar: () => void
  onAdicionarMedicao: (id: string, payload: Partial<Medicao>) => Promise<void>
  onApagarMedicao: (id: string, medicaoId: string) => Promise<void>
  onApagarLocal: (id: string) => Promise<void>
  onAtualizarLocal: (id: string, payload: Partial<Local>) => Promise<void>
}

export function LocalDetalhe({
  local,
  abaInicial,
  onVoltar,
  onAdicionarMedicao,
  onApagarMedicao,
  onApagarLocal,
  onAtualizarLocal,
}: Props) {
  const zona = ZONAS[local.classificacaoZona]
  const excedeAlguma = local.medicoes.some((m) => avaliarIncomodidade(m).excede)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={onVoltar} className="-ml-2 w-fit gap-2">
            <ArrowLeft className="size-4" />
            Voltar aos locais
          </Button>
          <h2 className="text-balance text-2xl font-semibold text-foreground">{local.nome}</h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {local.morada}
            {local.freguesia ? `, ${local.freguesia}` : ""}
            {local.concelho ? `, ${local.concelho}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{zona.label}</Badge>
            <Badge variant="outline">
              {local.medicoes.length} {local.medicoes.length === 1 ? "medição" : "medições"}
            </Badge>
            {excedeAlguma && <Badge variant="destructive">Incomodidade excedida</Badge>}
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={async () => {
            if (confirm("Apagar este local e todas as suas medições?")) {
              await onApagarLocal(local.id)
              toast.success("Local apagado.")
              onVoltar()
            }
          }}
        >
          <Trash2 className="size-4" />
          Apagar local
        </Button>
      </div>

      <Tabs key={`${local.id}-${abaInicial ?? "medir"}`} defaultValue={abaInicial ?? "medir"} className="w-full">
        <TabsList>
          <TabsTrigger value="medir">Medir</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="denuncia">Denúncia</TabsTrigger>
        </TabsList>

        <TabsContent value="medir" className="mt-6">
          <MedicaoForm
            onSubmit={async (payload) => {
              await onAdicionarMedicao(local.id, payload)
              toast.success("Medição registada.")
            }}
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <MedicoesLista
            medicoes={local.medicoes}
            onApagar={async (medicaoId) => {
              await onApagarMedicao(local.id, medicaoId)
              toast.success("Medição removida.")
            }}
          />
        </TabsContent>

        <TabsContent value="denuncia" className="mt-6">
          <DenunciaPanel
            local={local}
            onAtualizar={async (payload) => {
              await onAtualizarLocal(local.id, payload)
              toast.success("Identificação guardada — é reutilizada nas próximas denúncias.")
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
