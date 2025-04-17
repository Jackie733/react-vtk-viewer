import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';

export type VtkObjectConstructor<T> = {
  newInstance(props?: any): T;
};

export interface RequestRenderOptions {
  immediate?: boolean;
}

export interface View {
  renderWindow: vtkRenderWindow;
  renderer: vtkRenderer;
  interactor: vtkRenderWindowInteractor;
  renderWindowView: vtkOpenGLRenderWindow;
  // widgetManager: vtkWidgetManager
  requestRender(options?: RequestRenderOptions): void;
}
