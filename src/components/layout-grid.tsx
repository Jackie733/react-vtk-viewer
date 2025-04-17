import React from 'react';
import { Layout, LayoutDirection } from '@/types/layout';
import { useViewStore } from '@/store/view';
import View from './view';
import './styles/layout.css';

// 定义视图类型到组件的映射
const ViewTypeToComponent: Record<string, React.ComponentType<any>> = {
  '2D': View,
  // 其他视图类型可以根据需要添加
};

interface LayoutGridProps {
  layout: Layout;
}

const LayoutGrid: React.FC<LayoutGridProps> = ({ layout }) => {
  const viewStore = useViewStore();
  const { viewSpecs, setActiveViewID } = viewStore;

  // 计算flex布局方向
  const flexDirection =
    layout.direction === LayoutDirection.H ? 'column' : 'row';

  // 处理视图聚焦
  const handleFocusView = (id: string, type: string) => {
    if (type === '2D') {
      setActiveViewID(id);
    }
  };

  // 处理布局项
  const renderItems = () => {
    console.log('layout', layout);
    console.log('viewSpecs', viewSpecs);

    return layout.items.map((item, index) => {
      if (typeof item === 'string') {
        // 是视图ID
        const spec = viewSpecs[item];

        if (!spec) {
          return <div key={index}>视图未找到: {item}</div>;
        }

        const ViewComponent = ViewTypeToComponent[spec.viewType];

        if (!ViewComponent) {
          return <div key={index}>未找到组件类型: {spec.viewType}</div>;
        }

        return (
          <div
            key={index}
            className="layout-item"
            onClick={() => handleFocusView(item, spec.viewType)}
          >
            <ViewComponent
              id={item}
              viewId={item}
              type={spec.viewType}
              {...spec.props}
            />
          </div>
        );
      } else {
        // 是嵌套布局
        return (
          <div key={index} className="d-flex flex-equal">
            <LayoutGrid layout={item} />
          </div>
        );
      }
    });
  };

  return (
    <div
      className={`layout-container flex-equal ${layout.direction === LayoutDirection.H ? 'flex-column' : 'flex-row'}`}
      style={{ flexDirection }}
      data-testid="layout-grid"
    >
      {renderItems()}
    </div>
  );
};

export default LayoutGrid;
