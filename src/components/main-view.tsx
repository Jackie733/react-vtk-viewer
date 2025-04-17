import React from 'react';
import { Layouts } from '@/config';
import LayoutGrid from './layout-grid';
import { useViewStore } from '@/store/view';

const MainView: React.FC = () => {
  const viewStore = useViewStore();
  const { layout } = viewStore;

  // 切换布局的处理函数
  const handleLayoutChange = (layoutName: string) => {
    const newLayout = Layouts[layoutName];
    if (newLayout) {
      viewStore.setLayout(newLayout);
    }
  };

  return (
    <div
      className="main-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
      }}
    >
      <div
        className="header"
        style={{
          padding: '8px',
          borderBottom: '1px solid #ccc',
        }}
      >
        <h3>React VTK 布局演示</h3>
        <div className="layout-selectors">
          {Object.keys(Layouts).map((layoutName) => (
            <button
              key={layoutName}
              onClick={() => handleLayoutChange(layoutName)}
              style={{
                margin: '0 4px',
                padding: '4px 8px',
                background: layout.name === layoutName ? '#4c8bf5' : '#f1f1f1',
                color: layout.name === layoutName ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {layoutName}
            </button>
          ))}
        </div>
      </div>

      <div
        className="content"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <LayoutGrid layout={layout} />
      </div>
    </div>
  );
};

export default MainView;
