import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Plotly from 'plotly.js';
import * as PCA from 'ml-pca';
import type { Binary } from 'mongodb';
import type { Document } from 'bson';

import type { VectorEmbeddingVisualizerState } from '../stores/reducer';
import { loadDocuments } from '../stores/visualization';
import { ErrorSummary } from '@mongodb-js/compass-components';
import { collectionModelLocator } from '@mongodb-js/compass-app-stores/provider';

type HoverInfo = { x: number; y: number; text: string } | null;

export interface VectorVisualizerProps {
  onFetchDocs: () => void;
  docs: Document[];
  loadingDocumentsState: 'initial' | 'loading' | 'loaded' | 'error';
  loadingDocumentsError: Error | null;
}

function normalizeTo2D(vectors: Binary[]): { x: number; y: number }[] {
  const raw = vectors.map((v) => Array.from(v.toFloat32Array()));
  const pca = new PCA.PCA(raw);
  const reduced = pca.predict(raw, { nComponents: 2 }).to2DArray();
  return reduced.map(([x, y]) => ({ x, y }));
}

const VectorVisualizer: React.FC<VectorVisualizerProps> = ({
  onFetchDocs,
  docs,
  loadingDocumentsState,
  loadingDocumentsError,
}) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);

  useEffect(() => {
    if (loadingDocumentsState === 'initial') {
      // Fetch the documents when the component mounts when they aren't already loaded.
      onFetchDocs();
    }
  }, [loadingDocumentsState, onFetchDocs]);

  useEffect(() => {
    const container = document.getElementById('vector-plot');
    if (!container) return;

    const abortController = new AbortController();

    const plot = async () => {
      try {
        const vectors = docs.map((doc) => doc.review_vec).filter(Boolean);

        if (!vectors.length) return;

        const points = normalizeTo2D(vectors.slice(0, 50));

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
      abortController.abort();
    };
  }, [docs]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="vector-plot" style={{ width: '100%', height: '100%' }} />
      {loadingDocumentsError && (
        <ErrorSummary errors={loadingDocumentsError.message} />
      )}
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

export default connect(
  (state: VectorEmbeddingVisualizerState) => ({
    docs: state.visualization.docs,
    loadingDocumentsState: state.visualization.loadingDocumentsState,
    loadingDocumentsError: state.visualization.loadingDocumentsError,
  }),
  {
    onFetchDocs: loadDocuments,
  }
)(VectorVisualizer);
