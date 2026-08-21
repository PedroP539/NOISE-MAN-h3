"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SoundMeterState = {
  ativo: boolean
  erro: string | null
  // Nível instantâneo aproximado em dB(A) relativo (não calibrado)
  atual: number
  // Estatísticas da sessão de medição em curso
  min: number
  max: number
  // LAeq aproximado (média energética) da sessão
  laeq: number
  amostras: number
}

const CALIBRACAO_OFFSET = 90 // desloca dBFS para uma escala tipo dB(A) legível

function toDbA(rms: number) {
  // rms em [0,1]; converte para dBFS e desloca para escala aproximada dB(A)
  const dbfs = 20 * Math.log10(rms || 1e-8)
  return Math.max(0, Math.min(120, dbfs + CALIBRACAO_OFFSET))
}

export function useSoundMeter() {
  const [state, setState] = useState<SoundMeterState>({
    ativo: false,
    erro: null,
    atual: 0,
    min: Number.POSITIVE_INFINITY,
    max: 0,
    laeq: 0,
    amostras: 0,
  })

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  // acumulador de energia para o LAeq
  const energiaRef = useRef(0)
  const nRef = useRef(0)
  const minRef = useRef(Number.POSITIVE_INFINITY)
  const maxRef = useRef(0)

  const parar = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {})
      ctxRef.current = null
    }
    analyserRef.current = null
    setState((s) => ({ ...s, ativo: false }))
  }, [])

  const reiniciarEstatisticas = useCallback(() => {
    energiaRef.current = 0
    nRef.current = 0
    minRef.current = Number.POSITIVE_INFINITY
    maxRef.current = 0
    setState((s) => ({
      ...s,
      atual: 0,
      min: Number.POSITIVE_INFINITY,
      max: 0,
      laeq: 0,
      amostras: 0,
    }))
  }, [])

  const iniciar = useCallback(async () => {
    try {
      reiniciarEstatisticas()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      ctxRef.current = ctx

      // Android/Chrome: o AudioContext nasce "suspended" e precisa de resume()
      // explícito dentro do gesto do utilizador, senão os samples ficam a zero.
      if (ctx.state === "suspended") {
        await ctx.resume()
      }
      // Se ainda assim ficar suspenso (alguns Androids), retoma quando mudar de estado
      ctx.onstatechange = () => {
        if (ctxRef.current === ctx && ctx.state === "suspended") {
          void ctx.resume()
        }
      }

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      // Se o microfone for retomado por outra app ou desligado, parar limpo
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          if (streamRef.current === stream) {
            setState((s) => ({ ...s, erro: "O microfone foi interrompido pelo sistema." }))
            parar()
          }
        }
      })

      const data = new Float32Array(analyser.fftSize)

      const loop = () => {
        if (!analyserRef.current) return
        analyserRef.current.getFloatTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
        const rms = Math.sqrt(sum / data.length)
        const db = toDbA(rms)

        // acumula energia para LAeq (média energética)
        energiaRef.current += Math.pow(10, db / 10)
        nRef.current += 1
        minRef.current = Math.min(minRef.current, db)
        maxRef.current = Math.max(maxRef.current, db)
        const laeq = 10 * Math.log10(energiaRef.current / nRef.current)

        setState({
          ativo: true,
          erro: null,
          atual: Number(db.toFixed(1)),
          min: Number(minRef.current.toFixed(1)),
          max: Number(maxRef.current.toFixed(1)),
          laeq: Number(laeq.toFixed(1)),
          amostras: nRef.current,
        })
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (e) {
      setState((s) => ({
        ...s,
        ativo: false,
        erro:
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Acesso ao microfone negado. Autorize o microfone no navegador para medir."
            : "Não foi possível aceder ao microfone neste dispositivo/navegador.",
      }))
    }
  }, [reiniciarEstatisticas])

  useEffect(() => {
    return () => parar()
  }, [parar])

  return { state, iniciar, parar, reiniciarEstatisticas }
}
