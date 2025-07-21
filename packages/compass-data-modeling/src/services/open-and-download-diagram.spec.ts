import { expect } from 'chai';
import {
  getDownloadDiagramContent,
  getDiagramName,
  getDiagramContentsFromFile,
} from './open-and-download-diagram';
import FlightDiagram from '../../test/fixtures/flights-diagram.json';

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

  it('should return the correct diagram name', function () {
    const existingNames = ['Flights', 'Berlin Public Transport'];

    expect(
      getDiagramName(existingNames, 'Airbnb'),
      'should return the expected name when it does not exist'
    ).to.equal('Airbnb');

    expect(
      getDiagramName(existingNames, 'Flights'),
      'should return the next expected name when it exists'
    ).to.equal('Flights (1)');

    existingNames.push('Flights (1)');

    expect(
      getDiagramName(existingNames, 'Flights'),
      'should return the next expected name when multiple versions exist'
    ).to.equal('Flights (2)');
  });

  context('getDiagramContentsFromFile', function () {
    const makeFile = (
      content: string,
      fileName: string,
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
          'should throw an error if content.version and content.type is not valid',
        file: makeFile(
          JSON.stringify({ version: 0, type: 'something' }),
          'file.json'
        ),
        expected: 'Unsupported diagram file format',
      },
      {
        title: 'should throw if name or edits are missing',
        file: makeFile(
          JSON.stringify({ version: 1, type: 'Compass Data Modeling Diagram' }),
          'file.json'
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
          }),
          'file.json'
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
          }),
          'file.json'
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
          }),
          'file.json'
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
          }),
          'file.json'
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
        }),
        'diagram.json',
        'application/json'
      );

      const { name, edits } = await getDiagramContentsFromFile(file);
      expect(name).to.equal('Test Diagram');
      expect(edits).to.deep.equal(FlightDiagram.edits);
    });
  });
});
