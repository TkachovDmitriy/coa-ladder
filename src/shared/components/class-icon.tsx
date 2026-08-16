import { classColor, classIcon } from "@/shared/constants/classes.constants"
import { cn } from "@/shared/utils/utils"

interface ClassIconProps {
  name: string | null
  /** pixel size of the square icon */
  size?: number
  className?: string
}

/**
 * Square class icon with a class-colored border. If the image is missing, the
 * colored frame itself stands in, so a class is never a blank box.
 */
export function ClassIcon({ name, size = 20, className }: ClassIconProps) {
  const src = name ? classIcon(name) : null
  const color = classColor(name)

  return (
    <span
      className={cn("inline-flex shrink-0 overflow-hidden rounded-md", className)}
      style={{ width: size, height: size, border: `2px solid ${color}`, backgroundColor: `${color}22` }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      ) : null}
    </span>
  )
}
