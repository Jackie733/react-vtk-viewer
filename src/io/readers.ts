import { convertItkToVtkImage } from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import { readImage, extensionToImageIo } from '@itk-wasm/image-io';
import { FileReaderMap } from '.';
import { FILE_EXT_TO_MIME } from './mimeTypes';
import { getWorker } from './itk/worker';

export const ITK_IMAGE_MIME_TYPES = Array.from(
  new Set(
    Array.from(extensionToImageIo.keys()).map(
      (ext) => FILE_EXT_TO_MIME[ext.toLowerCase()],
    ),
  ),
);

async function itkReader(file: File) {
  const { image } = await readImage(file, {
    webWorker: getWorker(),
  });
  return convertItkToVtkImage(image);
}

/**
 * Resets the file reader map to the default values.
 */
export function registerAllReaders(readerMap: FileReaderMap) {
  ITK_IMAGE_MIME_TYPES.forEach((mime) => {
    readerMap.set(mime, itkReader);
  });
}
