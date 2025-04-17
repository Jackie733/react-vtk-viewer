import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import { Image } from 'itk-wasm';
import * as DICOM from '@/io/dicom';
import { fileStore, useFileStore } from './files';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { DataSourceWithFile } from '@/io/import/dataSource';
import { identity, pick, removeFromArray } from '@/utils';
import { useImageStore } from './images';

export const ANONYMOUS_PATIENT = 'Anonymous';
export const ANONYMOUS_PATIENT_ID = 'ANONYMOUS';

export function imageCacheMultiKey(offset: number, asThumbnail: boolean) {
  return `${offset}!!${asThumbnail}`;
}

export interface VolumeKeys {
  patientKey: string;
  studyKey: string;
  volumeKey: string;
}

export interface PatientInfo {
  PatientID: string;
  PatientName: string;
  PatientBirthDate: string;
  PatientSex: string;
}

export interface StudyInfo {
  StudyID: string;
  StudyInstanceUID: string;
  StudyDate: string;
  StudyTime: string;
  AccessionNumber: string;
  StudyDescription: string;
}

export interface VolumeInfo {
  NumberOfSlices: number;
  VolumeID: string;
  Modality: string;
  SeriesInstanceUID: string;
  SeriesNumber: string;
  SeriesDescription: string;
  WindowLevel: string;
  WindowWidth: string;
}

const buildImage = async (seriesFiles: File[], modality: string) => {
  const messages: string[] = [];
  if (modality === 'SEG') {
    const segFile = seriesFiles[0];
    const results = await DICOM.buildSegmentGroups(segFile);
    if (seriesFiles.length > 1) {
      messages.push(
        'Tried to make one volume from 2 SEG modality files. Using only the first file!',
      );
    }
    return {
      modality: 'SEG',
      builtImageResults: results,
      messages,
    };
  }
  return {
    builtImageResults: await DICOM.buildImage(seriesFiles),
    messages,
  };
};

const constructImage = async (volumeKey: string, volumeInfo: VolumeInfo) => {
  const files = fileStore.getState().getFiles(volumeKey);
  if (!files) throw new Error('No files for volume key');
  const results = await buildImage(files, volumeInfo.Modality);
  const image = vtkITKHelper.convertItkToVtkImage(
    results.builtImageResults.outputImage,
  );
  return {
    ...results,
    image,
  };
};

const readDicomTags = (file: File) =>
  DICOM.readTags(file, [
    { name: 'PatientName', tag: '0010|0010', strconv: true },
    { name: 'PatientID', tag: '0010|0020', strconv: true },
    { name: 'PatientBirthDate', tag: '0010|0030' },
    { name: 'PatientSex', tag: '0010|0040' },
    { name: 'StudyInstanceUID', tag: '0020|000d' },
    { name: 'StudyDate', tag: '0008|0020' },
    { name: 'StudyTime', tag: '0008|0030' },
    { name: 'StudyID', tag: '0020|0010', strconv: true },
    { name: 'AccessionNumber', tag: '0008|0050' },
    { name: 'StudyDescription', tag: '0008|1030', strconv: true },
    { name: 'Modality', tag: '0008|0060' },
    { name: 'SeriesInstanceUID', tag: '0020|000e' },
    { name: 'SeriesNumber', tag: '0020|0011' },
    { name: 'SeriesDescription', tag: '0008|103e', strconv: true },
    { name: 'WindowLevel', tag: '0028|1050' },
    { name: 'WindowWidth', tag: '0028|1051' },
  ]);

/**
 * Trims and collapses multiple spaces into one.
 * @param name
 * @returns string
 */
const cleanupName = (name: string) => {
  return name.trim().replace(/\s+/g, ' ');
};

export const getDisplayName = (info: VolumeInfo) => {
  return (
    cleanupName(info.SeriesDescription || info.SeriesNumber) ||
    info.SeriesInstanceUID
  );
};

