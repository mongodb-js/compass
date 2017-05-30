module.exports = {
  name: 'Scatter Plot',
  specType: 'vega-lite',
  channels: [
    { name: 'x', required: true },
    { name: 'y', required: true },
    { name: 'size', required: false },
    { name: 'color', required: false },
    { name: 'shape', required: false }
  ],
  spec: {
    mark: 'point'
  }
};
