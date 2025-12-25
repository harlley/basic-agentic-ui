import { create } from 'zustand'

interface ColorState {
    squareColor: string
    setSquareColor: (color: string) => void
}

export const useColorStore = create<ColorState>((set) => ({
    squareColor: 'rebeccapurple', // Default premium color
    setSquareColor: (color: string) => set({ squareColor: color }),
}))
