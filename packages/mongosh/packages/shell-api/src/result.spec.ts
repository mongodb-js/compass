import { expect } from 'chai';
import * as results from './result';
import { ShellApiInterface, signatures, toShellResult } from './decorators';
import { ObjectId } from 'mongodb';

describe('Results', () => {
  describe('signatures', () => {
    Object.keys(results).forEach((res) => {
      describe(`${res} signature`, () => {
        describe('signature', () => {
          it('type', () => {
            expect(signatures[res].type).to.equal(res);
          });
          it('attributes', () => {
            expect(signatures[res].attributes).to.deep.equal({});
          });
          it('hasAsyncChild', () => {
            expect(signatures[res].hasAsyncChild).to.equal(false);
          });
        });
      });
    });
  });
  describe('BulkWriteResult', () => {
    const r = new results.BulkWriteResult(
      true, 1, { 0: new ObjectId() }, 2, 3, 4, 5, { 0: new ObjectId() }
    ) as ShellApiInterface;
    it('class attributes set', () => {
      expect(r.acknowledged).to.equal(true);
    });
    it('toShellResult', async() => {
      expect((await toShellResult(r)).type).to.equal('BulkWriteResult');
      expect((await toShellResult(r)).printable).to.deep.equal({ ...r });
    });
    it('calls help function', async() => {
      expect((await toShellResult((r as any).help())).type).to.equal('Help');
      expect((await toShellResult(r.help)).type).to.equal('Help');
    });
  });
  describe('CommandResult', () => {
    const r = new results.CommandResult(
      'commandType', { ok: 1 }
    ) as ShellApiInterface;
    it('class attributes set', () => {
      expect(r.value).to.deep.equal({ ok: 1 });
      expect(r.type).to.equal('commandType');
    });
    it('toShellResult', async() => {
      expect((await toShellResult(r)).type).to.equal('commandType');
      expect((await toShellResult(r)).printable).to.deep.equal({ ok: 1 });
    });
    it('calls help function', async() => {
      expect((await toShellResult((r as any).help())).type).to.equal('Help');
      expect((await toShellResult(r.help)).type).to.equal('Help');
    });
  });
  describe('DeleteResult', () => {
    const r = new results.DeleteResult(
      true, 1
    ) as ShellApiInterface;
    it('class attributes set', () => {
      expect(r.acknowledged).to.equal(true);
    });
    it('toShellResult', async() => {
      expect((await toShellResult(r)).type).to.equal('DeleteResult');
      expect((await toShellResult(r)).printable).to.deep.equal({ ...r });
    });
    it('calls help function', async() => {
      expect((await toShellResult((r as any).help())).type).to.equal('Help');
      expect((await toShellResult(r.help)).type).to.equal('Help');
    });
  });
  describe('InsertManyResult', () => {
    const r = new results.InsertManyResult(
      true, { 0: new ObjectId() }
    ) as ShellApiInterface;
    it('class attributes set', () => {
      expect(r.acknowledged).to.equal(true);
    });
    it('toShellResult', async() => {
      expect((await toShellResult(r)).type).to.equal('InsertManyResult');
      expect((await toShellResult(r)).printable).to.deep.equal({ ...r });
    });
    it('calls help function', async() => {
      expect((await toShellResult((r as any).help())).type).to.equal('Help');
      expect((await toShellResult(r.help)).type).to.equal('Help');
    });
  });
  describe('InsertOneResult', () => {
    const r = new results.InsertOneResult(
      true, new ObjectId()
    ) as ShellApiInterface;
    it('class attributes set', () => {
      expect(r.acknowledged).to.equal(true);
    });
    it('toShellResult', async() => {
      expect((await toShellResult(r)).type).to.equal('InsertOneResult');
      expect((await toShellResult(r)).printable).to.deep.equal({ ...r });
    });
    it('calls help function', async() => {
      expect((await toShellResult((r as any).help())).type).to.equal('Help');
      expect((await toShellResult(r.help)).type).to.equal('Help');
    });
  });
  describe('UpdateResult', () => {
    const r = new results.UpdateResult(
      true, 1, 2, 3, new ObjectId()
    ) as ShellApiInterface;
    it('class attributes set', () => {
      expect(r.acknowledged).to.equal(true);
    });
    it('toShellResult', async() => {
      expect((await toShellResult(r)).type).to.equal('UpdateResult');
      expect((await toShellResult(r)).printable).to.deep.equal({ ...r });
    });
    it('calls help function', async() => {
      expect((await toShellResult((r as any).help())).type).to.equal('Help');
      expect((await toShellResult(r.help)).type).to.equal('Help');
    });
  });
  describe('CursorIterationResult', () => {
    const r = new results.CursorIterationResult() as ShellApiInterface;
    r.documents.push(1, 2, 3);
    it('superclass attributes set', () => {
      expect(r.documents.length).to.equal(3);
    });
    it('toShellResult', async() => {
      expect(await toShellResult(r)).to.have.property(
        'type',
        'CursorIterationResult'
      );
      expect(await toShellResult(r))
        .to.have.nested.property('printable.documents')
        .deep.equal(JSON.parse(JSON.stringify(r.documents)));
    });
  });
});
