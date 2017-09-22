# Compass Indexes Plugin

Provides functionality shown in the "Indexes" tab in the collection view.

## Available Resources in the App Registry

### Components

#### Definitions

| Key                           | Description                                       |
|-------------------------------|---------------------------------------------------|
| `Indexes.Indexes`             | Renders all indexes in the collection.            |
| `Indexes.IndexDefinition`     | Renders the name and direction of a single index. |
| `Indexes.IndexDefinitionType` | Renders only the direction of a single index.     |

### Actions

| Key                   | Description                           |
|-----------------------|---------------------------------------|
| `Indexes.LoadIndexes` | Fires when the indexes are retrieved. |

### Stores

| Key                  | Description                                                     |
|----------------------|-----------------------------------------------------------------|
| `Indexes.IndexStore` | Triggers with the indexes converted to index models and sorted. |
