import Pipeline, {
  PipelineResult,
  PipelineResultSuccess,
} from '@/core/pipeline';
import {
  ImportHandler,
  ImportResult,
  VolumeResult,
  isLoadableResult,
  isConfigResult,
} from './common';
import { DataSource, DataSourceWithFile } from './dataSource';
import { applyConfig } from './configJson';
import updateFileMimeType from './processors/updateFileMimeType';
import handleDicomFile from './processors/handleDicomFile';
import extractArchive from './processors/extractArchive';

function toMeaningfulErrorString(thrown: unknown) {
  const strThrown = String(thrown);
  if (!strThrown || strThrown === '[object Object]') {
    return 'Unknown error. More details in the dev console.';
  }
  return strThrown;
}

const unhandledResource: ImportHandler = () => {
  throw new Error('Failed to handle resource');
};

function isSelectable(
  result: PipelineResult<DataSource, ImportResult>,
): result is PipelineResultSuccess<VolumeResult> {
  if (!result.ok) return false;
  if (result.data.length === 0) return false;
  const importResult = result.data[0];
  if (!isLoadableResult(importResult)) {
    return false;
  }
  if (importResult.dataType === 'model') {
    return false;
  }
  return true;
}

const importConfigs = async (
  results: Array<PipelineResult<DataSource, ImportResult>>,
) => {
  try {
    results
      .flatMap((pipelineResult) =>
        pipelineResult.ok ? pipelineResult.data : [],
      )
      .filter(isConfigResult)
      .map(({ config }) => config)
      .forEach(applyConfig);
    return {
      ok: true as const,
      data: [],
    };
  } catch (err) {
    return {
      ok: false as const,
      errors: [
        {
          message: toMeaningfulErrorString(err),
          cause: err,
          inputDataStackTrace: [],
        },
      ],
    };
  }
};

const importDicomFiles = async (
  dicomDataSources: Array<DataSourceWithFile>,
) => {
  const resultSources: DataSource = {
    dicomSrc: {
      sources: dicomDataSources,
    },
  };
  try {
    if (!dicomDataSources.length) {
      return {
        ok: true as const,
        data: [],
      };
    }
    // TODO: await useDICOMStore().importFiles(dicomDataSources)
    const volumeKeys: any = [];
    return {
      ok: true as const,
      data: volumeKeys.map((key) => ({
        dataID: key,
        dataType: 'dicom' as const,
        dataSource: resultSources,
      })),
    };
  } catch (err) {
    return {
      ok: false as const,
      errors: [
        {
          message: toMeaningfulErrorString(err),
          cause: err,
          inputDataStackTrace: [resultSources],
        },
      ],
    };
  }
};

export async function importDataSources(dataSources: DataSource[]) {
  const importContext = {
    fetchFileCache: new Map<string, File>(),
    dicomDataSources: [] as DataSourceWithFile[],
  };

  const middleware = [
    updateFileMimeType,
    extractArchive,
    handleDicomFile,
    unhandledResource,
  ];
  const loader = new Pipeline(middleware);

  const results = await Promise.all(
    dataSources.map((r) => loader.execute(r, importContext)),
  );

  const configResult = await importConfigs(results);
  const dicomResult = await importDicomFiles(importContext.dicomDataSources);

  return [...results, dicomResult, configResult].filter(
    (result) => !result.ok || isSelectable(result),
  );
}

export type ImportDataSourcesResult = Awaited<
  ReturnType<typeof importDataSources>
>[number];

export function toDataSelection(loadable: VolumeResult) {
  const { dataID } = loadable;
  return dataID;
}
