import { create } from "zustand";

type SquareState = {
  squareColor: string;
  setSquareColor: (color: string) => void;
};

export const useSquareStore = create<SquareState>((set) => ({
  squareColor: "rebeccapurple",
  setSquareColor: (squareColor) => set({ squareColor }),
}));


