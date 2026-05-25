"use client"

import React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export type AnimationType = "bounce" | "spin" | "wiggle" | "pop" | "none"

interface AnimatedIconProps {
  icon: LucideIcon
  animation?: AnimationType
  className?: string
  size?: number
}

export function AnimatedIcon({
  icon: Icon,
  animation = "bounce",
  className,
  size,
}: AnimatedIconProps) {
  const animationClass = {
    bounce: "icon-animate-bounce",
    spin: "icon-animate-spin",
    wiggle: "icon-animate-wiggle",
    pop: "icon-animate-pop",
    none: "",
  }[animation]

  return (
    <Icon
      size={size}
      className={cn("transition-transform duration-200", animationClass, className)}
    />
  )
}
