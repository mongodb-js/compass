import { expect } from 'chai';
import {
  getDownloadDiagramContent,
  getDiagramName,
  getDiagramContentsFromFile,
} from './open-and-download-diagram';
import FlightDiagram from '../../test/fixtures/data-model-with-relationships.json';

describe('open-and-download-diagram', function () {
  it('should return correct content to download', function () {
    const fileName = 'test-diagram';

    const { edits, ...restOfContent } = getDownloadDiagramContent(
      fileName,
      FlightDiagram.edits as any
    );
    expect(restOfContent).to.deep.equal({
      type: 'Compass Data Modeling Diagram',
      version: 1,
      name: fileName,
    });

    const decodedEdits = JSON.parse(
      Buffer.from(edits, 'base64').toString('utf-8')
    );
    expect(decodedEdits).to.deep.equal(FlightDiagram.edits);
  });

  context('getDiagramName', function () {
    const usecases = [
      {
        existingNames: [],
        name: 'Airbnb',
        expectedName: 'Airbnb',
        message: 'should return the expected name when it does not exist',
      },
      {
        existingNames: ['Airbnb'],
        name: 'Airbnb',
        expectedName: 'Airbnb (1)',
        message: 'should return the next expected name when it exists',
      },
      {
        existingNames: ['Airbnb (1)'],
        name: 'Airbnb (1)',
        expectedName: 'Airbnb (2)',
        message:
          'should return the next expected name when name with (number) exists',
      },
      {
        existingNames: ['Airbnb', 'Airbnb (1)', 'Airbnb (2)'],
        name: 'Airbnb (1)',
        expectedName: 'Airbnb (3)',
        message:
          'should return the next expected name when multiple versions exist',
      },
    ];

    for (const { existingNames, name, expectedName, message } of usecases) {
      it(message, function () {
        const result = getDiagramName(existingNames, name);
        expect(result).to.equal(expectedName);
      });
    }
  });

  context('getDiagramContentsFromFile', function () {
    const makeFile = (
      content: string,
      fileName: string = 'diagram.json',
      type: string = 'application/json'
    ) => {
      const blob = new Blob([content], { type });
      return new File([blob], fileName, { type });
    };
    const errorUsecases = [
      {
        title: 'should throw an error for a file with invalid JSON',
        file: makeFile('invalid content', 'invalid.txt', 'text/plain'),
        expected: 'Failed to parse diagram file',
      },
      {
        title:
          'should throw an error if content.version is not the current version',
        file: makeFile(
          JSON.stringify({ version: 0, type: 'Compass Data Modeling Diagram' })
        ),
        expected: 'Unsupported diagram file format',
      },
      {
        title: 'should throw an error if content.type is not the current type',
        file: makeFile(
          JSON.stringify({ version: 1, type: 'Compass Data Modeling' })
        ),
        expected: 'Unsupported diagram file format',
      },
      {
        title: 'should throw if name or edits are missing',
        file: makeFile(
          JSON.stringify({ version: 1, type: 'Compass Data Modeling Diagram' })
        ),
        expected: 'Diagram file is missing required fields',
      },
      {
        title: 'should throw if name or edits is not a string',
        file: makeFile(
          JSON.stringify({
            version: 1,
            type: 'Compass Data Modeling Diagram',
            name: 'Test diagram',
            edits: [],
          })
        ),
        expected: 'Diagram file is missing required fields',
      },
      {
        title: 'should throw if edits is invalid base64',
        file: makeFile(
          JSON.stringify({
            version: 1,
            type: 'Compass Data Modeling Diagram',
            name: 'Test Diagram',
            edits: 'something',
          })
        ),
        expected: 'Failed to parse diagram file',
      },
      {
        title: 'should throw if edits is valid base64 but not valid schema',
        file: makeFile(
          JSON.stringify({
            version: 1,
            type: 'Compass Data Modeling Diagram',
            name: 'Test Diagram',
            edits: Buffer.from(
              JSON.stringify([{ type: 'NonExistent' }])
            ).toString('base64'),
          })
        ),
        expected: 'Failed to parse diagram file: Invalid diagram data.',
      },
      {
        title: 'should throw if first edit is not SetModel',
        file: makeFile(
          JSON.stringify({
            version: 1,
            type: 'Compass Data Modeling Diagram',
            name: 'Test Diagram',
            edits: Buffer.from(
              JSON.stringify([
                {
                  type: 'MoveCollection',
                  ns: 'test',
                  newPosition: [0, 0],
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  timestamp: new Date().toISOString(),
                },
              ])
            ).toString('base64'),
          })
        ),
        expected: 'Failed to parse diagram file: Invalid diagram data.',
      },
    ];
    for (const { title, file, expected } of errorUsecases) {
      it(title, async function () {
        try {
          await getDiagramContentsFromFile(file);
          expect.fail('Expected an error to be thrown');
        } catch (error) {
          expect((error as Error).message).to.contain(expected);
        }
      });
    }

    it('should return the correct diagram contents from a valid file', async function () {
      const file = makeFile(
        JSON.stringify({
          version: 1,
          type: 'Compass Data Modeling Diagram',
          name: 'Test Diagram',
          edits: Buffer.from(JSON.stringify(FlightDiagram.edits)).toString(
            'base64'
          ),
        })
      );

      const { name, edits } = await getDiagramContentsFromFile(file);
      expect(name).to.equal('Test Diagram');
      expect(edits).to.deep.equal(FlightDiagram.edits);
    });
  });
});
