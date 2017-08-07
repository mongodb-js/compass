module.exports = [
  {
    title: 'Performance Charts.',
    description: 'Real-time server statistics let you view key server metrics and database operations. Drill down into database operations easily and understand your most active collections.',
    image: 'performance.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Sidebar. Redesigned.',
    description: 'See with one glance what server you are connected to. Navigate between instance, database and collection level, with powerful filtering of your namespaces.',
    image: 'sidebar.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Visualize your Schema.',
    description: 'MongoDB Compass analyzes your documents and displays rich structures within your collections through an intuitive GUI. It allows you to quickly visualize and explore your schema to understand the frequency, types and ranges of fields in your data set.',
    image: 'schema.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Build Geo Queries.',
    description: 'Visualize, understand, and work with your geospatial data. Point and click to construct sophisticated queries, execute them with the push of a button and Compass will display your results both graphically and as sets of JSON documents.',
    image: 'geo.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Interactive Document Editor.',
    description: 'Modify existing documents with greater confidence using the intuitive visual editor, or insert new documents and clone or delete existing ones in just a few clicks.',
    image: 'crud.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Visual Explain Plans.',
    description: 'Know how queries are running through an easy-to-understand GUI that helps you identify and resolve performance issues.',
    image: 'explain.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Index Management.',
    description: 'Understand the type and size of your indexes, their utilization and special properties. Add and remove indexes at the click of a button.',
    image: 'indexes.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Document Validation.',
    description: 'Create and modify rules that validate your data using a simple point and click interface. CRUD support lets you fix data quality issues easily in individual documents.',
    image: 'validation.png',
    version: '1.5.0',
    initial: true
  },
  {
    title: 'Documents Tab to the Front',
    description: 'The Documents and Schema tabs have switched places, with the Documents now the default view when you open a collection. The first 20 documents load immediately, giving you instant access to your data without delay.',
    image: 'documents-default.png',
    version: '1.8.1',
    initial: false
  },
  {
    title: 'Schema Analysis and Explain Execution on Demand',
    description: 'Schema Analysis and Explain Execution are expensive operations. Compass now only executes these operations when needed. Just click the green "Analyze" or "Explain" button to start the operation. You can also specify a query before executing the operation.',
    image: 'schema-explain-on-demand.png',
    version: '1.8.1',
    initial: false
  },
  {
    title: 'Improved Document Editing',
    description: 'Document editing has become much easier: values are validated inline based on their types, and converting a field to another type is now more intuitive. Date parsing has become much more flexible, with many supported formats and defaults for missing information like the time.',
    image: 'improved-crud.png',
    version: '1.8.1',
    initial: false
  },
  {
    title: 'Enhanced Index Creation',
    description: 'Indexes can now be created on fields that do not exist yet. This is useful when creating indexes on empty collections or if your schema is going to change.',
    image: 'index-type-dropdown.png',
    version: '1.8.1',
    initial: false
  }
];
