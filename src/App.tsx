import { ThemeProvider } from './components/theme-provider';
import Layout from '@/components/layout';
import './App.css';
import View from './components/view';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Layout>
        <View />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
