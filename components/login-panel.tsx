"use client"

import { useState } from "react"
import { Loader2, LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [aEntrar, setAEntrar] = useState(false)

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setAEntrar(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const dados = (await res.json()) as { error?: string }
      if (!res.ok) {
        setErro(dados.error ?? "Falha no login")
        return
      }
      onSuccess()
    } catch {
      setErro("Não foi possível contactar o servidor")
    } finally {
      setAEntrar(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col items-center justify-center">
      <div className="w-full rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Acesso restrito</h1>
            <p className="text-xs text-muted-foreground">
              Os processos de denúncia contêm dados pessoais.
            </p>
          </div>
        </div>

        <form onSubmit={submeter} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" disabled={aEntrar} className="gap-2">
            {aEntrar && <Loader2 className="size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
