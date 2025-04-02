import { FetchCache } from '@/utils/fetch';
import { Config } from './configJson';
import { DataSource, FileSource } from './dataSource';
import { Handler } from '@/core/pipeline';
import { ARCHIVE_FILE_TYPES } from '../mimeTypes';

interface DataResult {
  dataSource: DataSource;
}

export interface LoadableResult extends DataResult {
  dataID: string;
  dataType: 'image' | 'dicom' | 'model';
}

export interface VolumeResult extends LoadableResult {
  dataType: 'image' | 'dicom';
}

export interface ConfigResult extends DataResult {
  config: Config;
}

export type ImportResult = LoadableResult | ConfigResult | DataResult;

export interface ImportContext {
  // Caches URL responses
  fetchFileCache?: FetchCache<File>;
  // Records dicom files
  dicomDataSources?: DataSource[];
}

export type ImportHandler = Handler<DataSource, ImportResult, ImportContext>;

export function isArchive(
  ds: DataSource,
): ds is DataSource & { fileSrc: FileSource } {
  return !!ds.fileSrc && ARCHIVE_FILE_TYPES.has(ds.fileSrc.fileType);
}

export function isLoadableResult(
  importResult: ImportResult,
): importResult is LoadableResult {
  return 'dataID' in importResult && 'dataType' in importResult;
}

export function isVolumeResult(
  importResult: ImportResult,
): importResult is VolumeResult {
  return (
    isLoadableResult(importResult) &&
    (importResult.dataType === 'image' || importResult.dataType === 'dicom')
  );
}

export function isConfigResult(
  importResult: ImportResult,
): importResult is ConfigResult {
  return 'config' in importResult;
}
