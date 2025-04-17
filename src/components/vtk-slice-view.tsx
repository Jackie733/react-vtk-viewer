import { ReactNode, useCallback, useEffect, useRef } from 'react';
import vtkInteractorStyleManipulator from '@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator';
import { useVtkInteractorStyle } from '@/hooks/use-vtk-interactor-style';
import { useVtkView } from '@/hooks/use-vtk-view';
import { useAutoFitState } from '@/hooks/use-auto-fit-state';
import { resetCameraToImage, resizeToFitImage } from '@/utils/camera';
import { useImage } from '@/hooks/use-current-image';
import { Maybe } from '@/types';
import { LPSAxisDir } from '@/types/lps';

// 容器样式
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};

interface Props {
  viewId: string;
  imageId: Maybe<string>;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
  disableAutoResetCamera?: boolean;
  children?: ReactNode;
  className?: string;
}

export default function VtkSliceView({
  viewId,
  imageId,
  viewDirection,
  viewUp,
  disableAutoResetCamera,
  children,
  className,
}: Props) {
  const { metadata: imageMetadata } = useImage(imageId);
  const containerRef = useRef<HTMLDivElement>(null);
  const view = useVtkView(containerRef);

  view.renderer.setBackground(0, 0, 0);
  view.renderer.getActiveCamera().setParallelProjection(true);

  // 使用钩子但不使用返回值
  useVtkInteractorStyle(vtkInteractorStyleManipulator, view);

  const { autoFit, withAutoFitEffect } = useAutoFitState(
    view.renderer.getActiveCamera(),
  );

  const autoFitImage = useCallback(() => {
    if (!autoFit.current) return;
    withAutoFitEffect(() => {
      resizeToFitImage(view, imageMetadata, viewDirection, viewUp);
    });
  }, [autoFit, withAutoFitEffect, view, imageMetadata, viewDirection, viewUp]);

  const resetCamera = useCallback(() => {
    autoFit.current = true;
    withAutoFitEffect(() => {
      resetCameraToImage(view, imageMetadata, viewDirection, viewUp);
      autoFitImage();
    });
  }, [
    autoFit,
    withAutoFitEffect,
    view,
    imageMetadata,
    viewDirection,
    viewUp,
    autoFitImage,
  ]);

  useEffect(() => {
    if (disableAutoResetCamera) return;
    resetCamera();
  }, [disableAutoResetCamera, viewId, imageId, resetCamera]);

  // 确保渲染器大小适应容器大小变化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        view.requestRender({ immediate: true });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [view]);

  return (
    <div ref={containerRef} style={containerStyle} className={className}>
      {children}
    </div>
  );
}
