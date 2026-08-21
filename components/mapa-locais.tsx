"use client"

import { useEffect, useRef } from "react"
import type { Local } from "@/lib/ruido"

type Props = {
  locais: Local[]
  selecionadoId: string | null
  onSelecionar: (id: string) => void
  gps: { lat: number; lng: number } | null
}

// Mini-mapa para escolher um local existente. Leaflet é carregado dinamicamente
// (só no browser) e os marcadores são circleMarkers — sem depender de imagens do pacote.
export function MapaLocais({ locais, selecionadoId, onSelecionar, gps }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grupoRef = useRef<any>(null)
  const onSelecionarRef = useRef(onSelecionar)
  onSelecionarRef.current = onSelecionar

  // Monta o mapa uma única vez
  useEffect(() => {
    let cancelado = false

    async function montar() {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")

      if (!containerRef.current || mapRef.current || cancelado) return

      const map = L.map(containerRef.current, {
        center: [39.6, -8.2],
        zoom: 12,
        scrollWheelZoom: true,
      })
      mapRef.current = map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      grupoRef.current = L.layerGroup().addTo(map)
    }

    void montar()

    return () => {
      cancelado = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        grupoRef.current = null
      }
    }
  }, [])

  // Redesenha os marcadores quando mudam locais/seleção/GPS
  useEffect(() => {
    let cancelado = false

    async function desenhar() {
      const map = mapRef.current
      const grupo = grupoRef.current
      if (!map || !grupo || cancelado) return
      const L = await import("leaflet")

      map.removeLayer(grupo)
      const novoGrupo = L.layerGroup().addTo(map)
      grupoRef.current = novoGrupo

      if (gps) {
        L.circleMarker([gps.lat, gps.lng], {
          radius: 7,
          color: "#7dd3fc",
          fillColor: "#7dd3fc",
          fillOpacity: 0.9,
          weight: 2,
        })
          .bindTooltip("Estás aqui")
          .addTo(novoGrupo)
      }

      const comCoords = locais.filter((l) => l.latitude != null && l.longitude != null)

      comCoords.forEach((l) => {
        const selecionado = l.id === selecionadoId
        const marcador = L.circleMarker([l.latitude!, l.longitude!], {
          radius: selecionado ? 10 : 7,
          color: selecionado ? "#fbbf24" : "#f59e0b99",
          fillColor: "#fbbf24",
          fillOpacity: selecionado ? 1 : 0.55,
          weight: 2,
        })
        marcador.bindTooltip(l.nome)
        marcador.on("click", () => onSelecionarRef.current(l.id))
        marcador.addTo(novoGrupo)
        if (selecionado) {
          map.setView([l.latitude!, l.longitude!], Math.max(map.getZoom(), 16))
        }
      })

      // Enquadrar tudo
      const pontos: [number, number][] = [
        ...comCoords.map((l) => [l.latitude!, l.longitude!] as [number, number]),
        ...(gps ? [[gps.lat, gps.lng] as [number, number]] : []),
      ]
      if (pontos.length > 1) {
        map.fitBounds(L.latLngBounds(pontos).pad(0.25))
      } else if (pontos.length === 1) {
        map.setView(pontos[0], 16)
      }
    }

    void desenhar()
    return () => {
      cancelado = true
    }
  }, [locais, selecionadoId, gps])

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div ref={containerRef} className="h-56 w-full" />
    </div>
  )
}
