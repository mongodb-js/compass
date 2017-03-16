# Compass CRUD Package

Provide functionality shown in the "Documents" tab in the collection view.

## Available Resources in the App Registry

### Components

#### Definitions

| Key                 | Description                  |
|---------------------|------------------------------|
| `CRUD.Document`     | Renders a single document.   |
| `CRUD.DocumentList` | Renders a list of documents. |

### Actions

| Key            | Description                   |
|----------------|-------------------------------|
| `CRUD.Actions` | All the CRUD related actions. |

### Stores

| Key                           | Description
|-------------------------------|---------------------------------------------------------|
| `CRUD.InsertDocumentStore`    | Triggers when a document is inserted.                   |
| `CRUD.ResetDocumentListStore` | Triggers when the query filter is reset.                |
| `CRUD.LoadMoreDocumentsStore` | Triggers when more documents are fetched via scrolling. |

## Usage

Render an editable document in a React component.

```jsx
const app = require('hadron-app');
const React = require('react');

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.Document = app.appRegistry.getComponent('CRUD.Document');
  }
  render() {
    return (<this.Document doc={this.props.document} editable />);
  }
}
```

Render a non-editable pre-expanded document in a React component.

```jsx
const app = require('hadron-app');
const React = require('react');

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.Document = app.appRegistry.getComponent('CRUD.Document');
  }
  render() {
    return (<this.Document doc={this.props.document} expandAll />);
  }
}
```

Listen to the various CRUD actions.

```javascript
const app = require('hadron-app');
const CrudActions = app.appRegistry.getAction('CRUD.Actions');

CrudActions.documentRemoved.listen((id) => {
  console.log(`Document with _id ${id} removed.`);
});

CrudActions.openInsertDocumentDialog((doc, clone) => {
  if (clone) {
    console.log('Opening insert dialog with cloned document');
  }
});

CrudActions.insertDocument((doc) => {
  console.log('Inserting document into db');
});
```
