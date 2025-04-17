import { useRef } from 'react';
import { usePausableVTKEvent } from './use-pausable-vtk-event';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';

export function useAutoFitState(camera: vtkCamera) {
  const autoFit = useRef(true);

  const { withPaused } = usePausableVTKEvent(camera, 'onModified', () => {
    autoFit.current = false;
  });

  return { autoFit, withAutoFitEffect: withPaused };
}
