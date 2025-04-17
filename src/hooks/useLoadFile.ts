import { partitionResults, PipelineResultSuccess } from '@/core/pipeline';
import {
  ImportResult,
  isLoadableResult,
  isVolumeResult,
  LoadableResult,
  VolumeResult,
} from '@/io/import/common';
import {
  DataSource,
  fileToDataSource,
  getDataSourceName,
} from '@/io/import/dataSource';
import {
  importDataSources,
  ImportDataSourcesResult,
  toDataSelection,
} from '@/io/import/importDataSources';
import { useDatasetStore } from '@/store/datasets/datasets';
import { useDICOMStore } from '@/store/datasets/dicom';
import useLoadDataStore from '@/store/load-data';
import { nonNullable } from '@/utils';

const BASE_MODALITY_TYPES = {
  CT: { priority: 3 },
  MR: { priority: 3 },
  US: { priority: 2 },
  DX: { priority: 1 },
} as const;

function findBaseDicom(lodableDataSources: Array<LoadableResult>) {
  const dicoms = lodableDataSources.filter(
    ({ dataType }) => dataType === 'dicom',
  );
  // prefer some modalities as base
  const { volumeInfo } = useDICOMStore.getState();
  const baseDicomVolumes = dicoms
    .map((dicomSource) => {
      const baseVolumeInfo = volumeInfo[dicomSource.dataID];
      const modality =
        baseVolumeInfo?.Modality as keyof typeof BASE_MODALITY_TYPES;
      if (modality in BASE_MODALITY_TYPES) {
        return {
          dicomSource,
          priority: BASE_MODALITY_TYPES[modality].priority,
          baseVolumeInfo,
        };
      }
      return undefined;
    })
    .filter(nonNullable)
    .sort(
      (
        { priority: a, baseVolumeInfo: infoA },
        { priority: b, baseVolumeInfo: infoB },
      ) => {
        const priorityDiff = a - b;
        if (priorityDiff !== 0) return priorityDiff;
        if (!infoA.NumberOfSlices) return 1;
        if (!infoB.NumberOfSlices) return -1;
        return infoB.NumberOfSlices - infoA.NumberOfSlices;
      },
    );
  if (baseDicomVolumes.length) return baseDicomVolumes[0].dicomSource;
  return undefined;
}

function isSegmentation(extension: string, name: string) {
  if (!extension) return false;
  const extensions = name.split('.').slice(1);
  return extensions.includes(extension);
}

// does not pick segmentation images
function findBaseImage(
  loadableDataSources: Array<LoadableResult>,
  segmentGroupExtension: string,
) {
  const baseImages = loadableDataSources
    .filter(({ dataType }) => dataType === 'image')
    .filter((importResult) => {
      const name = getDataSourceName(importResult.dataSource);
      if (!name) return false;
      return !isSegmentation(segmentGroupExtension, name);
    });
  if (baseImages.length) return baseImages[0];
  return undefined;
}

// returns image and dicom sources, no config files
function filterLoadableDataSources(
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
) {
  return succeeded.flatMap((result) => {
    return result.data.filter(isLoadableResult);
  });
}

// Returns list of dataSources with file names where the name has the extension argument
// and the start of the file name matches the primary file name.
function filterMatchingNames(
  primaryDataSource: VolumeResult,
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
  extension: string,
) {
  const { volumeInfo } = useDICOMStore.getState();
  const primaryName =
    primaryDataSource.dataType === 'dicom'
      ? volumeInfo[primaryDataSource.dataID].SeriesNumber
      : getDataSourceName(primaryDataSource.dataSource);
  if (!primaryName) return [];
  const primaryNamePrefix = primaryName.split('.').slice(0, 1).join();
  return filterLoadableDataSources(succeeded)
    .filter((ds) => ds !== primaryDataSource)
    .map((importResult) => ({
      importResult,
      name: getDataSourceName(importResult.dataSource),
    }))
    .filter(({ name }) => {
      if (!name) return false;
      const hasExtension = isSegmentation(extension, name);
      const nameMatchesPrimary = name.startsWith(primaryNamePrefix);
      return hasExtension && nameMatchesPrimary;
    })
    .map(({ importResult }) => importResult);
}

