import { useId } from 'react';
import { vtkImageData } from '@kitware/vtk.js/Common/DataModel/ImageData';
import type { Bounds } from '@kitware/vtk.js/types';
import { mat3, mat4, vec3 } from 'gl-matrix';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { defaultLPSDirections, getLPSDirections } from '@/utils/lps';
import { ImageMetadata } from '@/types/image';
import { compareImageSpaces } from '@/utils/imageSpace';

export const defaultImageMetadata = () => ({
  name: '(none)',
  orientation: mat3.create(),
  lpsOrientation: defaultLPSDirections(),
  spacing: vec3.fromValues(1, 1, 1),
  origin: vec3.create(),
  dimensions: vec3.fromValues(1, 1, 1),
  worldBounds: [0, 1, 0, 1, 0, 1] as Bounds,
  worldToIndex: mat4.create(),
  indexToWorld: mat4.create(),
});

type ImageState = {
  idList: string[]; // list of IDs
  dataIndex: Record<string, vtkImageData>; // ID -> VTK object
  metadata: Record<string, ImageMetadata>; // ID -> metadata
};

type ImageAction = {
  addVTKImageData: (
    name: string,
    imageData: vtkImageData,
    id?: string,
  ) => string | void;
  updateData: (id: string, imageData: vtkImageData) => void;
  deleteData: (id: string) => void;
};

export const useImageStore = create<ImageState & ImageAction>()(
  immer((set) => ({
    idList: [],
    dataIndex: Object.create(null),
    metadata: Object.create(null),

    addVTKImageData: (name, imageData, id) => {
      set((state) => {
        if (id && id in state.dataIndex) {
          throw new Error('ID already exists');
        }
        const newId = useId();
        state.idList.push(newId);
        state.dataIndex[newId] = imageData;

        state.metadata[newId] = { ...defaultImageMetadata(), name };
        return newId;
      });
    },

    updateData: (id, imageData) => {
      set((state) => {
        if (id in state.metadata) {
          const metadata: ImageMetadata = {
            name: state.metadata[id].name,
            dimensions: imageData.getDimensions() as vec3,
            spacing: imageData.getSpacing() as vec3,
            origin: imageData.getOrigin() as vec3,
            orientation: imageData.getDirection(),
            lpsOrientation: getLPSDirections(imageData.getDirection()),
            worldBounds: imageData.getBounds(),
            worldToIndex: imageData.getWorldToIndex(),
            indexToWorld: imageData.getIndexToWorld(),
          };
          state.metadata[id] = metadata;
          state.dataIndex[id] = imageData;
        }
        state.dataIndex[id] = imageData;
      });
    },

    deleteData: (id) => {
      set((state) => {
        if (id in state.dataIndex) {
          state.dataIndex = Object.fromEntries(
            Object.entries(state.dataIndex).filter(([key]) => key !== id),
          );
          state.metadata = Object.fromEntries(
            Object.entries(state.metadata).filter(([key]) => key !== id),
          );
          state.idList = state.idList.filter((i) => i !== id);
        }
      });
    },
  })),
);

export const checkAllImagesSameSpace = () => {
  const { idList, dataIndex } = useImageStore.getState();
  if (idList.length < 2) return false;
  const dataFirst = dataIndex[idList[0]];
  const allEqual = idList.slice(1).every((id) => {
    return compareImageSpaces(dataIndex[id], dataFirst);
  });
  return allEqual;
};
