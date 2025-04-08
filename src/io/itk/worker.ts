import {
  readDicomTags,
  readImageDicomFileSeriesWorkerFunction,
} from '@itk-wasm/dicom';
import { readImage } from '@itk-wasm/image-io';
import { getDefaultWebWorker, WorkerPool } from 'itk-wasm';

const DEFAULT_NUM_WORKERS = 4;

let readDicomSeriesWorkerPool: WorkerPool | null = null;
let webWorker: Worker | null = null;

export async function ensureWorker() {
  if (webWorker) return;
  webWorker = getDefaultWebWorker();
}

export function ensureDicomSeriesWorkerPool() {
  if (readDicomSeriesWorkerPool) return;
  const numberOfWorkers =
    typeof globalThis.navigator?.hardwareConcurrency === 'number'
      ? globalThis.navigator.hardwareConcurrency
      : DEFAULT_NUM_WORKERS;
  readDicomSeriesWorkerPool = new WorkerPool(
    numberOfWorkers,
    readImageDicomFileSeriesWorkerFunction,
  );
}

export function getWorker() {
  return webWorker;
}

export function getDicomSeriesWorkerPool() {
  return readDicomSeriesWorkerPool;
}

export async function initItkWorker() {
  await Promise.all([ensureWorker(), ensureDicomSeriesWorkerPool()]);

  try {
    await readDicomTags(new File([], 'a.dcm'));
  } catch (error) {
    console.info('init read dicom tags', error);
  }

  try {
    await readImage(new File([], 'a.dcm'));
  } catch (error) {
    console.info('init read image', error);
  }
}
