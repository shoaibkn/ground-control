import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(image?: string | null, name?: string | null) {
  if (image) return image
  const seed = name ? encodeURIComponent(name) : "user"
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`
}
