import { create } from 'zustand';

const START_ID = 0;

interface IdStore {
  currentId: number;
  nextId: () => string;
  reset: () => void;
}

export const useIdStore = create<IdStore>((set, get) => ({
  currentId: START_ID,

  nextId: () => {
    const currentId = get().currentId;
    set({ currentId: currentId + 1 });
    return String(currentId + 1);
  },
  reset: () => {
    set({ currentId: START_ID });
  },
}));
