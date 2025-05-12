import React, { useEffect, useState } from 'react';
import * as Plotly from 'plotly.js-dist-min';
import Tooltip from '@leafygreen-ui/tooltip';

const VectorVisualizer = () => {
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  useEffect(() => {
    const container = document.getElementById('vector-plot');
    if (!container) return;

    Plotly.newPlot(
      container,
      [
        {
          x: [1, 2, 3, 4, 5],
          y: [10, 15, 13, 17, 12],
          mode: 'markers',
          type: 'scatter',
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
    ).then(() => {
      container.on('plotly_hover', (data: any) => {
        const point = data.points?.[0];
        if (!point) return;

        const containerRect = container.getBoundingClientRect();
        const relX = data.event.clientX - containerRect.left;
        const relY = data.event.clientY - containerRect.top;

        setHoverInfo({ x: relX, y: relY, text: point.text });
      });

      container.on('plotly_unhover', () => {
        setHoverInfo(null);
      });
    });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="vector-plot" style={{ width: '100%', height: '100%' }} />

      {hoverInfo && (
        <Tooltip
          open
          justify="middle"
          align="top"
          trigger={
            <div
              style={{
                position: 'absolute',
                left: hoverInfo.x,
                top: hoverInfo.y,
                width: 1,
                height: 1,
              }}
            />
          }
        >
          <div style={{ whiteSpace: 'nowrap' }}>{hoverInfo.text}</div>
        </Tooltip>
      )}
    </div>
  );
};

export default VectorVisualizer;
