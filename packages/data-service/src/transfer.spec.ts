import chai from 'chai';
import {
  ObjectId,
  Binary,
  UUID,
  Decimal128,
  Double,
  Int32,
  Long,
  Timestamp,
  Code,
  DBRef,
  MinKey,
  MaxKey,
  BSONRegExp,
  BSONSymbol,
} from 'bson';
import { markBSON, unmarkBSON } from './transfer';

const { expect } = chai;

/**
 * Simulates the full trip a value takes across the renderer <-> utility
 * MessagePort: `markBSON` before `postMessage`, the browser/Electron
 * structured clone algorithm that `postMessage` itself uses (here, Node's
 * global `structuredClone`, which behaves the same way: BSON class
 * instances aren't among the types it knows how to clone, so it silently
 * degrades them to a plain object of their own enumerable properties
 * instead of throwing), then `unmarkBSON` on the receiving side.
 */
function roundTrip(value: unknown): unknown {
  return unmarkBSON(structuredClone(markBSON(value)));
}

describe('transfer', function () {
  describe('markBSON/unmarkBSON round-trip through structuredClone', function () {
    it('leaves primitives untouched', function () {
      expect(roundTrip(42)).to.equal(42);
      expect(roundTrip('hello')).to.equal('hello');
      expect(roundTrip(true)).to.equal(true);
      expect(roundTrip(null)).to.equal(null);
      expect(roundTrip(undefined)).to.equal(undefined);
    });

    it('leaves a bare (top-level, not nested) BSON value correct', function () {
      const id = new ObjectId();
      const result = roundTrip(id) as ObjectId;
      expect(result).to.be.instanceOf(ObjectId);
      expect(result.toHexString()).to.equal(id.toHexString());
    });

    it('restores an ObjectId nested in a plain object', function () {
      const id = new ObjectId();
      const result = roundTrip({ _id: id, a: 1 }) as {
        _id: ObjectId;
        a: number;
      };
      expect(result.a).to.equal(1);
      expect(result._id).to.be.instanceOf(ObjectId);
      expect(result._id.toHexString()).to.equal(id.toHexString());
    });

    it('restores an ObjectId nested in an array', function () {
      const id = new ObjectId();
      const result = roundTrip([1, id, 'x']) as [number, ObjectId, string];
      expect(result[1]).to.be.instanceOf(ObjectId);
      expect(result[1].toHexString()).to.equal(id.toHexString());
    });

    it('restores a plain Binary (not sub_type 4) as Binary, not UUID', function () {
      const bin = new Binary(Buffer.from([1, 2, 3]), 0);
      const result = roundTrip({ b: bin }) as { b: Binary };
      expect(result.b).to.be.instanceOf(Binary);
      expect(result.b).not.to.be.instanceOf(UUID);
      expect(Buffer.from(result.b.buffer).equals(Buffer.from(bin.buffer))).to.be
        .true;
    });

    it('restores a real UUID as UUID', function () {
      const id = new UUID();
      const result = roundTrip({ u: id }) as { u: UUID };
      expect(result.u).to.be.instanceOf(UUID);
      expect(result.u.toString()).to.equal(id.toString());
    });

    it('restores any Binary with sub_type 4 as UUID, even if it was never actually constructed via `new UUID()`', function () {
      // This is the documented behavior we chose: the wire format can't
      // distinguish "built via `new UUID()`" from "a plain Binary someone
      // happened to tag sub_type 4", both are UUIDs by BSON's own
      // definition, so both should come back as UUID.
      const bin = new Binary(Buffer.alloc(16, 7), 4);
      const result = roundTrip({ b: bin }) as { b: Binary };
      expect(result.b).to.be.instanceOf(UUID);
    });

    it('restores Decimal128, Double, Int32, Long, Timestamp, MinKey, MaxKey, BSONRegExp, BSONSymbol', function () {
      const input = {
        decimal: Decimal128.fromString('12.34'),
        double: new Double(1.5),
        int32: new Int32(42),
        long: Long.fromNumber(123456789),
        timestamp: new Timestamp({ i: 7, t: 0 }),
        minKey: new MinKey(),
        maxKey: new MaxKey(),
        regexp: new BSONRegExp('abc', 'i'),
        symbol: new BSONSymbol('sym'),
      };

      const result = roundTrip(input) as typeof input;

      expect(result.decimal).to.be.instanceOf(Decimal128);
      expect(result.decimal.toString()).to.equal('12.34');

      expect(result.double).to.be.instanceOf(Double);
      expect(result.double.valueOf()).to.equal(1.5);

      expect(result.int32).to.be.instanceOf(Int32);
      expect(result.int32.valueOf()).to.equal(42);

      expect(result.long).to.be.instanceOf(Long);
      expect(result.long.toString()).to.equal('123456789');

      expect(result.timestamp).to.be.instanceOf(Timestamp);
      expect(result.timestamp.toString()).to.equal('7');

      expect(result.minKey).to.be.instanceOf(MinKey);
      expect(result.maxKey).to.be.instanceOf(MaxKey);

      expect(result.regexp).to.be.instanceOf(BSONRegExp);
      expect(result.regexp.pattern).to.equal('abc');
      expect(result.regexp.options).to.equal('i');

      expect(result.symbol).to.be.instanceOf(BSONSymbol);
      expect(result.symbol.toString()).to.equal('sym');
    });

    it("restores an ObjectId nested inside a Code value's scope", function () {
      const id = new ObjectId();
      const code = new Code('function () { return a; }', { a: id, b: 1 });
      const result = roundTrip({ c: code }) as { c: Code };

      expect(result.c).to.be.instanceOf(Code);
      expect(result.c.code).to.equal(code.code);
      expect(result.c.scope?.a).to.be.instanceOf(ObjectId);
      expect((result.c.scope?.a as ObjectId).toHexString()).to.equal(
        id.toHexString()
      );
      expect(result.c.scope?.b).to.equal(1);
    });

    it('handles a Code value with no scope at all', function () {
      const code = new Code('function () {}');
      // bson's own `Code` constructor defaults `scope` to `null`, not
      // `undefined`, when none is given.
      expect(code.scope).to.equal(null);
      const result = roundTrip({ c: code }) as { c: Code };
      expect(result.c).to.be.instanceOf(Code);
      expect(result.c.scope).to.equal(null);
    });

    it('restores DBRef, including the ObjectId oid and a nested ObjectId in fields', function () {
      const oid = new ObjectId();
      const fieldsId = new ObjectId();
      const ref = new DBRef('coll', oid, 'db', { extra: fieldsId });
      const result = roundTrip({ ref }) as { ref: DBRef };

      expect(result.ref).to.be.instanceOf(DBRef);
      expect(result.ref.collection).to.equal('coll');
      expect(result.ref.db).to.equal('db');
      expect(result.ref.oid).to.be.instanceOf(ObjectId);
      expect(result.ref.oid.toHexString()).to.equal(oid.toHexString());
      expect(result.ref.fields?.extra).to.be.instanceOf(ObjectId);
      expect((result.ref.fields?.extra as ObjectId).toHexString()).to.equal(
        fieldsId.toHexString()
      );
    });

    it('handles a DBRef with no fields at all', function () {
      const ref = new DBRef('coll', new ObjectId());
      // bson's own `DBRef` constructor defaults `fields` to `{}`, not
      // `undefined`, when none is given.
      expect(ref.fields).to.deep.equal({});
      const result = roundTrip({ ref }) as { ref: DBRef };
      expect(result.ref).to.be.instanceOf(DBRef);
      expect(result.ref.fields).to.deep.equal({});
    });

    it('restores BSON values nested many levels deep across mixed arrays/objects', function () {
      const id = new ObjectId();
      const input = {
        a: [{ b: { c: [1, 2, { d: { e: [id] } }] } }],
      };

      const result = roundTrip(input) as typeof input;
      const found = result.a[0].b.c[2] as { d: { e: [ObjectId] } };
      expect(found.d.e[0]).to.be.instanceOf(ObjectId);
      expect(found.d.e[0].toHexString()).to.equal(id.toHexString());
    });

    it('does not blow the stack on very deeply nested plain objects (no recursion)', function () {
      type Deep = { id?: ObjectId; child?: Deep };
      const id = new ObjectId();
      let deep: Deep = { id };
      // Deep enough that a naive recursive markBSON/unmarkBSON would
      // overflow the call stack; an explicit-stack iterative walk handles
      // it fine. This deliberately does NOT go through `roundTrip`
      // (structuredClone): Node's own structuredClone is itself recursive
      // internally and overflows on plain nesting around ~2,379 levels on
      // this machine, well below what we want to prove about our own
      // traversal, so we call markBSON/unmarkBSON directly instead.
      for (let i = 0; i < 100_000; i++) {
        deep = { child: deep };
      }

      let node = unmarkBSON(markBSON(deep)) as Deep;
      for (let i = 0; i < 100_000; i++) {
        node = node.child as Deep;
      }
      expect(node.id).to.be.instanceOf(ObjectId);
      expect(node.id?.toHexString()).to.equal(id.toHexString());
    });

    it('restores BSON values found inside a Map, as both key and value', function () {
      const keyId = new ObjectId();
      const valueId = new ObjectId();
      const input = { m: new Map([[keyId, valueId]]) };

      const result = roundTrip(input) as { m: Map<ObjectId, ObjectId> };
      expect(result.m).to.be.instanceOf(Map);
      expect(result.m.size).to.equal(1);
      const [[k, v]] = [...result.m];
      expect(k).to.be.instanceOf(ObjectId);
      expect(k.toHexString()).to.equal(keyId.toHexString());
      expect(v).to.be.instanceOf(ObjectId);
      expect(v.toHexString()).to.equal(valueId.toHexString());
    });

    it('restores BSON values found inside a Set', function () {
      const id = new ObjectId();
      const input = { s: new Set([id, 'plain-value']) };

      const result = roundTrip(input) as { s: Set<ObjectId | string> };
      expect(result.s).to.be.instanceOf(Set);
      const values = [...result.s];
      expect(values).to.have.lengthOf(2);
      const restoredId = values.find((v) => v instanceof ObjectId) as ObjectId;
      expect(restoredId.toHexString()).to.equal(id.toHexString());
      expect(values).to.include('plain-value');
    });

    it('restores BSON values nested inside a Map value that is itself an array/object', function () {
      const id = new ObjectId();
      const input = { m: new Map([['key', { nested: [id] }]]) };

      const result = roundTrip(input) as {
        m: Map<string, { nested: [ObjectId] }>;
      };
      const nested = result.m.get('key');
      expect(nested?.nested[0]).to.be.instanceOf(ObjectId);
      expect(nested?.nested[0].toHexString()).to.equal(id.toHexString());
    });

    it('leaves a Date completely untouched', function () {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = roundTrip({ date }) as { date: Date };
      expect(result.date).to.be.instanceOf(Date);
      expect(result.date.getTime()).to.equal(date.getTime());
    });

    it('leaves a plain RegExp completely untouched', function () {
      const re = /abc/gi;
      const result = roundTrip({ re }) as { re: RegExp };
      expect(result.re).to.be.instanceOf(RegExp);
      expect(result.re.source).to.equal('abc');
      expect(result.re.flags).to.equal('gi');
    });

    it('leaves a raw Buffer/Uint8Array completely untouched', function () {
      const buf = Buffer.from([1, 2, 3]);
      const result = roundTrip({ buf }) as { buf: Uint8Array };
      expect(Buffer.from(result.buf).equals(buf)).to.be.true;
    });

    it('preserves shared-reference identity for a BSON value reachable via two paths', function () {
      const id = new ObjectId();
      const input = { a: id, b: id };
      const result = roundTrip(input) as { a: ObjectId; b: ObjectId };
      expect(result.a).to.be.instanceOf(ObjectId);
      // structuredClone preserves reference identity for shared objects,
      // this also proves the `visited` guard doesn't stop the second
      // reference from being properly restored.
      expect(result.a).to.equal(result.b);
    });

    it('does not hang on a circular reference and preserves the cycle', function () {
      const id = new ObjectId();
      const input: { id: ObjectId; self?: unknown } = Object.assign(
        Object.create(null),
        { id }
      );
      input.self = input;

      const result = roundTrip(input) as { id: ObjectId; self: unknown };
      expect(result.id).to.be.instanceOf(ObjectId);
      expect(result.self).to.equal(result);
    });
  });

  describe('markBSON marker shape', function () {
    it('stamps a marker key containing a null byte, which cannot collide with a real BSON field name', function () {
      const id = new ObjectId();
      const marked = markBSON(id) as Record<string, unknown>;
      const markerKey = Object.getOwnPropertyNames(marked).find((key) =>
        key.includes('\x00')
      );
      expect(markerKey).to.be.a('string');
      expect(marked[markerKey as string]).to.equal('ObjectId');
    });

    it('does not add a marker to values that are not BSON instances', function () {
      const marked = markBSON({ a: 1, b: [1, 2, 3] }) as Record<
        string,
        unknown
      >;
      expect(Object.getOwnPropertyNames(marked)).to.deep.equal(['a', 'b']);
    });
  });
});
