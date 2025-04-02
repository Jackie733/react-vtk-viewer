import { FILE_READERS } from '@/io';
import { ImportHandler } from '../common';

const importSingleFile: ImportHandler = async (dataSource, { done }) => {
  if (!dataSource.fileSrc) {
    return dataSource;
  }

  const { fileSrc } = dataSource;
  if (!FILE_READERS.has(fileSrc.fileType)) {
    return dataSource;
  }

  const reader = FILE_READERS.get(fileSrc.fileType)!;
  const dataObject = await reader(fileSrc.file);

  if (dataObject.isA('vtkImageData')) {
    // TODO: const dataID = useImageStore().addVTKImageData()
    const dataID = 'Image';
    return done({
      dataID,
      dataSource,
      dataType: 'image',
    });
  }

  if (dataObject.isA('vtkPolyData')) {
    // TODO: const dataID = useModelStore().addVTKPolyData()
    const dataID = 'Poly';
    return done({
      dataID,
      dataSource,
      dataType: 'model',
    });
  }

  throw new Error('Data reader did not produce a valid dataset');
};

export default importSingleFile;
