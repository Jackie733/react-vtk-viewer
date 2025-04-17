import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  DataSelection,
  isDicomImage,
  isRegularImage,
} from '@/utils/dataSelection';
import { useDICOMStore } from './dicom';
import { useImageStore } from './images';
import { useFileStore } from './files';
import { Maybe } from '@/types';

export const DataType = {
  Image: 'Image',
  Model: 'Model',
};

interface DatasetState {
  primarySelection: Maybe<DataSelection>; // primaryImageID
}

interface DatasetAction {
  setPrimarySelection: (selection: DataSelection) => void;
  remove: (id: string | null) => void;
  removeAll: () => void;
}

export const useDatasetStore = create<DatasetState & DatasetAction>()(
  immer((set, get) => ({
    primarySelection: null,

    setPrimarySelection: (selection) =>
      set((state) => {
        state.primarySelection = selection;
        if (selection && isDicomImage(selection)) {
          const { buildVolume } = useDICOMStore.getState();
          buildVolume(selection);
        }
      }),
    remove: (id) => {
      if (!id) return;

      set((state) => {
        if (id === state.primarySelection) {
          state.primarySelection = null;
        }
      });

      const dicomStore = useDICOMStore.getState();
      const imageStore = useImageStore.getState();
      const fileStore = useFileStore.getState();
      // const layersStore = useLayersStore.getState();

      if (isDicomImage(id)) {
        dicomStore.deleteVolume(id);
      }
      imageStore.deleteData(id);

      fileStore.remove(id);
      // layersStore.remove(id);
    },
    removeAll: () => {
      const imageStore = useImageStore.getState();
      // const modelStore = useModelStore.getState();
      const remove = get().remove;

      // Create a copy to avoid iteration issue while removing data
      const imageIdCopy = [...imageStore.idList];
      imageIdCopy.forEach((id) => {
        remove(id);
      });

      // const modelIdCopy = [...modelStore.idList];
      // modelIdCopy.forEach((id) => {
      //   remove(id);
      // });
    },
  })),
);

export const selectPrimaryDataset = () => {
  const { primarySelection } = useDatasetStore.getState();
  const { dataIndex } = useImageStore.getState();
  return (primarySelection && dataIndex[primarySelection]) || null;
};

export const selectIdsAsSelections = () => {
  const dicomStore = useDICOMStore.getState();
  const imageStore = useImageStore.getState();

  const volumeKeys = Object.keys(dicomStore.volumeInfo);
  const images = imageStore.idList.filter((id) => isRegularImage(id));
  return [...volumeKeys, ...images];
};
