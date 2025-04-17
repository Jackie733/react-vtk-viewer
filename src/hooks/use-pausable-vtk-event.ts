import { vtkObject } from '@kitware/vtk.js/interfaces';
import {
  useVTKEvent,
  VTKEventHandler,
  VTKEventListener,
  VTKEventOptions,
} from './use-vtk-event';
import { useRef } from 'react';

export function usePausableVTKEvent<T extends vtkObject, K extends keyof T>(
  vtkObj: T | null,
  eventHookName: T[K] extends VTKEventListener ? K : never,
  callback: VTKEventHandler,
  options?: VTKEventOptions,
) {
  const pausedRef = useRef(false);

  const pause = () => {
    pausedRef.current = true;
  };

  const resume = () => {
    pausedRef.current = false;
  };

  const withPaused = (fn: () => void) => {
    pause();
    try {
      fn();
    } finally {
      resume();
    }
  };

  const { stop } = useVTKEvent(
    vtkObj,
    eventHookName,
    (obj) => {
      if (!pausedRef.current) callback(obj);
    },
    options,
  );

  return {
    stop,
    pause,
    resume,
    withPaused,
  };
}
