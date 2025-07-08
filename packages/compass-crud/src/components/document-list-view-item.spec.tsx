import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import QueryBarPlugin from '@mongodb-js/compass-query-bar';
import {
  compassFavoriteQueryStorageAccess,
  compassRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage';
import { DocumentListViewItem } from './document-list-view-item';

const MockQueryBarPlugin = QueryBarPlugin.withMockServices({
  dataService: {
    sample() {
      return Promise.resolve([]);
    },
    getConnectionString() {
      return { hosts: [] } as any;
    },
  },
  instance: { on() {}, removeListener() {} } as any,
  favoriteQueryStorageAccess: compassFavoriteQueryStorageAccess,
  recentQueryStorageAccess: compassRecentQueryStorageAccess,
  atlasAiService: {} as any,
});

describe('DocumentListViewItem', function () {
  let doc: HadronDocument;
  let copyToClipboardStub: sinon.SinonStub;
  let openInsertDocumentDialogStub: sinon.SinonStub;
  let preferences: PreferencesAccess;

  function renderDocumentListViewItem(
    props?: Partial<React.ComponentProps<typeof DocumentListViewItem>>
  ) {
    const queryBarProps = {};

    return render(
      <PreferencesProvider value={preferences}>
        <MockQueryBarPlugin {...(queryBarProps as any)}>
          <DocumentListViewItem
            doc={doc}
            docRef={null}
            docIndex={0}
            isEditable={true}
            copyToClipboard={copyToClipboardStub}
            openInsertDocumentDialog={openInsertDocumentDialogStub}
            {...props}
          />
        </MockQueryBarPlugin>
      </PreferencesProvider>
    );
  }

  beforeEach(async function () {
    doc = new HadronDocument({
      _id: 1,
      name: 'test',
      url: 'https://mongodb.com',
      nested: { field: 'value' },
    });

    copyToClipboardStub = sinon.stub();
    openInsertDocumentDialogStub = sinon.stub();
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    sinon.restore();
  });

  it('renders the document component', function () {
    renderDocumentListViewItem();

    // Should render without error
    expect(document.querySelector('[data-testid="editable-document"]')).to
      .exist;
  });

  it('renders context menu when right-clicked', function () {
    const { container } = renderDocumentListViewItem();

    const element = container.firstChild as HTMLElement;

    // Right-click to open context menu
    userEvent.click(element, { button: 2 });

    // Should show context menu with expected items
    expect(screen.getByText('Copy document')).to.exist;
    expect(screen.getByText('Clone document...')).to.exist;
    expect(screen.getByText('Delete document')).to.exist;
  });

  it('renders scroll trigger when docIndex is 0', function () {
    const scrollTriggerRef = React.createRef<HTMLDivElement>();

    renderDocumentListViewItem({
      scrollTriggerRef,
    });

    expect(scrollTriggerRef.current).to.exist;
  });

  it('does not render scroll trigger when docIndex is not 0', function () {
    const scrollTriggerRef = React.createRef<HTMLDivElement>();

    renderDocumentListViewItem({
      docIndex: 1,
      scrollTriggerRef,
    });

    expect(scrollTriggerRef.current).to.be.null;
  });
});
