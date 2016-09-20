---
title: Editing a Single Document
tags:
  - crud
section: CRUD
---

A single document can be edited by clicking on the edit icon
<i class='fa fa-pencil' aria-hidden='true'></i> on the right
side of the document in the document list. Clicking on this button puts
the document into edit mode, but changes will not be sent to the server
until the user confirms the edits by clicking 'Update'.

In edit mode, the document panel behaves similar to the CSS editor in
most modern web browers' development tools.

### Editing an Element

Clicking on an element key or value allows the user to change the key name
or the value of the element. The element's type can also be changed by
selecting a new type from the dropdown on the right side. Only types that
the value can currently be cast to will be visible in the list. Duplicate
key names will cause the key field to be highlighted in red.

#### Copying JSON Into Fields

Valid JSON which can be parsed by Javascript's `JSON.parse` can be pasted
into fields. If the pasted value is an `Array` or `Object`, the vaalue will
be converted.

### Adding an Element

A new element can be added to the document or any embedded document by
either clicking on the right side of the element or tabbing off the last
element's value field if the element is the last element in the document
or sub document. Clicking to the right of an element will also remove any
subsequent extra empty elements.

### Deleting an Element

An element can be deleted by clicking on the <i class='fa fa-times-circle' aria-hidden='true'></i>
icon to the left of the element's line number.

### Reverting a Change

A change to an element can be reverted by clicking the revert icon
<i class='fa fa-rotate-left' aria-hidden='true'></i>
to the left of the element's line number.

### Persisting Changes

The changes to a document may be persisted by clicking on the 'Update'
button in the footer of the document panel. Clicking this button will
execute a `$findAndModify` on the server and update the document in the
list.

### Canceling Changes

To exit edit mode and cancel all pending changes, click the 'Cancel' button.
