import { extractFilesFromZip } from '@/io/zip';
import { ImportHandler, isArchive } from '../common';

const extractArchive: ImportHandler = async (dataSource, { execute, done }) => {
  if (isArchive(dataSource)) {
    const files = await extractFilesFromZip(dataSource.fileSrc.file);
    files.forEach((entry) => {
      execute({
        fileSrc: {
          file: entry.file,
          fileType: '',
        },
        archiveSrc: {
          path: `${entry.archivePath}/${entry.file.name}`,
        },
        parent: dataSource,
      });
    });
    return done();
  }
  return dataSource;
};

export default extractArchive;
