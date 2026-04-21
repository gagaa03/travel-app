import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function MagicCard({
  children,
  className,
  gradientFrom = "#9E7AFF",
  gradientTo = "#FE8BBB",
  gradientSize = 200,
}) {
  const [position, setPosition] = useState({ x: -gradientSize, y: -gradientSize })
  const ref = useRef(null)

  const handlePointerMove = useCallback((e) => {
    const rect = ref.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handlePointerLeave = useCallback(() => {
    setPosition({ x: -gradientSize, y: -gradientSize })
  }, [gradientSize])

  return (
    <div
      ref={ref}
      className={cn("rounded-2xl", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        border: "1px solid transparent",
        background: `
          linear-gradient(var(--color-card) 0 0) padding-box,
          radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px,
            ${gradientFrom},
            ${gradientTo},
            var(--color-border) 100%
          ) border-box
        `,
      }}
    >
      <div className="relative bg-card rounded-2xl w-full h-full overflow-hidden">
        {/* 內部淡光 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px, ${gradientFrom}0a, transparent 70%)`,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}
