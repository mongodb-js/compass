import React from 'react';

const VectorVisualizer = () => {
  // Placeholder points
  const points = [
    { x: 30, y: 20 },
    { x: 80, y: 90 },
    { x: 150, y: 50 },
    { x: 200, y: 120 },
  ];

  return (
    <div>
      <h2>Vector Embedding Visualization (Placeholder)</h2>
      <svg width="300" height="200" style={{ border: '1px solid #ccc' }}>
        {points.map((point, idx) => (
          <circle key={idx} cx={point.x} cy={point.y} r={5} fill="teal" />
        ))}
      </svg>
    </div>
  );
};

export default VectorVisualizer;
