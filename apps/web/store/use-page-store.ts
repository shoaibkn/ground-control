import { create } from "zustand"

interface PageStore {
  title: string
  setTitle: (title: string) => void
}

export const usePageStore = create<PageStore>((set) => ({
  title: "Dashboard",
  setTitle: (title: string) => set({ title }),
}))
