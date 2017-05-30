module.exports = {
  name: 'Area Chart',
  order: 13,
  specType: 'vega-lite',
  channels: [
    { name: 'x', required: true },
    { name: 'y', required: true },
    { name: 'color', required: false }
  ],
  spec: {
    mark: 'area'
  }
};
