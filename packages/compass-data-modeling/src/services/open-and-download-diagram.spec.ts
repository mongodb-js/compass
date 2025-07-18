import { expect } from 'chai';
import { getDownloadDiagramContent } from './open-and-download-diagram';
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
});
