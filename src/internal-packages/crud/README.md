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

| Key                    | Description                       |
|------------------------|-----------------------------------|
| `CRUD.DocumentRemoved` | Fired when a document is removed. |

### Stores

| Key                           | Description
|-------------------------------|---------------------------------------------------------|
| `CRUD.InsertDocumentStore`    | Triggers when a document is inserted.                   |
| `CRUD.ResetDocumentListStore` | Triggers when the query filter is reset.                |
| `CRUD.LoadMoreDocumentsStore` | Triggers when more documents are fetched via scrolling. |