export const getWindowLevels = (info: VolumeInfo) => {
  const { WindowWidth, WindowLevel } = info;
  if (
    WindowWidth == null ||
    WindowLevel == null ||
    WindowWidth === '' ||
    WindowLevel === ''
  )
    return []; // missing tag
  const widths = WindowWidth.split('\\').map(parseFloat);
  const levels = WindowLevel.split('\\').map(parseFloat);
  if (
    widths.some((w) => Number.isNaN(w)) ||
    levels.some((l) => Number.isNaN(l))
  ) {
    console.error('Invalid WindowWidth or WindowLevel DICOM tags');
    return [];
  }
  if (widths.length !== levels.length) {
    console.error(
      'Different numbers of WindowWidth and WindowLevel DICOM tags',
    );
    return [];
  }
  return widths.map((width, i) => ({ width, level: levels[i] }));
};

type DicomState = {
  // volumeKey -> imageCacheMultiKey -> ITKImage
  sliceData: Record<string, Record<string, Image>>;
  // volume invalidation information
  needsRebuild: Record<string, boolean>;
  // Avoid recomputing image data for the same volume by checking state for existing buildVolume tasks
  volumeBuildResults: Record<string, ReturnType<typeof constructImage>>;
  // patientKey -> patient info
  patientInfo: Record<string, PatientInfo>;
  // patientKey -> array of studyKeys
  patientStudies: Record<string, string[]>;
  // studyKey -> study info
  studyInfo: Record<string, StudyInfo>;
  // studyKey -> array of volumeKeys
  studyVolumes: Record<string, string[]>;
  // volumeKey -> volume info
  volumeInfo: Record<string, VolumeInfo>;
  // parent pointers
  // volumeKey -> studyKey
  volumeStudy: Record<string, string>;
  // studyKey -> patientKey
  studyPatient: Record<string, string>;
};

type DicomAction = {
  importFiles: (datasets: DataSourceWithFile[]) => Promise<string[]>;
  _updateDatabase: (
    patient: PatientInfo,
    study: StudyInfo,
    volume: VolumeInfo,
  ) => void;
  deleteVolume: (volumeKey: string) => void;
  _deleteStudy: (studyKey: string) => void;
  _deletePatient: (patientKey: string) => void;
  getVolumeSlice: (
    volumeKey: string,
    sliceIndex: number,
    asThumbnail?: boolean,
  ) => Promise<Image>;
  getVolumeThumbnail: (volumeKey: string) => Promise<Image>;
  buildVolume: (volumeKey: string, forceRebuild?: boolean) => Promise<any>;
};

