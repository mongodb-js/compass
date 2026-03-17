import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import JSONEditor from './json-editor';
import HadronDocument from 'hadron-document';
import { setCodemirrorEditorValue } from '@mongodb-js/compass-editor';

function renderJSONEditor(
  props: Partial<ComponentProps<typeof JSONEditor>> = {}
) {
  const doc = new HadronDocument({});
  doc.editing = true;
  return render(
    <JSONEditor doc={doc} editable namespace="airbnb.listings" {...props} />
  );
}

describe('JSONEditor', function () {
  context('shows error messages', function () {
    it('shows error message for invalid JSON', async function () {
      renderJSONEditor();
      await setCodemirrorEditorValue(
        screen.getByTestId('json-editor'),
        '{ "name": } '
      );
      const errorMessage = await screen.findByText(/unexpected token/i);
      expect(errorMessage).to.exist;
    });
    it('show error message for valid EJSON', async function () {
      renderJSONEditor();
      await setCodemirrorEditorValue(
        screen.getByTestId('json-editor'),
        '{ "invalid_long": { "$numberLong": "1234567234324812317654321" } } '
      );
      const errorMessage = await screen.findByText(
        /numberLong string is too long/i
      );
      expect(errorMessage).to.exist;
    });
  });
});
