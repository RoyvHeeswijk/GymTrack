import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Color } from 'three'
import type { MuscleActivation, MuscleId } from '../lib/muscles'
import { MUSCLE_LABELS } from '../lib/muscles'

/** Neutrale lichaamsdelen — licht genoeg voor zicht op grijze canvas-achtergrond. */
const NEUTRAL = '#64748b'
const SKELETON = '#94a3b8'

/** Heatmapkleur: 0 = grijs, laag = groen, midden = geel/oranje, hoog = rood. */
function heatColor(value: number | undefined): string {
  if (!value || value <= 0.01) return NEUTRAL
  const hue = 120 - 120 * Math.min(value, 1)
  return new Color().setHSL(hue / 360, 0.85, 0.48).getStyle()
}

interface PieceProps {
  muscle?: MuscleId
  activation: MuscleActivation
  position: [number, number, number]
  scale?: [number, number, number]
  rotation?: [number, number, number]
  kind?: 'sphere' | 'capsule' | 'box'
  capsule?: [number, number]
}

function Piece({
  muscle,
  activation,
  position,
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  kind = 'sphere',
  capsule = [0.1, 0.4],
}: PieceProps) {
  const value = muscle ? activation[muscle] : undefined
  const color = muscle ? heatColor(value) : SKELETON
  const emissive = value && value > 0.01 ? color : '#334155'

  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      {kind === 'sphere' && <sphereGeometry args={[1, 24, 24]} />}
      {kind === 'capsule' && <capsuleGeometry args={[capsule[0], capsule[1], 8, 16]} />}
      {kind === 'box' && <boxGeometry args={[1, 1, 1]} />}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={value ? 0.45 * value : 0.08}
        roughness={0.55}
        metalness={0.05}
      />
    </mesh>
  )
}

function Mirrored(props: PieceProps) {
  const [x, y, z] = props.position
  const [rx, ry, rz] = props.rotation ?? [0, 0, 0]
  return (
    <>
      <Piece {...props} />
      <Piece {...props} position={[-x, y, z]} rotation={[rx, -ry, -rz]} />
    </>
  )
}

function BodyModel({ activation }: { activation: MuscleActivation }) {
  return (
    <group position={[0, -1.85, 0]}>
      <Piece activation={activation} position={[0, 3.35, 0]} scale={[0.26, 0.32, 0.28]} />
      <Piece activation={activation} position={[0, 3.0, 0]} kind="capsule" capsule={[0.11, 0.18]} />
      <Piece activation={activation} position={[0, 2.25, 0]} kind="capsule" capsule={[0.36, 0.85]} />
      <Piece activation={activation} position={[0, 1.45, 0]} scale={[0.4, 0.28, 0.3]} />
      <Piece muscle="traps" activation={activation} position={[0, 2.82, -0.05]} scale={[0.42, 0.14, 0.24]} />
      <Mirrored muscle="chest" activation={activation} position={[0.2, 2.52, 0.26]} scale={[0.22, 0.18, 0.13]} />
      <Piece muscle="abs" activation={activation} position={[0, 2.0, 0.26]} scale={[0.21, 0.34, 0.1]} />
      <Mirrored muscle="obliques" activation={activation} position={[0.27, 2.0, 0.12]} scale={[0.1, 0.3, 0.14]} />
      <Piece muscle="upperBack" activation={activation} position={[0, 2.55, -0.26]} scale={[0.3, 0.22, 0.1]} />
      <Mirrored muscle="lats" activation={activation} position={[0.26, 2.2, -0.2]} scale={[0.14, 0.3, 0.12]} />
      <Piece muscle="lowerBack" activation={activation} position={[0, 1.78, -0.24]} scale={[0.2, 0.22, 0.09]} />
      <Mirrored muscle="frontDelts" activation={activation} position={[0.5, 2.66, 0.12]} scale={[0.13, 0.13, 0.12]} />
      <Mirrored muscle="sideDelts" activation={activation} position={[0.6, 2.7, 0]} scale={[0.14, 0.15, 0.14]} />
      <Mirrored muscle="rearDelts" activation={activation} position={[0.5, 2.66, -0.12]} scale={[0.12, 0.12, 0.11]} />
      <Mirrored muscle="biceps" activation={activation} position={[0.66, 2.28, 0.07]} rotation={[0, 0, 0.12]} kind="capsule" capsule={[0.09, 0.32]} />
      <Mirrored muscle="triceps" activation={activation} position={[0.69, 2.26, -0.07]} rotation={[0, 0, 0.12]} kind="capsule" capsule={[0.09, 0.32]} />
      <Mirrored muscle="forearms" activation={activation} position={[0.76, 1.72, 0]} rotation={[0, 0, 0.08]} kind="capsule" capsule={[0.075, 0.36]} />
      <Mirrored activation={activation} position={[0.81, 1.4, 0]} scale={[0.08, 0.11, 0.06]} />
      <Mirrored muscle="glutes" activation={activation} position={[0.16, 1.38, -0.2]} scale={[0.17, 0.17, 0.14]} />
      <Mirrored muscle="quads" activation={activation} position={[0.2, 0.95, 0.09]} kind="capsule" capsule={[0.14, 0.5]} />
      <Mirrored muscle="hamstrings" activation={activation} position={[0.2, 0.95, -0.1]} kind="capsule" capsule={[0.12, 0.46]} />
      <Mirrored activation={activation} position={[0.2, 0.6, 0.02]} scale={[0.11, 0.11, 0.11]} />
      <Mirrored activation={activation} position={[0.2, 0.3, 0.05]} kind="capsule" capsule={[0.08, 0.4]} />
      <Mirrored muscle="calves" activation={activation} position={[0.2, 0.32, -0.08]} kind="capsule" capsule={[0.09, 0.3]} />
      <Mirrored activation={activation} position={[0.2, 0.0, 0.08]} kind="box" scale={[0.14, 0.09, 0.3]} />
    </group>
  )
}

interface Body3DProps {
  activation: MuscleActivation
  height?: number
  showLegend?: boolean
}

const CANVAS_BG = '#dce3ed'

export default function Body3D({ activation, height = 340, showLegend = true }: Body3DProps) {
  const activeMuscles = useMemo(
    () =>
      (Object.entries(activation) as [MuscleId, number][])
        .filter(([, v]) => v > 0.01)
        .sort((a, b) => b[1] - a[1]),
    [activation],
  )

  return (
    <div>
      <div style={{ height, backgroundColor: CANVAS_BG }} className="body3d-canvas touch-none rounded-2xl">
        <Canvas camera={{ position: [0, 0.3, 4.2], fov: 38 }} gl={{ antialias: true }}>
          <color attach="background" args={[CANVAS_BG]} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[3, 4, 5]} intensity={1.4} />
          <directionalLight position={[-3, 2, -4]} intensity={0.7} />
          <directionalLight position={[0, -2, 2]} intensity={0.35} />
          <BodyModel activation={activation} />
          <OrbitControls
            enablePan={false}
            minDistance={2.8}
            maxDistance={6}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.7}
          />
        </Canvas>
      </div>
      <p className="mt-1 text-center text-[11px] text-muted">Sleep om het model te draaien</p>
      {showLegend && activeMuscles.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {activeMuscles.map(([muscle, value]) => (
            <span key={muscle} className="legend-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: heatColor(value) }}
              />
              {MUSCLE_LABELS[muscle]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
