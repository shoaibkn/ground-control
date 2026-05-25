import { useEffect } from "react"
import { usePageStore } from "@/store/use-page-store"

export function usePageTitle(title: string) {
  const setTitle = usePageStore((state) => state.setTitle)
  useEffect(() => {
    setTitle(title)
    return () => setTitle("")
  }, [title, setTitle])
}
