import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js';

type HoverInfo = {
  x: number;
  y: number;
  text: string;
} | null;

export const VectorVisualizer: React.FC = () => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);

  useEffect(() => {
    const container = document.getElementById('vector-plot');
    if (!container) return;

    let isMounted = true;

    const plot = async () => {
      await Plotly.newPlot(
        container,
        [
          {
            x: [1, 2, 3, 4, 5],
            y: [10, 15, 13, 17, 12],
            mode: 'markers',
            type: 'scatter',
            name: 'baskd',
            text: ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'],
            hoverinfo: 'none',
            marker: {
              size: 15,
              color: 'teal',
              line: { width: 1, color: '#fff' },
            },
          },
        ],
        {
          margin: { l: 40, r: 10, t: 40, b: 40 },
          hovermode: 'closest',
          hoverdistance: 30,
          dragmode: 'zoom',
          plot_bgcolor: '#f7f7f7',
          paper_bgcolor: '#f7f7f7',
          xaxis: { gridcolor: '#e0e0e0' },
          yaxis: { gridcolor: '#e0e0e0' },
        },
        { responsive: true }
      );

      const handleHover = (data: any) => {
        const point = data.points?.[0];
        if (!point) return;

        const containerRect = container.getBoundingClientRect();
        const relX = data.event.clientX - containerRect.left;
        const relY = data.event.clientY - containerRect.top;

        if (isMounted) {
          setHoverInfo({ x: relX, y: relY, text: point.text });
        }
      };

      const handleUnhover = () => {
        if (isMounted) {
          setHoverInfo(null);
        }
      };

      container.addEventListener('plotly_hover', handleHover);
      container.addEventListener('plotly_unhover', handleUnhover);

      // Cleanup
      return () => {
        isMounted = false;
        container.removeEventListener('plotly_hover', handleHover);
        container.removeEventListener('plotly_unhover', handleUnhover);
      };
    };

    let cleanup: (() => void) | undefined;
    void plot().then((c) => {
      if (typeof c === 'function') cleanup = c;
    });

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, []);

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
            whiteSpace: 'nowrap',
            zIndex: 1000,
          }}
        >
          {hoverInfo.text}
        </div>
      )}
    </div>
  );
};
