import React from 'react';
import { expect } from 'chai';
import { renderHook } from '@mongodb-js/testing-library-compass';
import HadronDocument, { ElementEditor } from 'hadron-document';
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
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.get('name')!.remove();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events[0].payload).to.have.property('connection_id', 'TEST');
  });

  it('tracks added and removed fields, including nested ones', async function () {
    const doc = new HadronDocument({
      tags: ['a'],
      meta: { source: 'x' },
      name: 'squirrel',
    });
    renderWithDoc(doc, 'list');

    doc.insertEnd('added', 'value');
    doc.get('meta')!.insertEnd('nested', 'value');
    doc.get('tags')!.insertEnd('1', 'b');
    doc.get('name')!.remove();

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'top_level', mode: 'list' },
      },
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
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'json');
    doc.cancel();
    expect(await trackedEvents()).to.deep.equal([
      { name: 'Document Update Cancelled', payload: { mode: 'json' } },
    ]);

    const insertDoc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(insertDoc, 'insert');
    insertDoc.cancel();
    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track cancelling a deletion as a cancelled update', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.markForDeletion();
    doc.cancel();
    doc.finishDeletion();

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('tracks type changes, including in the insert dialog', async function () {
    const doc = new HadronDocument({ count: '1' });
    renderWithDoc(doc, 'insert');

    doc.get('count')!.changeType('Int32');
    doc.get('count')!.changeType('Double');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Type Changed',
        payload: { from_type: 'String', to_type: 'Int32', mode: 'insert' },
      },
      {
        name: 'Document Field Type Changed',
        payload: { from_type: 'Int32', to_type: 'Double', mode: 'insert' },
      },
    ]);
  });

  it('does not track a type change to the same type', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.get('name')!.changeType('String');

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('tracks completed value edits, but not in the insert dialog', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    const editor = new ElementEditor.StandardEditor(doc.get('name')!);
    editor.start();
    editor.edit('otter');
    editor.complete();

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Edited',
        payload: { type: 'String', mode: 'list' },
      },
    ]);

    const insertDoc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(insertDoc, 'insert');

    const insertEditor = new ElementEditor.StandardEditor(
      insertDoc.get('name')!
    );
    insertEditor.start();
    insertEditor.edit('otter');
    insertEditor.complete();

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track a value edit that did not change anything', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    const editor = new ElementEditor.StandardEditor(doc.get('name')!);
    editor.start();
    editor.complete();

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track field events in the json view', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'json');

    doc.get('name')!.edit('other');
    doc.get('name')!.changeType('Int32');
    doc.insertEnd('added', 'value');

    expect(await trackedEvents()).to.deep.equal([]);
  });
});
