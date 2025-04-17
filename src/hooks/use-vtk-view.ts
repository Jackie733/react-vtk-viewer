import { RefObject, useEffect } from 'react';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import { batchForNextTask } from '@/utils/batchForNextTask';
import { useElementSize } from './use-element-size';
import { useVTKEvent } from './use-vtk-event';
import { View } from '@/core/types';

export function useWebGLRenderWindow(container: RefObject<HTMLElement | null>) {
  const renderWindowView = vtkOpenGLRenderWindow.newInstance();

  useEffect(() => {
    if (!container) return;
    renderWindowView.setContainer(container.current);

    return () => {
      renderWindowView.setContainer(null);
    };
  }, [container]);

  return renderWindowView;
}

export function useVtkView(container: RefObject<HTMLElement | null>): View {
  const renderer = vtkRenderer.newInstance();
  const renderWindow = vtkRenderWindow.newInstance();
  renderWindow.addRenderer(renderer);

  const renderWindowView = useWebGLRenderWindow(container);
  renderWindow.addView(renderWindowView);

  const interactor = vtkRenderWindowInteractor.newInstance();
  renderWindow.setInteractor(interactor);
  interactor.setView(renderWindowView);

  const deferredRender = batchForNextTask(() => {
    if (interactor.isAnimating()) return;
    renderWindow.render();
  });

  const immediateRender = () => {
    if (interactor.isAnimating()) return;
    renderWindow.render();
  };

  const requestRender = ({ immediate } = { immediate: false }) => {
    if (immediate) {
      immediateRender();
    } else {
      deferredRender();
    }
  };

  useVTKEvent(renderer, 'onModified', () => {
    requestRender();
  });

  const setSize = (width: number, height: number) => {
    const scaledWidth = Math.max(1, width * window.globalThis.devicePixelRatio);
    const scaledHeight = Math.max(
      1,
      height * window.globalThis.devicePixelRatio,
    );
    renderWindowView.setSize(scaledWidth, scaledHeight);
    requestRender({ immediate: true });
  };

  const { width, height } = useElementSize(container);

  useEffect(() => {
    setSize(width, height);
  }, [width, height]);

  useEffect(() => {
    const el = container?.current;
    if (!el) return;
    interactor.initialize();
    interactor.setContainer(el);

    return () => {
      if (interactor.getContainer()) {
        interactor.setContainer(null);
      }
      renderWindow.removeView(renderWindowView);
      renderWindow.removeRenderer(renderer);
      renderer.delete();
      renderWindow.delete();
      interactor.delete();
    };
  }, []);

  return {
    renderer,
    renderWindow,
    renderWindowView,
    interactor,
    requestRender,
  };
}
