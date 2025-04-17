import { ThemeProvider } from './components/theme-provider';
import Layout from '@/components/layout';
import './App.css';
// import View from './components/view';
import { useImageStore } from '@/store/datasets/images';
import { useDICOMStore } from './store/datasets/dicom';
import MainView from './components/main-view';
import LayoutGrid from './components/layout-grid';
import { useViewStore } from './store/view';

function App() {
  const idList = useImageStore((state) => state.idList);
  const volumeInfo = useDICOMStore((state) => state.volumeInfo);
  const hasData = idList.length > 0 || Object.keys(volumeInfo).length > 0;
  const { layout } = useViewStore();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout>
        {hasData ? (
          <LayoutGrid layout={layout} />
        ) : (
          // <View />
          <MainView />
          // <div className="flex flex-1 items-center justify-center">No data</div>
        )}
      </Layout>
    </ThemeProvider>
  );
}

export default App;
