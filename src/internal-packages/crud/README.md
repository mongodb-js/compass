# Compass CRUD Package

Provide functionality shown in the "Documents" tab in the collection view.

## Available Resources in the App Registry

### Components

#### Definitions

| Key                             | Parameters                                                                  |
|---------------------------------|-----------------------------------------------------------------------------|
| `Component::CRUD::Document`     | `doc: Object` - The document.                                               |
|                                 | `editable: <Optional>Boolean` - If the document is editable                 |
|                                 | `preExpanded: <Optional>Boolean` - If the elements render expanded.         |
| `Component::CRUD::DocumentList` | None                                                                        |

#### Examples

Render a single non-editable document:

```jsx
const Document = app.appRegistry.getComponent('Component::CRUD::Document');
return (<Document doc={document} />);
```

Render a single editable document:

```jsx
const Document = app.appRegistry.getComponent('Component::CRUD::Document');
return (<Document doc={document} editable />);
```

Render a single document with the embedded elements expanded:

```jsx
const Document = app.appRegistry.getComponent('Component::CRUD::Document');
return (<Document doc={document} preExpanded />);
```

### Actions

#### Definitions

| Key                             | Handle Parameters                              |
|---------------------------------|------------------------------------------------|
| `Action::CRUD::DocumentRemoved` | `id`: The id of the document that was removed. |

#### Examples

Handle a document being removed from a collection.

```javascript
const DocumentRemovedAction = app.appRegistry.getAction('Action::CRUD::DocumentRemoved');
const unsubscribe = DocumentRemovedAction.listen((id) => {
  console.log(`Document with id: ${id} removed.`);
});
```

### Stores

#### Definitions

| Key                                   | Trigger Parameters                             |
|---------------------------------------|------------------------------------------------|
| `Store::CRUD::InsertDocumentStore`    | `success: Boolean` - If the insert succeeded   |
|                                       | `doc: Object` - The inserted document or error |
| `Store::CRUD::ResetDocumentListStore` | `documents`: The new documents.                |
|                                       | `count`: The total count of documents.         |
| `Store::CRUD::LoadMoreDocumentsStore` | `documents`: The next batch of documents.      |

#### Examples

```javascript
const InsertDocumentStore = app.appRegistry.getStore('Store::CRUD::InsertDocumentStore');

const unsubscribeInsert = InsertDocumentStore.listen((success, doc) => {
  if (success) {
    console.log('Document inserted');
  } else {
    alert(doc.message);
  }
});
```