export const useDICOMStore = create<DicomState & DicomAction>()(
  immer((set, get) => ({
    sliceData: {},
    volumeBuildResults: {},
    patientInfo: {},
    patientStudies: {},
    studyInfo: {},
    studyVolumes: {},
    volumeInfo: {},
    volumeStudy: {},
    studyPatient: {},
    needsRebuild: {},

    async importFiles(datasets: DataSourceWithFile[]) {
      if (!datasets.length) return [];

      const fileToDataSource = new Map(
        datasets.map((ds) => [ds.fileSrc.file, ds]),
      );
      const allFiles = [...fileToDataSource.keys()];

      const volumeToFiles = await DICOM.splitAndSort(allFiles, identity);
      if (Object.keys(volumeToFiles).length === 0)
        throw new Error('No volumes categorized from DICOM file(s)');

      const fileStore = useFileStore.getState();

      // Link VolumeKey and DatasetFiles in fileStore
      Object.entries(volumeToFiles).forEach(([volumeKey, files]) => {
        const volumeDatasetFiles = files.map((file) => {
          const source = fileToDataSource.get(file);
          if (!source)
            throw new Error('Did not match File with source DataSource');
          return source;
        });
        fileStore.add(volumeKey, volumeDatasetFiles);
      });

      await Promise.all(
        Object.entries(volumeToFiles).map(async ([volumeKey, files]) => {
          // Read tags of first file
          const state = get();
          if (!(volumeKey in state.volumeInfo)) {
            const rawTags = await readDicomTags(files[0]);
            // trim whitespace from all values
            const tags = Object.fromEntries(
              Object.entries(rawTags).map(([key, value]) => [
                key,
                value.trim(),
              ]),
            );
            // TODO parse the raw string values
            const patient = {
              PatientID: tags.PatientID || ANONYMOUS_PATIENT_ID,
              PatientName: tags.PatientName || ANONYMOUS_PATIENT,
              PatientBirthDate: tags.PatientBirthDate || '',
              PatientSex: tags.PatientSex || '',
            };

            const study = pick(
              tags,
              'StudyID',
              'StudyInstanceUID',
              'StudyDate',
              'StudyTime',
              'AccessionNumber',
              'StudyDescription',
            );

            const volumeInfo = {
              ...pick(
                tags,
                'Modality',
                'SeriesInstanceUID',
                'SeriesNumber',
                'SeriesDescription',
                'WindowLevel',
                'WindowWidth',
              ),
              NumberOfSlices: files.length,
              VolumeID: volumeKey,
            };

            get()._updateDatabase(patient, study, volumeInfo);
          }

          // invalidate any existing volume
          const imageStore = useImageStore.getState();
          if (volumeKey in imageStore.dataIndex) {
            // buildVolume requestor uses this as a rebuild hint
            set((state) => {
              state.needsRebuild[volumeKey] = true;
            });
          }
        }),
      );

      return Object.keys(volumeToFiles);
    },

    _updateDatabase: (patient, study, volume) =>
      set((state) => {
        const patientKey = patient.PatientID;
        const studyKey = study.StudyInstanceUID;
        const volumeKey = volume.VolumeID;

        if (!(patientKey in state.patientInfo)) {
          state.patientInfo[patientKey] = patient;
          state.patientStudies[patientKey] = [];
        }

        if (!(studyKey in state.studyInfo)) {
          state.studyInfo[studyKey] = study;
          state.studyVolumes[studyKey] = [];
          state.studyPatient[studyKey] = patientKey;
          state.patientStudies[patientKey].push(studyKey);
        }

        if (!(volumeKey in state.volumeInfo)) {
          state.volumeInfo[volumeKey] = volume;
          state.volumeStudy[volumeKey] = studyKey;
          state.sliceData[volumeKey] = {};
          state.studyVolumes[studyKey].push(volumeKey);
        }
      }),

    // updateNeedsRebuild: (key, val) =>
    //   set((state) => {
    //     state.needsRebuild[key] = val;
    //   }),

    // You should probably call datasetStore.remove instead as this does not
    // remove files/images/layers associated with the volume
    deleteVolume(volumeKey: string) {
      set((state) => {
        if (volumeKey in state.volumeInfo) {
          const studyKey = state.volumeStudy[volumeKey];
          delete state.volumeInfo[volumeKey];
          delete state.sliceData[volumeKey];
          delete state.volumeStudy[volumeKey];

          if (volumeKey in state.volumeBuildResults) {
            delete state.volumeBuildResults[volumeKey];
          }

          removeFromArray(state.studyVolumes[studyKey], volumeKey);
          if (state.studyVolumes[studyKey].length === 0) {
            get()._deleteStudy(studyKey);
          }
        }
      });
    },

    _deleteStudy(studyKey: string) {
      set((state) => {
        if (studyKey in state.studyInfo) {
          const patientKey = state.studyPatient[studyKey];
          delete state.studyInfo[studyKey];
          delete state.studyPatient[studyKey];

          const volumeKeysToDelete = [...state.studyVolumes[studyKey]];
          delete state.studyVolumes[studyKey];

          volumeKeysToDelete.forEach((volumeKey) => {
            get().deleteVolume(volumeKey);
          });

          removeFromArray(state.patientStudies[patientKey], studyKey);
          if (state.patientStudies[patientKey].length === 0) {
            get()._deletePatient(patientKey);
          }
        }
      });
    },

    _deletePatient(patientKey: string) {
      set((state) => {
        if (patientKey in state.patientInfo) {
          delete state.patientInfo[patientKey];

          const studyKeysToDelete = [...state.patientStudies[patientKey]];
          delete state.patientStudies[patientKey];

          studyKeysToDelete.forEach((studyKey) => {
            get()._deleteStudy(studyKey);
          });
        }
      });
    },

    // returns an ITK image object
    async getVolumeSlice(
      volumeKey: string,
      sliceIndex: number,
      asThumbnail = false,
    ) {
      const state = get();
      const fileStore = useFileStore.getState();

      const cacheKey = imageCacheMultiKey(sliceIndex, asThumbnail);
      if (
        volumeKey in state.sliceData &&
        cacheKey in state.sliceData[volumeKey]
      ) {
        return state.sliceData[volumeKey][cacheKey];
      }

      if (!(volumeKey in state.volumeInfo)) {
        throw new Error(`Cannot find given volume key: ${volumeKey}`);
      }
      const volumeInfo = state.volumeInfo[volumeKey];
      const numSlices = volumeInfo.NumberOfSlices;

      if (sliceIndex < 1 || sliceIndex > numSlices) {
        throw new Error(`Slice ${sliceIndex} is out of bounds`);
      }

      const volumeFiles = fileStore.getFiles(volumeKey);

      if (!volumeFiles) {
        throw new Error(`No files found for volume key: ${volumeKey}`);
      }

      const sliceFile = volumeFiles[sliceIndex - 1];

      const itkImage = await DICOM.readVolumeSlice(sliceFile, asThumbnail);

      set((state) => {
        state.sliceData[volumeKey][cacheKey] = itkImage;
      });

      return itkImage;
    },

    // returns an ITK image object
    async getVolumeThumbnail(volumeKey: string) {
      const { NumberOfSlices } = get().volumeInfo[volumeKey];
      const middleSlice = Math.ceil(NumberOfSlices / 2);
      return get().getVolumeSlice(volumeKey, middleSlice, true);
    },

    async buildVolume(volumeKey: string, forceRebuild: boolean = false) {
      const state = get();
      const imageStore = useImageStore.getState();

      const alreadyBuilt = volumeKey in state.volumeBuildResults;
      const buildNeeded =
        forceRebuild || state.needsRebuild[volumeKey] || !alreadyBuilt;

      set((state) => {
        delete state.needsRebuild[volumeKey];
      });

      // wait for old buildVolume call so we can run imageStore update side effects after
      const oldImagePromise = alreadyBuilt
        ? [state.volumeBuildResults[volumeKey]]
        : [];
      // actually build volume or wait for existing build?
      const newVolumeBuildResults = buildNeeded
        ? constructImage(volumeKey, state.volumeInfo[volumeKey])
        : state.volumeBuildResults[volumeKey];

      // let other calls to buildVolume reuse this constructImage work
      set((state) => {
        state.volumeBuildResults[volumeKey] = newVolumeBuildResults;
      });

      const [volumeBuildResults] = await Promise.all([
        newVolumeBuildResults,
        ...oldImagePromise,
      ]);

      // update image store
      const imageExists = imageStore.dataIndex[volumeKey];
      if (imageExists) {
        // was a rebuild
        imageStore.updateData(volumeKey, volumeBuildResults.image);
      } else {
        const info = state.volumeInfo[volumeKey];
        const name = getDisplayName(info);
        imageStore.addVTKImageData(name, volumeBuildResults.image, volumeKey);
      }

      volumeBuildResults.messages.forEach((message) => {
        console.warn(message);
      });

      return volumeBuildResults;
    },
  })),
);

export const dicomStore = useDICOMStore;
