module.exports = {
  name: 'Bar Chart',
  specType: 'vega-lite',
  channels: [
    { name: 'x', required: true },
    { name: 'y', required: true },
    { name: 'color', required: false }
  ],
  spec: {
    mark: 'bar'
  }
};
