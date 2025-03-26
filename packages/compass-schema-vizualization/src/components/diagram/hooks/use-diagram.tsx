import { useReactFlow } from 'reactflow';

export const useDiagram = () => {
  const {
    fitView,
    setViewport,
    getViewport,
    getNode,
    getEdge,
    viewportInitialized,
    zoomIn,
    zoomOut,
  } = useReactFlow();
  return {
    fitView,
    setViewport,
    getViewport,
    getNode,
    getEdge,
    viewportInitialized,
    zoomIn,
    zoomOut,
  };
};
