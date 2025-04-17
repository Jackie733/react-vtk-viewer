import { dicomStore } from '@/store/datasets/dicom';
import { Maybe } from '@/types';

export type DataSelection = string;

export const selectionEquals = (a: DataSelection, b: DataSelection) => a === b;

export const isDicomImage = (imageID: Maybe<string>) => {
  if (!imageID) return false;
  const { volumeInfo } = dicomStore.getState();
  return imageID in volumeInfo;
};

export const isRegularImage = (imageID: Maybe<string>) => {
  if (!imageID) return false;
  return !isDicomImage(imageID);
};
