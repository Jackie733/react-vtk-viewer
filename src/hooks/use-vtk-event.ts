import { useEffect, useRef } from 'react';
import { vtkObject, vtkSubscription } from '@kitware/vtk.js/interfaces';
import { Maybe } from '@/types';

export type VTKEventHandler = (ev?: any) => any;
export type VTKEventListener = (
  handler: VTKEventHandler,
  priority?: number,
) => vtkSubscription;
export type VTKEventOptions = {
  priority?: number;
};

export function useVTKEvent<T extends vtkObject, K extends keyof T>(
  vtkObj: Maybe<T>,
  eventHookName: T[K] extends VTKEventListener ? K : never,
  callback: VTKEventHandler,
  options?: VTKEventOptions,
) {
  const subscriptionRef = useRef<Maybe<vtkSubscription>>(null);
  const callbackRef = useRef(callback);

  const cleanup = () => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
  };

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (vtkObj && vtkObj[eventHookName]) {
      const listener = vtkObj[eventHookName] as VTKEventListener;
      subscriptionRef.current = listener(
        (ev) => callbackRef.current(ev),
        options?.priority ?? 0,
      );
    }

    return cleanup;
  }, [vtkObj, eventHookName, options?.priority]);

  return {
    stop: cleanup,
  };
}
