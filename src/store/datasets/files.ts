import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DataSourceWithFile } from '@/io/import/dataSource';

type FileState = {
  byDataID: Record<string, DataSourceWithFile[]>;
};

type FileAction = {
  getDataSources: (dataID: string) => DataSourceWithFile[];
  getFiles: (dataID: string) => File[];
  remove: (dataID: string) => void;
  add: (dataID: string, files: DataSourceWithFile[]) => void;
};

export const useFileStore = create<FileState & FileAction>()(
  immer((set, get) => ({
    byDataID: {},

    getDataSources: (dataID: string) => {
      return get().byDataID[dataID] ?? [];
    },

    getFiles: (dataID: string) => {
      return (get().byDataID[dataID] ?? []).map((ds) => ds.fileSrc.file);
    },
    remove: (dataID) => {
      set((state) => {
        delete state.byDataID[dataID];
      });
    },
    add: (dataID, files) => {
      set((state) => {
        state.byDataID[dataID] = files;
      });
    },
  })),
);

export const fileStore = useFileStore;
