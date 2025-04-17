import { View, VtkObjectConstructor } from '@/core/types';
import { vtkWarningMacro } from '@kitware/vtk.js/macros';
import vtkInteractorStyle from '@kitware/vtk.js/Rendering/Core/InteractorStyle';
import { useEffect } from 'react';

export function useVtkInteractorStyle<T extends vtkInteractorStyle>(
  vtkCtor: VtkObjectConstructor<T>,
  view: View,
) {
  const style = vtkCtor.newInstance();

  if (view.interactor.getInteractorStyle()) {
    vtkWarningMacro('Overwriting existing interactor style');
  }
  view.interactor.setInteractorStyle(style);

  useEffect(() => {
    return () => {
      view.interactor.setInteractorStyle(null);
      style.delete();
    };
  }, [style, view.interactor]);

  return { interactorStyle: style };
}