function getStudyUID(volumeID: string) {
  const { volumeStudy, studyInfo } = useDICOMStore.getState();
  const studyKey = volumeStudy[volumeID];
  return studyInfo[studyKey]?.StudyInstanceUID;
}

// TODO: later add segmentGroupExtension
function findBaseDataSource(
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
  // segmentGroupExtension: string,
) {
  const loadableDataSources = filterLoadableDataSources(succeeded);
  const baseDicom = findBaseDicom(loadableDataSources);
  if (baseDicom) return baseDicom;

  // const baseImage = findBaseImage(loadableDataSources, segmentGroupExtension);
  // if (baseImage) return baseImage;
  return loadableDataSources[0];
}

function filterOtherVolumesInStudy(
  volumeID: string,
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
) {
  const targetStudyUID = getStudyUID(volumeID);
  const dicomDataSources = filterLoadableDataSources(succeeded).filter(
    ({ dataType }) => dataType === 'dicom',
  );
  return dicomDataSources.filter((ds) => {
    const sourceStudyUID = getStudyUID(ds.dataID);
    return sourceStudyUID === targetStudyUID && ds.dataID !== volumeID;
  }) as Array<VolumeResult>;
}

// TODO: Implement
// Layers a DICOM PET on a CT if found
function loadLayers() {}

// Loads other DataSources as Segment Groups:
// - DICOM SEG modalities with matching StudyUIDs.
// - DataSources that have a name like foo.segmentation.bar and the primary DataSource is named foo.baz
function loadSegmentations(
  primaryDataSource: VolumeResult,
  succeeded: Array<PipelineResultSuccess<ImportResult>>,
  segmentGroupExtension: string,
) {
  const matchingNames = filterMatchingNames(
    primaryDataSource,
    succeeded,
    segmentGroupExtension,
  ).filter(isVolumeResult);

  const { volumeInfo } = useDICOMStore.getState();
  const otherSegVolumesInStudy = filterOtherVolumesInStudy(
    primaryDataSource.dataID,
    succeeded,
  ).filter((ds) => {
    const modality = volumeInfo[ds.dataID].Modality;
    if (!modality) return false;
    return modality.trim() === 'SEG';
  });

  // TODO: useSegmentGroupStore
}

export function useLoadFile() {
  const loading = useLoadDataStore.use.isLoading();
  const startLoading = useLoadDataStore.use.startLoading();
  const stopLoading = useLoadDataStore.use.stopLoading();

  function loadDataSources(sources: DataSource[]) {
    const load = async () => {
      const { primarySelection, setPrimarySelection } =
        useDatasetStore.getState();
      let results: ImportDataSourcesResult[];
      try {
        results = await importDataSources(sources);
      } catch (error) {
        console.error(error);
        return;
      }

      const [succeeded, errored] = partitionResults(results);
      console.log(succeeded, errored);

      if (!primarySelection && succeeded.length) {
        const primaryDataSource = findBaseDataSource(succeeded);
        if (isVolumeResult(primaryDataSource)) {
          const selection = toDataSelection(primaryDataSource);
          setPrimarySelection(selection);
          // TODO: loadLayers
          // TODO: loadSegmentations
        }
      }
    };

    const wrapWithLoading = <
      T extends (...args: any[]) => void | Promise<void>,
    >(
      fn: T,
    ) => {
      return async function wrapper(...args: any[]) {
        try {
          startLoading();
          await fn(...args);
        } finally {
          stopLoading();
        }
      };
    };

    return wrapWithLoading(load)();
  }

  async function openFileDialog() {
    return new Promise<File[]>((resolve) => {
      const fileEl = document.createElement('input');
      fileEl.setAttribute('type', 'file');
      fileEl.setAttribute('multiple', 'multiple');
      fileEl.setAttribute('accept', '*');
      fileEl.addEventListener('change', () => {
        const files = [...(fileEl.files ?? [])];
        resolve(files);
      });
      fileEl.click();
    });
  }

  async function loadFiles(files: File[]) {
    const dataSources = files.map(fileToDataSource);
    return loadDataSources(dataSources);
  }

  async function loadUserPromptedFiles() {
    const files = await openFileDialog();
    return loadFiles(files);
  }

  return { loading, loadFiles, loadUserPromptedFiles };
}
