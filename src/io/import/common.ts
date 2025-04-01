import { FetchCache } from '@/utils/fetch';
import { Config } from './configJson';
import { DataSource } from './dataSource';
import { Handler } from '@/core/pipeline';

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
