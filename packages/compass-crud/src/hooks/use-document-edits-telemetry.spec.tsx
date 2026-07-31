import React from 'react';
import { expect } from 'chai';
import { renderHook } from '@mongodb-js/testing-library-compass';
import HadronDocument from 'hadron-document';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';
import {
  useDocumentEditsTelemetry,
  type DocumentEditsMode,
} from './use-document-edits-telemetry';

describe('useDocumentEditsTelemetry', function () {
  let events: { name: string; payload: any }[];

  const trackedEvents = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return events.map(({ name, payload }) => {
      const { connection_id, ...rest } = payload;
      return { name, payload: rest };
    });
  };

  const renderWithDoc = (doc: HadronDocument, mode: DocumentEditsMode) => {
    events = [];
    return renderHook(() => useDocumentEditsTelemetry([doc], mode), {
      wrapper: ({ children }) => (
        <TelemetryProvider
          options={{
            sendTrack: (name: string, payload: any) => {
              events.push({ name, payload });
            },
          }}
        >
          {children}
        </TelemetryProvider>
      ),
    });
  };

  it('tracks events against the current connection', async function () {
    const doc = new HadronDocument({ name: 'compass' });
    renderWithDoc(doc, 'list');

    doc.get('name')!.remove();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events[0].payload).to.have.property('connection_id', 'TEST');
  });

  it('tracks added and removed fields, including nested ones', async function () {
    const doc = new HadronDocument({ tags: ['a'], name: 'compass' });
    renderWithDoc(doc, 'list');

    doc.insertEnd('added', 'value');
    doc.get('tags')!.insertEnd('1', 'b');
    doc.get('name')!.remove();

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'document', mode: 'list' },
      },
      {
        name: 'Document Field Added',
        payload: { added_to: 'array', mode: 'list' },
      },
      {
        name: 'Document Field Removed',
        payload: { type: 'String', mode: 'list' },
      },
    ]);
  });

  it('tracks cancelling an edit, but not in the insert dialog', async function () {
    const doc = new HadronDocument({ name: 'compass' });
    renderWithDoc(doc, 'json');
    doc.cancel();
    expect(await trackedEvents()).to.deep.equal([
      { name: 'Document Update Cancelled', payload: { mode: 'json' } },
    ]);

    const insertDoc = new HadronDocument({ name: 'compass' });
    renderWithDoc(insertDoc, 'insert');
    insertDoc.cancel();
    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track cancelling a deletion as a cancelled update', async function () {
    const doc = new HadronDocument({ name: 'compass' });
    renderWithDoc(doc, 'list');

    doc.markForDeletion();
    doc.cancel();
    doc.finishDeletion();

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track field events in the json view', async function () {
    const doc = new HadronDocument({ name: 'compass' });
    renderWithDoc(doc, 'json');

    doc.get('name')!.edit('other');
    doc.insertEnd('added', 'value');

    expect(await trackedEvents()).to.deep.equal([]);
  });
});
