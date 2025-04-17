import { DefaultViewSpec, InitViewSpecs } from '@/config';
import { Layout, LayoutDirection } from '@/types/layout';
import { ViewSpec } from '@/types/views';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ViewState {
  layout: Layout;
  viewSpecs: Record<string, ViewSpec>;
  activeViewID: string;
  viewIDs: string[];
}

interface ViewAction {
  setActiveViewID: (id: string) => void;
  addView: (id: string) => void;
  removeView: (id: string) => void;
  setLayout: (layout: Layout) => void;
}

type ViewStore = ViewState & ViewAction;

export const useViewStore = create<ViewStore>()(
  immer((set) => ({
    layout: {
      direction: LayoutDirection.V,
      items: [],
    },
    viewSpecs: structuredClone(InitViewSpecs),
    activeViewID: '',
    viewIDs: Object.keys(InitViewSpecs),

    setActiveViewID: (id: string) => {
      set((state) => {
        state.activeViewID = id;
      });
    },

    addView: (id: string) => {
      set((state) => {
        if (!(id in state.viewSpecs)) {
          state.viewSpecs[id] = structuredClone(DefaultViewSpec);
          state.viewIDs = Object.keys(state.viewSpecs);
        }
      });
    },

    removeView: (id: string) => {
      set((state) => {
        if (id in state.viewSpecs) {
          delete state.viewSpecs[id];
          state.viewIDs = Object.keys(state.viewSpecs);
        }
      });
    },

    setLayout: (layout: Layout) => {
      set((state) => {
        state.layout = layout;

        const layoutsToProcess = [layout];
        while (layoutsToProcess.length) {
          const ly = layoutsToProcess.shift()!;
          ly.items.forEach((item) => {
            if (typeof item === 'string') {
              // item is a view ID
              state.addView(item);
            } else {
              layoutsToProcess.push(item);
            }
          });
        }
        state.viewIDs = Object.keys(state.viewSpecs);
      });
    },
  })),
);
