module.exports = {
  name: 'Bar Chart',
  order: 11,
  specType: 'vega-lite',
  channels: [
    { name: 'x', required: true },
    { name: 'y', required: true },
    { name: 'color', required: false },
    { name: 'detail', required: false }
  ],
  spec: {
    mark: 'bar'
  }
};
