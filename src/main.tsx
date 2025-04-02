import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Volume';
import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Glyph';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setPipelinesBaseUrl, setPipelineWorkerUrl } from 'itk-wasm';
import { setPipelinesBaseUrl as imageIoSetPipelinesBaseUrl } from '@itk-wasm/image-io';
import itkConfig from '@/io/itk/itkConfig';

import './index.css';
import App from './App.tsx';
import { registerAllReaders } from './io/readers.ts';
import { FILE_READERS } from './io/index.ts';
import { initItkWorker } from './io/itk/worker.ts';

initItkWorker();
registerAllReaders(FILE_READERS);

setPipelinesBaseUrl(itkConfig.pipelinesUrl);
setPipelineWorkerUrl(itkConfig.pipelineWorkerUrl);
imageIoSetPipelinesBaseUrl(itkConfig.imageIOUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
