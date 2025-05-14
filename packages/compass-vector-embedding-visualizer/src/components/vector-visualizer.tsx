import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js';
const PCA = require('ml-pca');
import { Binary } from 'mongodb';

type HoverInfo = { x: number; y: number; text: string } | null;

export interface VectorVisualizerProps {
  dataService: {
    find: (
      ns: string,
      filter: Record<string, unknown>,
      options?: { limit?: number }
    ) => Promise<any[]>;
  };
  collection: { namespace: string };
}

function normalizeTo2D(vectors: Binary[]): { x: number; y: number }[] {
  const raw = vectors.map((v) => Array.from(v.toFloat32Array()));
  const pca = new PCA(raw);
  const reduced = pca.predict(raw, { nComponents: 2 }).to2DArray();
  return reduced.map(([x, y]: [number, number]) => ({ x, y }));
}

export const VectorVisualizer: React.FC<VectorVisualizerProps> = ({
  dataService,
  collection,
}) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);

  useEffect(() => {
    const container = document.getElementById('vector-plot');
    if (!container) return;

    let isMounted = true;

    const plot = async () => {
      try {
        const ns = collection?.namespace;
        if (!ns || !dataService) return;

        const docs = await dataService.find(ns, {}, { limit: 1000 });
        const vectors = docs.map((doc) => doc.review_vec).filter(Boolean);

        if (!vectors.length) return;

        const points = normalizeTo2D(vectors);

        await Plotly.newPlot(
          container,
          [
            {
              x: points.map((p) => p.x),
              y: points.map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              text: docs.map((doc) => doc.review || '[no text]'),
              hoverinfo: 'none',
              marker: {
                size: 12,
                color: 'teal',
                line: { width: 1, color: '#fff' },
              },
            },
          ],
          {
            hovermode: 'closest',
            margin: { l: 40, r: 10, t: 30, b: 30 },
            plot_bgcolor: '#f9f9f9',
            paper_bgcolor: '#f9f9f9',
          },
          { responsive: true }
        );

        const handleHover = (event: Event) => {
          const e = event as CustomEvent<{
            points: { text: string }[];
            event: MouseEvent;
          }>;

          const point = e.detail?.points?.[0];
          const mouse = e.detail?.event;
          if (!point || !mouse) return;

          const rect = container.getBoundingClientRect();
          setHoverInfo({
            x: mouse.clientX - rect.left,
            y: mouse.clientY - rect.top,
            text: point.text,
          });
        };

        const handleUnhover = () => setHoverInfo(null);

        container.addEventListener(
          'plotly_hover',
          handleHover as EventListener
        );
        container.addEventListener(
          'plotly_unhover',
          handleUnhover as EventListener
        );

        return () => {
          container.removeEventListener(
            'plotly_hover',
            handleHover as EventListener
          );
          container.removeEventListener(
            'plotly_unhover',
            handleUnhover as EventListener
          );
        };
      } catch (err) {
        console.error('VectorVisualizer error:', err);
      }
    };

    void plot();

    return () => {
      isMounted = false;
    };
  }, [collection?.namespace, dataService]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="vector-plot" style={{ width: '100%', height: '100%' }} />
      {hoverInfo && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x,
            top: hoverInfo.y,
            background: 'white',
            border: '1px solid #ccc',
            padding: '4px 8px',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
          }}
        >
          {hoverInfo.text}
        </div>
      )}
    </div>
  );
};
