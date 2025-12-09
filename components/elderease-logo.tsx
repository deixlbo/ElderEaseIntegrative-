import Image from "next/image"

export function ElderEaseLogo({ size = "md", showText = true }: { size?: "sm" | "md" | "lg"; showText?: boolean }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <Image src="/ease.jpg" alt="ElderEase Logo" fill className="object-contain" priority />
      </div>
      {showText && <span className={`font-bold ${textSizeClasses[size]} text-primary`}>ElderEase</span>}
    </div>
  )
}
