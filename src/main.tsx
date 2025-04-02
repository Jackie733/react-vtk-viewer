import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerAllReaders } from './io/readers.ts';
import { FILE_READERS } from './io/index.ts';
import { initItkWorker } from './io/itk/worker.ts';

initItkWorker();
registerAllReaders(FILE_READERS);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
