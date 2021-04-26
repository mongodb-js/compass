import { expect } from 'chai';
import processTopLevelAwait from './await';

describe('await', () => {
  context('does not do anything', () => {
    it('if there is no await inside', () => {
      const code = `
var someCode = "a string";
callingSomeFunctions();
// with comments
someCode
`;
      expect(processTopLevelAwait(code)).to.equal(null);
    });

    it('if there is a return statement present', () => {
      const code = `
var someVar = "test value";
return someVar;
`;
      expect(processTopLevelAwait(code)).to.equal(null);
    });
  });

  // note: all other tests have to include an await call!
  context('processes variable declarations', () => {
    it('single', () => {
      const code = `
var someVar = "test value";
await db.coll.insertOne({ someVar });
`;
      expect(processTopLevelAwait(code)).to.equal(`(async () => {

void (someVar = "test value");
return (await db.coll.insertOne({ someVar }));

})()`);
    });

    it('multiple', () => {
      const code = `
var someVar = "test value", anotherVar;
await db.coll.insertOne({ someVar });
`;
      expect(processTopLevelAwait(code)).to.equal(`(async () => {

void ( (someVar = "test value"), (anotherVar=undefined));
return (await db.coll.insertOne({ someVar }));

})()`);
    });

    it('lets and consts', () => {
      const code = `
let someVar = "test value";
const anotherVar = "has value";
await db.coll.insertOne({ someVar });
`;
      expect(processTopLevelAwait(code)).to.equal(`(async () => {

void (someVar = "test value");
void (anotherVar = "has value");
return (await db.coll.insertOne({ someVar }));

})()`);
    });

    it('hoisted vars but not let', () => {
      const code = `
if (callMeMaybe) {
  var ringRing = "hey, it's me!";
  let bingBing = "c'est moi!";
  const bongBong = "hola, como estas?";
}
function call() {
  var thisIsNested;
}
await db.coll.insertOne({});
`;
      expect(processTopLevelAwait(code)).to.equal(`(async () => {

if (callMeMaybe) {
  void (ringRing = "hey, it's me!");
  let bingBing = "c'est moi!";
  const bongBong = "hola, como estas?";
}
call=function call() {
  var thisIsNested;
}
return (await db.coll.insertOne({}));

})()`);
    });
  });

  it('processes function declarations', () => {
    const code = `
await callingTheFunc();
async function callingTheFunc() {
  return await db.coll.insertOne({});
}
`;
    expect(processTopLevelAwait(code)).to.equal(`(async () => {

await callingTheFunc();
callingTheFunc=async function callingTheFunc() {
  return await db.coll.insertOne({});
}

})()`);
  });

  it('accepts comments at the end of the code', () => {
    const code = 'await print() // comment';
    expect(processTopLevelAwait(code)).to.equal(`(async () => {
return (await print()) // comment
})()`);
  });

  context('processes for-of statements', () => {
    it('checks for direct await', () => {
      const code = `
for await (const c of names) {
  const otherName = c;
}
`;
      expect(processTopLevelAwait(code)).to.equal(`(async () => {

for await (const c of names) {
  const otherName = c;
}

})()`);
    });

    it('checks for await inside loop', () => {
      const code = `
for (const c of names) {
  await db.coll.insertOne({ name: c });
}
`;
      expect(processTopLevelAwait(code)).to.equal(`(async () => {

for (const c of names) {
  await db.coll.insertOne({ name: c });
}

})()`);
    });

    it('checks for return inside loop', () => {
      const code = `
for (const c of names) {
  return db.coll.insertOne({ name: c });
}
`;
      expect(processTopLevelAwait(code)).to.equal(null);
    });
  });
});
