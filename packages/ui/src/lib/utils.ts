import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(image?: string | null, name?: string | null) {
  if (image) return image
  if (name?.toLowerCase() === "system") {
    return "https://api.dicebear.com/10.x/glass/svg?borderRadius=50&seed=gg2fzjmx"
  }
  const seed = name ? encodeURIComponent(name) : "user"
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`
}
