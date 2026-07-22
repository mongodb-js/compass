import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';
import sinon from 'sinon';

import ReadonlyDocument from './readonly-document';

describe('<ReadonlyDocument />', function () {
  describe('render', function () {
    it('renders the list div', function () {
      render(<ReadonlyDocument doc={new HadronDocument({ a: 1 })} />);
      expect(screen.getByTestId('readonly-document')).to.exist;
    });

    it('renders the expand/collapse button for a non-empty document', function () {
      render(<ReadonlyDocument doc={new HadronDocument({ a: 1 })} />);
      expect(screen.getByTestId('expand-document-button')).to.exist;
    });

    it('does not render the expand/collapse button for an empty document', function () {
      render(<ReadonlyDocument doc={new HadronDocument({})} />);
      expect(screen.queryByTestId('readonly-document-empty')).to.exist;
      expect(screen.queryByTestId('expand-document-button')).to.not.exist;
    });

    it('still renders the other actions for an empty document', function () {
      render(
        <ReadonlyDocument
          doc={new HadronDocument({})}
          copyToClipboard={sinon.spy()}
          openInsertDocumentDialog={sinon.spy()}
        />
      );
      expect(screen.getByTestId('copy-document-button')).to.exist;
      expect(screen.getByTestId('clone-document-button')).to.exist;
      expect(screen.queryByTestId('expand-document-button')).to.not.exist;
    });
  });
});
