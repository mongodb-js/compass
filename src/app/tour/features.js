module.exports = [
  {
    title: 'Choose a Collection',
    description: 'See a list of collections in the left sidebar. Select a collection and Compass will instantly start analyzing the schema data. Use the search filter at the top to narrow your list of collections.',
    image: 'choose-collection.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'Browse the Schema',
    description: 'Once a collection is loaded, Compass will visualize the collection schema. Field are listed as rows in the main view. The left side of the row displays the field name and datatype distribution, the right side displays a visualization of the data.',
    image: 'browse-schema.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'View Data Distribution',
    description: 'View the charts in the right-hand column of each row to see data distribution at a high level. Hover over charts to see more detail.',
    image: 'data-distribution.gif',
    version: '1.0.0',
    initial: false
  },
  {
    title: 'Build Queries',
    description: 'Click on charts to build MongoDB queries. Click and drag within bar charts to select multiple values. Edit your query by typing directly into the query bar.',
    image: 'build-queries.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'View Documents',
    description: 'Click the Documents tab to view the raw JSON documents in the result set.',
    image: 'documents.gif',
    version: '1.0.0',
    initial: true
  },
  {
    title: 'View Indexes',
    description: 'Click the Index tab to view the definition, attributes, size, and usage of your indexes.',
    image: 'indexes.gif',
    version: '1.2.0',
    initial: true
  },
  {
    title: 'Examine Query Performance with the Explain Plan',
    description: 'Click the Explain Plan tab to view a performance summary of the executed query and get access to the detailed explain plan report.',
    image: 'explain-plan.gif',
    version: '1.2.0',
    initial: true
  },
  {
    title: 'Find using the Location Map',
    description: 'Maps will display in collections with location data. Click and drag across the map for a geographic query. Click "Apply" to resample with the coordinates.',
    image: 'geo.gif',
    version: '1.3.0-beta.1',
    initial: true
  },
  {
    title: 'CRUD Support',
    description: 'From documents tab, make changes to your dataset. Click insert to add a document. Each document has clone or delete actions, along with the ability to edit the fields.',
    image: 'crud.gif',
    version: '1.3.0-beta.1',
    initial: true
  }
];
