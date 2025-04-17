import VtkSliceView from './vtk-slice-view';

export default function View() {
  return (
    <>
      <VtkSliceView
        viewId="Coronal"
        imageId="1"
        viewDirection="Posterior"
        viewUp="Superior"
      ></VtkSliceView>
    </>
  );
}
