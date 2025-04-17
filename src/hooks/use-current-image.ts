import { useDatasetStore } from '@/store/datasets/datasets';
import { defaultImageMetadata, imageStoreState } from '@/store/datasets/images';
import { Maybe } from '@/types';
import { createLPSBounds, getAxisBounds } from '@/utils/lps';

// Returns a spatially inflated image extent
export function getImageSpatialExtent(imageID: Maybe<string>) {
  const { dataIndex, metadata } = imageStoreState;
  if (imageID && imageID in metadata) {
    const { lpsOrientation } = metadata[imageID];
    const image = dataIndex[imageID];
    if (image) {
      const extent = image.getSpatialExtent();
      return {
        Sagittal: getAxisBounds(extent, 'Sagittal', lpsOrientation),
        Coronal: getAxisBounds(extent, 'Coronal', lpsOrientation),
        Axial: getAxisBounds(extent, 'Axial', lpsOrientation),
      };
    }
  }
  return createLPSBounds();
}

export function getImageMetadata(imageID: Maybe<string>) {
  const { metadata } = imageStoreState;
  if (!imageID) return defaultImageMetadata();
  return metadata[imageID] ?? defaultImageMetadata();
}

export function getImageData(imageID: Maybe<string>) {
  const { dataIndex } = imageStoreState;
  if (!imageID) return null;
  return dataIndex[imageID] ?? null;
}

export function getIsImageLoading(imageID: Maybe<string>) {
  if (!imageID) return false;
  const { dataIndex } = imageStoreState;
  return !dataIndex[imageID];
}

export function useImage(imageID: Maybe<string>) {
  return {
    id: imageID,
    imageData: getImageData(imageID),
    metadata: getImageMetadata(imageID),
    extent: getImageSpatialExtent(imageID),
    isLoading: getIsImageLoading(imageID),
  };
}

export function useCurrentImage() {
  const primaryImageID = useDatasetStore((state) => state.primarySelection);
  const { id, imageData, metadata, extent, isLoading } =
    useImage(primaryImageID);
  return {
    currentImageID: id,
    currentImageData: imageData,
    currentImageMetadata: metadata,
    currentImageExtent: extent,
    currentImageIsLoading: isLoading,
  };
}
