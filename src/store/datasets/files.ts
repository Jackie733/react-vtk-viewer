import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DataSourceWithFile } from '@/io/import/dataSource';

type FileState = {
  byDataID: Record<string, DataSourceWithFile[]>;
};

type FileAction = {
  remove: (dataID: string) => void;
  add: (dataID: string, files: DataSourceWithFile[]) => void;
};

export const useFileStore = create<FileState & FileAction>()(
  immer((set) => ({
    byDataID: {},

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

export const getDataSources = (dataID: string) => {
  const { byDataID } = useFileStore.getState();
  return byDataID[dataID] ?? [];
};

export const getFiles = (dataID: string) => {
  const { byDataID } = useFileStore.getState();
  return (byDataID[dataID] ?? []).map((ds) => ds.fileSrc.file);
};
