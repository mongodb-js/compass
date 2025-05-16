import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Plotly from 'plotly.js';
import * as PCA from 'ml-pca';
import { Binary } from 'mongodb';
import type { Document } from 'bson';

import type { VectorEmbeddingVisualizerState } from '../stores/reducer';
import { loadDocuments, runVectorAggregation } from '../stores/visualization';
import { ErrorSummary, SpinLoader } from '@mongodb-js/compass-components';

type HoverInfo = { x: number; y: number; text: string } | null;

export interface VectorVisualizerProps {
  onFetchDocs: () => void;
  onFetchAgg: () => void;
  docs: Document[];
  aggResults: { candidates: Document[]; limited: Document[] };
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
  onFetchAgg,
  docs,
  aggResults,
  loadingDocumentsState,
  loadingDocumentsError,
}) => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [query, setQuery] = useState<string>('');
  const [shouldPlot, setShouldPlot] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loadingDocumentsState === 'initial') {
      onFetchDocs();
    }
  }, [loadingDocumentsState, onFetchDocs]);

  useEffect(() => {
    if (query) {
      onFetchAgg();
      setLoading(true);
      const timeout = setTimeout(() => {
        setShouldPlot(true);
        setLoading(false);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [query, onFetchAgg]);

  useEffect(() => {
    if (!shouldPlot) return;

    const container = document.getElementById('vector-plot');
    if (!container) return;

    const abortController = new AbortController();

    const plot = async () => {
      try {
        if (docs.length === 0) return;

        const points = normalizeTo2D(
          docs
            .map((doc) => doc.review_vec)
            .filter(Boolean)
            .slice(0, 500)
        );

        const candidateIds = new Set(
          aggResults.candidates.map((doc) => doc._id.toString())
        );
        const limitedIds = new Set(
          aggResults.limited.map((doc) => doc._id.toString())
        );

        await Plotly.newPlot(
          container,
          [
            {
              x: points.map((p) => p.x),
              y: points.map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              text: docs.map((doc) => {
                const review = doc.review || '[no text]';
                return review.length > 50
                  ? review.match(/.{1,50}/g)?.join('<br>') || review
                  : review;
              }),
              hoverinfo: 'text',
              marker: {
                size: 12,
                color: docs.map((doc) => {
                  const hasLimitedId = limitedIds.has(doc._id.toString());
                  const hasCandidateId = candidateIds.has(doc._id.toString());
                  if (hasLimitedId) return 'red';
                  if (hasCandidateId) return 'orange';
                  return 'teal';
                }),
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
          {
            responsive: true,
            displayModeBar: false,
          }
        );
      } catch (err) {
        console.error('VectorVisualizer error:', err);
      }
    };

    void plot();

    return () => {
      abortController.abort();
    };
  }, [docs, aggResults, shouldPlot]);

  const onInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputQuery = e.currentTarget.value.trim();
      if (inputQuery) {
        setQuery(inputQuery);
        setShouldPlot(false);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 10,
          position: 'absolute',
          top: '10px',
          width: '100%',
        }}
      >
        <input
          id="vector-input"
          type="text"
          placeholder="Input your vector query"
          style={{
            width: '80%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white',
          }}
          onKeyDown={onInput}
        />
      </div>

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <SpinLoader />
        </div>
      )}

      <div
        id="vector-plot"
        style={{ width: '100%', height: '100%', cursor: 'default' }}
      />

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
    aggResults: state.visualization.aggResults,
    loadingDocumentsState: state.visualization.loadingDocumentsState,
    loadingDocumentsError: state.visualization.loadingDocumentsError,
  }),
  {
    onFetchDocs: loadDocuments,
    onFetchAgg: runVectorAggregation,
  }
)(VectorVisualizer);
