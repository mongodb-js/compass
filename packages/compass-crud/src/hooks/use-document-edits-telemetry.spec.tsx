import React from 'react';
import { expect } from 'chai';
import { renderHook } from '@mongodb-js/testing-library-compass';
import HadronDocument, { DocumentEvents, ElementEditor } from 'hadron-document';
import { Int32, Long, UUID } from 'bson';
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

  const renderWithDocs = (docs: HadronDocument[], mode: DocumentEditsMode) => {
    events = [];
    return renderHook(
      (props: { docs: HadronDocument[] }) =>
        useDocumentEditsTelemetry(props.docs, mode),
      {
        initialProps: { docs },
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
      }
    );
  };

  const renderWithDoc = (doc: HadronDocument, mode: DocumentEditsMode) =>
    renderWithDocs([doc], mode);

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

  it('does not track field events in the json view', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'json');

    doc.get('name')!.edit('other');
    doc.insertEnd('added', 'value');

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('tracks editing a field once, no matter how many keystrokes', async function () {
    const doc = new HadronDocument({ name: 'squirrel', age: 4 });
    renderWithDoc(doc, 'table');

    doc.get('name')!.edit('o');
    doc.get('name')!.edit('ot');
    doc.get('name')!.edit('other');
    doc.get('age')!.edit(new Int32(5));

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Edited',
        payload: { type: 'String', mode: 'table' },
      },
      {
        name: 'Document Field Edited',
        payload: { type: 'Int32', mode: 'table' },
      },
    ]);
  });

  it('tracks editing a field again after the document is saved or cancelled', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.get('name')!.edit('other');
    await Promise.resolve();
    doc.emit(DocumentEvents.UpdateSuccess);
    doc.get('name')!.edit('another');
    await Promise.resolve();
    doc.cancel();
    doc.get('name')!.edit('yet another');

    const edits = (await trackedEvents()).filter(
      ({ name }) => name === 'Document Field Edited'
    );
    expect(edits).to.have.lengthOf(3);
  });

  it('tracks editing a field again after it is reverted', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.get('name')!.edit('other');
    await Promise.resolve();
    doc.get('name')!.revert();
    doc.get('name')!.edit('another');

    const edits = (await trackedEvents()).filter(
      ({ name }) => name === 'Document Field Edited'
    );
    expect(edits).to.have.lengthOf(2);
  });

  it('does not track focusing a date field without changing it', async function () {
    const doc = new HadronDocument({ when: new Date('2020-01-01T00:00:00Z') });
    renderWithDoc(doc, 'list');
    const editor = ElementEditor(doc.get('when')!).Date;

    editor.start();
    await Promise.resolve();
    editor.complete();
    expect(await trackedEvents()).to.deep.equal([]);

    editor.start();
    editor.edit('2021-01-01T00:00:00.000+00:00');
    await Promise.resolve();
    editor.complete();
    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Edited',
        payload: { type: 'Date', mode: 'list' },
      },
    ]);
  });

  it('does not track focusing a UUID field without changing it', async function () {
    const doc = new HadronDocument({ id: new UUID().toBinary() });
    renderWithDoc(doc, 'list');
    const editor = ElementEditor(doc.get('id')!).UUID;

    editor.start();
    await Promise.resolve();
    editor.complete();

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track focusing a field after it is renamed', async function () {
    const doc = new HadronDocument({ count: Long.fromNumber(5) });
    renderWithDoc(doc, 'list');
    const renamed = {
      name: 'Document Field Renamed',
      payload: { type: 'Int64', mode: 'list' },
    };

    doc.get('count')!.rename('total');
    await Promise.resolve();
    const editor = ElementEditor(doc.get('total')!).Int64;
    editor.start();
    await Promise.resolve();
    editor.complete();
    expect(await trackedEvents()).to.deep.equal([renamed]);

    editor.start();
    editor.edit('6');
    await Promise.resolve();
    editor.complete();
    expect(await trackedEvents()).to.deep.equal([
      renamed,
      {
        name: 'Document Field Edited',
        payload: { type: 'Int64', mode: 'list' },
      },
    ]);
  });

  it('does not track focusing a field after its type is changed', async function () {
    const doc = new HadronDocument({ when: '2020-01-01T00:00:00.000Z' });
    renderWithDoc(doc, 'table');

    doc.get('when')!.changeType('Date');
    await Promise.resolve();
    const editor = ElementEditor(doc.get('when')!).Date;
    editor.start();
    await Promise.resolve();
    editor.complete();

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'String',
          to_type: 'Date',
          value_invalid: false,
          mode: 'table',
        },
      },
    ]);
  });

  it('tracks editing an array element after adding one before it', async function () {
    const doc = new HadronDocument({ tags: ['a', 'b'] });
    renderWithDoc(doc, 'list');

    const tags = doc.get('tags')!;
    tags.at(0)!.insertSiblingPlaceholder();
    await Promise.resolve();
    tags.at(2)!.edit('c');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'array', mode: 'list' },
      },
      {
        name: 'Document Field Edited',
        payload: { type: 'String', mode: 'list' },
      },
    ]);
  });

  it('keeps tracking a document while the other documents change', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    const { rerender } = renderWithDocs(
      [doc, new HadronDocument({ name: 'other' })],
      'list'
    );

    doc.insertEnd('added', '');
    doc.get('name')!.edit('other');
    await Promise.resolve();
    rerender({ docs: [doc, new HadronDocument({ name: 'saved' })] });
    doc.get('name')!.edit('another');
    doc.get('added')!.rename('renamed');
    await Promise.resolve();
    doc.get('renamed')!.edit('value');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'top_level', mode: 'list' },
      },
      {
        name: 'Document Field Edited',
        payload: { type: 'String', mode: 'list' },
      },
    ]);
  });

  it('does not track editing the value of a newly added field', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.insertEnd('added', '');
    await Promise.resolve();
    doc.get('added')!.edit('value');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'top_level', mode: 'list' },
      },
    ]);
  });

  it('does not track field edits in the insert dialog', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'insert');

    doc.get('name')!.edit('other');

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('tracks changing the type of a field instead of editing it', async function () {
    const doc = new HadronDocument({ age: '4' });
    renderWithDoc(doc, 'list');

    doc.get('age')!.changeType('Int32');
    await Promise.resolve();
    doc.get('age')!.edit(new Int32(5));

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'String',
          to_type: 'Int32',
          value_invalid: false,
          mode: 'list',
        },
      },
      {
        name: 'Document Field Edited',
        payload: { type: 'Int32', mode: 'list' },
      },
    ]);
  });

  it('tracks each step of a chain of type changes', async function () {
    const doc = new HadronDocument({ age: '4' });
    renderWithDoc(doc, 'table');

    doc.get('age')!.changeType('Int32');
    await Promise.resolve();
    doc.get('age')!.changeType('Double');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'String',
          to_type: 'Int32',
          value_invalid: false,
          mode: 'table',
        },
      },
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'Int32',
          to_type: 'Double',
          value_invalid: false,
          mode: 'table',
        },
      },
    ]);
  });

  it('tracks a type change that is applied in two steps once', async function () {
    const doc = new HadronDocument({
      id: '00000000-0000-4000-8000-000000000000',
    });
    renderWithDoc(doc, 'list');

    doc.get('id')!.changeType('UUID');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'String',
          to_type: 'UUID',
          value_invalid: false,
          mode: 'list',
        },
      },
    ]);
  });

  it('tracks a type change that leaves the value invalid when it happens', async function () {
    const doc = new HadronDocument({ age: 'abc' });
    renderWithDoc(doc, 'list');

    doc.get('age')!.changeType('Int32');
    await Promise.resolve();
    ElementEditor(doc.get('age')!).Int32.edit('5');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'String',
          to_type: 'Int32',
          value_invalid: true,
          mode: 'list',
        },
      },
      {
        name: 'Document Field Edited',
        payload: { type: 'Int32', mode: 'list' },
      },
    ]);
  });

  it('tracks typing an invalid value as editing the field', async function () {
    const doc = new HadronDocument({ age: 4 });
    renderWithDoc(doc, 'list');

    ElementEditor(doc.get('age')!).Int32.edit('abc');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Edited',
        payload: { type: 'Int32', mode: 'list' },
      },
    ]);
  });

  it('tracks renaming a field instead of editing it', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.get('name')!.rename('nickname');
    await Promise.resolve();
    doc.get('nickname')!.edit('other');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Renamed',
        payload: { type: 'String', mode: 'list' },
      },
      {
        name: 'Document Field Edited',
        payload: { type: 'String', mode: 'list' },
      },
    ]);
  });

  it('tracks renaming a field once, no matter how many keystrokes', async function () {
    const doc = new HadronDocument({ name: 'squirrel', age: 4 });
    renderWithDoc(doc, 'list');

    const field = doc.get('name')!;
    for (const key of ['nam', 'na', 'n', 'ni', 'nick']) {
      field.rename(key);
      await Promise.resolve();
    }
    doc.get('age')!.rename('years');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Renamed',
        payload: { type: 'String', mode: 'list' },
      },
      {
        name: 'Document Field Renamed',
        payload: { type: 'Int32', mode: 'list' },
      },
    ]);
  });

  it('tracks renaming a field again after the document is saved', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    const field = doc.get('name')!;
    field.rename('nick');
    await Promise.resolve();
    doc.emit(DocumentEvents.UpdateSuccess);
    field.rename('nickname');

    const renames = (await trackedEvents()).filter(
      ({ name }) => name === 'Document Field Renamed'
    );
    expect(renames).to.have.lengthOf(2);
  });

  it('does not track renaming fields in the insert dialog', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'insert');

    doc.get('name')!.rename('nickname');

    expect(await trackedEvents()).to.deep.equal([]);
  });

  it('does not track renaming a newly added field', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.insertEnd('', 'value');
    await Promise.resolve();
    doc.get('')!.rename('added');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'top_level', mode: 'list' },
      },
    ]);
  });

  it('does not track filling in the fields of a newly added object', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'list');

    doc.insertEnd('meta', {});
    const meta = doc.get('meta')!;
    meta.insertEnd('', '');
    await Promise.resolve();
    meta.get('')!.rename('source');
    await Promise.resolve();
    meta.get('source')!.edit('x');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'top_level', mode: 'list' },
      },
      {
        name: 'Document Field Added',
        payload: { added_to: 'document', mode: 'list' },
      },
    ]);
  });

  it('tracks type changes of newly added fields in the insert dialog', async function () {
    const doc = new HadronDocument({ name: 'squirrel' });
    renderWithDoc(doc, 'insert');

    doc.insertEnd('age', '4');
    await Promise.resolve();
    doc.get('age')!.changeType('Int32');

    expect(await trackedEvents()).to.deep.equal([
      {
        name: 'Document Field Added',
        payload: { added_to: 'top_level', mode: 'insert' },
      },
      {
        name: 'Document Field Type Changed',
        payload: {
          from_type: 'String',
          to_type: 'Int32',
          value_invalid: false,
          mode: 'insert',
        },
      },
    ]);
  });
});
