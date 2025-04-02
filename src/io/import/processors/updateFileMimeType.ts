import { getFileMimeType } from '@/io';
import { ImportHandler } from '../common';

const updateFileMimeType: ImportHandler = async (dataSource) => {
  let src = dataSource;
  const { fileSrc } = src;
  if (fileSrc) {
    const mime = await getFileMimeType(fileSrc.file);
    if (mime) {
      src = {
        ...src,
        fileSrc: {
          ...fileSrc,
          fileType: mime,
        },
      };
    }
  }
  return src;
};

export default updateFileMimeType;
