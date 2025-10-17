import type {
  DataModelCollection,
  Edit,
  Relationship,
  StaticModel,
} from '../services/data-model-storage';
import { addFieldToJSONSchema } from '../utils/schema';
import { updateSchema } from '../utils/schema-traversal';
import {
  isRelationshipInvolvingField,
  isSameFieldOrAncestor,
} from '../utils/utils';

function renameFieldInRelationshipSide(
  side: Relationship['relationship'][0],
  edit: Extract<Edit, { type: 'RenameField' }>
): Relationship['relationship'][0] {
  if (
    side.ns !== edit.ns ||
    !side.fields ||
    !isSameFieldOrAncestor(edit.field, side.fields)
  ) {
    return side;
  }
  return {
    ...side,
    fields: [
      ...side.fields.slice(0, edit.field.length - 1),
      edit.newName,
      ...side.fields.slice(edit.field.length),
    ],
  };
}

function ensureCollectionExists(
  collections: DataModelCollection[],
  ns: string
): void {
  const collection = collections.find((c) => c.ns === ns);
  if (!collection) {
    throw new Error(`Collection '${ns}' not found`);
  }
}

export function applyEdit(edit: Edit, model?: StaticModel): StaticModel {
  if (edit.type === 'SetModel') {
    return edit.model;
  }
  if (!model) {
    throw new Error('Editing a model that has not been initialized');
  }
  switch (edit.type) {
    case 'AddCollection': {
      const newCollection: DataModelCollection = {
        ns: edit.ns,
        jsonSchema: edit.initialSchema,
        displayPosition: edit.position,
        indexes: [],
      };
      return {
        ...model,
        collections: [...model.collections, newCollection],
      };
    }
    case 'AddRelationship': {
      return {
        ...model,
        relationships: [...model.relationships, edit.relationship],
      };
    }
    case 'RemoveRelationship': {
      return {
        ...model,
        relationships: model.relationships.filter(
          (relationship) => relationship.id !== edit.relationshipId
        ),
      };
    }
    case 'UpdateRelationship': {
      const existingRelationship = model.relationships.find((r) => {
        return r.id === edit.relationship.id;
      });
      if (!existingRelationship) {
        throw new Error('Can not update non-existent relationship');
      }
      return {
        ...model,
        relationships: model.relationships.map((r) => {
          return r === existingRelationship ? edit.relationship : r;
        }),
      };
    }
    case 'MoveCollection': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        collections: model.collections.map((collection) => {
          if (collection.ns === edit.ns) {
            return {
              ...collection,
              displayPosition: edit.newPosition,
            };
          }
          return collection;
        }),
      };
    }
    case 'RemoveCollection': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        // Remove any relationships involving the collection being removed.
        relationships: model.relationships.filter((r) => {
          return !(
            r.relationship[0].ns === edit.ns || r.relationship[1].ns === edit.ns
          );
        }),
        collections: model.collections.filter(
          (collection) => collection.ns !== edit.ns
        ),
      };
    }
    case 'RenameCollection': {
      ensureCollectionExists(model.collections, edit.fromNS);
      return {
        ...model,
        // Update relationships to point to the renamed namespace.
        relationships: model.relationships.map((relationship) => {
          const [local, foreign] = relationship.relationship;

          return {
            ...relationship,
            relationship: [
              {
                ...local,
                ns: local.ns === edit.fromNS ? edit.toNS : local.ns,
              },
              {
                ...foreign,
                ns: foreign.ns === edit.fromNS ? edit.toNS : foreign.ns,
              },
            ],
          };
        }),
        collections: model.collections.map((collection) => ({
          ...collection,
          // Rename the collection.
          ns: collection.ns === edit.fromNS ? edit.toNS : collection.ns,
        })),
      };
    }
    case 'UpdateCollectionNote': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        collections: model.collections.map((collection) => {
          if (collection.ns === edit.ns) {
            return {
              ...collection,
              note: edit.note,
            };
          }
          return collection;
        }),
      };
    }
    case 'AddField': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        collections: model.collections.map((collection) => {
          if (collection.ns === edit.ns) {
            return {
              ...collection,
              jsonSchema: addFieldToJSONSchema(
                collection.jsonSchema,
                edit.field,
                edit.jsonSchema
              ),
            };
          }
          return collection;
        }),
      };
    }
    case 'RemoveField': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        // Remove any relationships involving the field being removed.
        relationships: model.relationships.filter(({ relationship }) => {
          return !isRelationshipInvolvingField(
            relationship,
            edit.ns,
            edit.field
          );
        }),
        collections: model.collections.map((collection) => {
          if (collection.ns !== edit.ns) return collection;
          return {
            ...collection,
            jsonSchema: updateSchema({
              jsonSchema: collection.jsonSchema,
              fieldPath: edit.field,
              updateParameters: { update: 'removeField' },
            }),
          };
        }),
      };
    }
    case 'RenameField': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        // Update any relationships involving the field being renamed.
        relationships: model.relationships.map((r) => {
          if (
            !isRelationshipInvolvingField(r.relationship, edit.ns, edit.field)
          ) {
            return r;
          }
          return {
            ...r,
            relationship: [
              renameFieldInRelationshipSide(r.relationship[0], edit),
              renameFieldInRelationshipSide(r.relationship[1], edit),
            ] as const,
          };
        }),
        collections: model.collections.map((collection) => {
          if (collection.ns !== edit.ns) return collection;
          return {
            ...collection,
            jsonSchema: updateSchema({
              jsonSchema: collection.jsonSchema,
              fieldPath: edit.field,
              updateParameters: {
                update: 'renameField',
                newFieldName: edit.newName,
              },
            }),
          };
        }),
      };
    }
    case 'ChangeFieldType': {
      ensureCollectionExists(model.collections, edit.ns);
      return {
        ...model,
        collections: model.collections.map((collection) => {
          if (collection.ns !== edit.ns) return collection;
          return {
            ...collection,
            jsonSchema: updateSchema({
              jsonSchema: collection.jsonSchema,
              fieldPath: edit.field,
              updateParameters: {
                update: 'changeFieldSchema',
                newFieldSchema: edit.to,
              },
            }),
          };
        }),
      };
    }
    default: {
      return model;
    }
  }
}
