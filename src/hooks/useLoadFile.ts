import { partitionResults } from '@/core/pipeline';
import { DataSource, fileToDataSource } from '@/io/import/dataSource';
import {
  importDataSources,
  ImportDataSourcesResult,
} from '@/io/import/importDataSources';
import useLoadDataStore from '@/store/load-data';

export function useLoadFile() {
  const loading = useLoadDataStore.use.isLoading();
  const startLoading = useLoadDataStore.use.startLoading();
  const stopLoading = useLoadDataStore.use.stopLoading();

  function loadDataSources(sources: DataSource[]) {
    const load = async () => {
      let results: ImportDataSourcesResult[];
      try {
        results = await importDataSources(sources);
      } catch (error) {
        console.error(error);
        return;
      }

      const [succeeded, errored] = partitionResults(results);
      console.log(succeeded, errored);
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
