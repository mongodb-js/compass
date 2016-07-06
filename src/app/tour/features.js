module.exports = [
  {
    title: 'Choose a Collection',
    description: 'See a list of collections in the left sidebar. Select a collection and Compass will instantly start analyzing the schema data. Use the search filter at the top to narrow your list of collections.',
    image: 'f0.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'Browse the Schema',
    description: 'Once a collection is loaded Compass will visualize the collection schema. Field are listed as rows in the main view. The left side of the row displays the field name and datatype distribution, the right side displays a visualization of the data.',
    image: 'f1.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'View Data Distribution',
    description: 'View the charts in the right-hand column of each row to see data distribution at a high level. Hover over charts to see more detail.',
    image: 'f2.gif',
    version: '1.0.0',
    initial: false
  },
  {
    title: 'Build Queries',
    description: 'Click on charts to build MongoDB queries. Click and drag within bar charts to select multiple values. Edit your query by typing directly into the query bar.',
    image: 'f3.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'View Documents',
    description: 'Click the Documents tab to view the raw JSON documents in the result set.',
    image: 'f4.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'View Indexes',
    description: 'Click the Index tab to view the definition, attributes, size, and usage of your indexes.',
    image: 'f5.gif',
    version: '1.2.0',
    initial: true
  },
  {
    title: 'Examine Query Performance with Explain Plans',
    description: 'Click the Explain Plan tab to view a performance summary of the executed query and get access to the detailed explain plan report.',
    image: 'f7.gif',
    version: '1.2.0',
    initial: false
  },
  {
    title: 'Show Explain plans as tree charts',
    description: 'In the Explain Plan tab, click on "Show as: Visual Tree" to see a tree chart of the explain plan.',
    image: 'f8.gif',
    version: '1.3.0-beta.1',
    initial: false
  },
  {
    title: 'Geo Location Queries',
    description: 'Collections with location data can be used as a filter. Click and drag across the map for a geographic query. Click "Apply" to resample with the coordinates.',
    image: 'f6.gif',
    version: '1.3.0-beta.1',
    initial: true
  }
];
