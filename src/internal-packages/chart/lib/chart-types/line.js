module.exports = {
  name: 'Line Chart',
  order: 12,
  specType: 'vega-lite',
  channels: [
    { name: 'x', required: true },
    { name: 'y', required: true },
    { name: 'color', required: false }
  ],
  spec: {
    mark: 'line'
  }
};
