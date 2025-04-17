import { ImportHandler } from '../common';

const handleConfig: ImportHandler = async (dataSource) => {
  if (
    dataSource.type === 'file' &&
    dataSource.fileType === 'application/json'
  ) {
    //
  }
};

export default handleConfig;
