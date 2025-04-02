import { create } from 'zustand';
import { createSelectors } from './createSelectors';

interface LoadDataState {
  segmentGroupExtension: string;
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  updateSegmentGroup: (by: string) => void;
}

const useloadDataStoreBase = create<LoadDataState>((set) => ({
  segmentGroupExtension: '',
  isLoading: false,
  startLoading: () => set(() => ({ isLoading: true })),
  stopLoading: () => set(() => ({ isLoading: false })),
  updateSegmentGroup: (by) => set(() => ({ segmentGroupExtension: by })),
}));

export default createSelectors(useloadDataStoreBase);
