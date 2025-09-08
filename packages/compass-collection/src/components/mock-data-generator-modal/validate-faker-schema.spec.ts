import { expect } from 'chai';
import sinon from 'sinon';

import { validateFakerSchema } from './validate-faker-schema';
import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

describe('validateFakerSchema', () => {
  let sandbox: sinon.SinonSandbox;
  let fakeFaker: any;
  let fakerModule: any;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    // Create a fake faker object with nested methods
    fakeFaker = {
      name: {
        firstName: sandbox.stub().returns('John'),
        lastName: sandbox.stub().returns('Doe'),
      },
      address: {
        city: sandbox.stub().returns('New York'),
      },
      mongodbObjectId: sandbox.stub().returns('507f1f77bcf86cd799439011'),
    };
    fakerModule = await import('@faker-js/faker');
    // Stub the imported 'faker' in the module
    sandbox.stub(fakerModule, 'faker').value(fakeFaker);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return the same field if the faker method exists and works with arguments', async () => {
    const schema: MockDataSchemaResponse = {
      content: {
        fields: [
          {
            fieldPath: 'name',
            mongoType: 'string',
            fakerMethod: 'name.firstName',
            fakerArgs: ['male'],
            isArray: false,
            probability: 1,
          },
        ],
      },
    };
    // Make sure the stub can accept arguments
    fakeFaker.name.firstName.withArgs(['male']).returns('John');

    const result = await validateFakerSchema(schema);
    expect(result[0].fakerMethod).to.equal('name.firstName');
    expect(result[0].fakerArgs).to.deep.equal(['male']);
  });

  it('should return the same field if the faker method exists and works without arguments', async () => {
    const schema: MockDataSchemaResponse = {
      content: {
        fields: [
          {
            fieldPath: 'city',
            fakerMethod: 'address.city',
            fakerArgs: [],
            isArray: false,
            probability: 1,
            mongoType: 'string',
          },
        ],
      },
    };

    const result = await validateFakerSchema(schema);
    expect(result[0].fakerMethod).to.equal('address.city');
    expect(result[0].fakerArgs).to.deep.equal([]);
  });

  it('should mark the method as Unrecognized if method does not exist', async () => {
    const schema: MockDataSchemaResponse = {
      content: {
        fields: [
          {
            fieldPath: 'foo',
            fakerMethod: 'foo.bar',
            fakerArgs: [],
            isArray: false,
            probability: 1,
            mongoType: 'string',
          },
        ],
      },
    };

    const result = await validateFakerSchema(schema);
    expect(result[0].fakerMethod).to.equal('Unrecognized');
    expect(result[0].fakerArgs).to.deep.equal([]);
  });

  it('should mark the method as Unrecognized if method throws with and without arguments', async () => {
    fakeFaker.name.firstName.throws(new Error('fail'));
    const schema: MockDataSchemaResponse = {
      content: {
        fields: [
          {
            fieldPath: 'name',
            fakerMethod: 'name.firstName',
            fakerArgs: ['male'],
            isArray: false,
            probability: 1,
            mongoType: 'string',
          },
        ],
      },
    };

    const result = await validateFakerSchema(schema);
    expect(result[0].fakerMethod).to.equal('Unrecognized');
    expect(result[0].fakerArgs).to.deep.equal([]);
  });

  it('should try without arguments if method throws with arguments', async () => {
    fakeFaker.name.firstName.withArgs(['male']).throws(new Error('fail'));
    fakeFaker.name.firstName.withArgs().returns('John');
    const schema: MockDataSchemaResponse = {
      content: {
        fields: [
          {
            fieldPath: 'name',
            fakerMethod: 'name.firstName',
            fakerArgs: ['male'],
            isArray: false,
            probability: 1,
            mongoType: 'string',
          },
        ],
      },
    };

    const result = await validateFakerSchema(schema);
    expect(result[0].fakerMethod).to.equal('name.firstName');
    expect(result[0].fakerArgs).to.deep.equal(['male']);
  });

  it('should handle multiple fields with mixed validity', async () => {
    fakeFaker.name.firstName.returns('John');
    fakeFaker.address.city.throws(new Error('fail'));
    const schema: MockDataSchemaResponse = {
      content: {
        fields: [
          {
            fieldPath: 'name',
            fakerMethod: 'name.firstName',
            fakerArgs: [],
            isArray: false,
            probability: 1,
            mongoType: 'string',
          },
          {
            fieldPath: 'city',
            fakerMethod: 'address.city',
            fakerArgs: [],
            isArray: false,
            probability: 1,
            mongoType: 'string',
          },
        ],
      },
    };

    const result = await validateFakerSchema(schema);
    expect(result[0].fakerMethod).to.equal('name.firstName');
    expect(result[1].fakerMethod).to.equal('Unrecognized');
  });
});
