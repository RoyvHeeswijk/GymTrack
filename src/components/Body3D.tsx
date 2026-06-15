import { useEffect, useMemo, useRef, useState } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import type { MuscleActivation, MuscleId } from '../lib/muscles'
import { MUSCLE_LABELS } from '../lib/muscles'
import {
  activationToBodyState,
  heatColorForValue,
  pickViewSide,
} from '../lib/muscleChartAdapter'

interface Body3DProps {
  activation: MuscleActivation
  height?: number
  showLegend?: boolean
}

export default function Body3D({ activation, height = 340, showLegend = true }: Body3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const autoView = useMemo(() => pickViewSide(activation), [activation])
  const [view, setView] = useState<ViewSide>(autoView)
  const bodyState = useMemo(() => activationToBodyState(activation), [activation])

  useEffect(() => {
    setView(autoView)
  }, [autoView])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = new BodyChart(el, {
      view,
      bodyState,
      ariaLabel: 'Anatomisch lichaam met spieractivatie',
      showViewLabel: false,
      enableTransitions: true,
    })
    chartRef.current = chart

    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.update({ view, bodyState })
  }, [view, bodyState])

  const activeMuscles = useMemo(
    () =>
      (Object.entries(activation) as [MuscleId, number][])
        .filter(([, v]) => v > 0.01)
        .sort((a, b) => b[1] - a[1]),
    [activation],
  )

  return (
    <div>
      <div className="body3d-toolbar mb-2 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setView(ViewSide.FRONT)}
          className={`body-chart-view-btn ${view === ViewSide.FRONT ? 'body-chart-view-btn-active' : ''}`}
        >
          Voor
        </button>
        <button
          type="button"
          onClick={() => setView(ViewSide.BACK)}
          className={`body-chart-view-btn ${view === ViewSide.BACK ? 'body-chart-view-btn-active' : ''}`}
        >
          Achter
        </button>
      </div>

      <div
        ref={containerRef}
        style={{ height }}
        className="body3d-canvas touch-none overflow-hidden rounded-2xl"
      />

      <p className="mt-1 text-center text-[11px] text-muted">
        Tik Voor/Achter om de andere kant te zien
      </p>

      {showLegend && activeMuscles.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {activeMuscles.map(([muscle, value]) => (
            <span key={muscle} className="legend-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: heatColorForValue(value) }}
              />
              {MUSCLE_LABELS[muscle]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
