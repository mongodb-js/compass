import { expect } from 'chai';
import { parseXmlToMmsJsonResponse } from './xml-to-mms-response';
import type { Logger } from '@mongodb-js/compass-logging';

const loggerMock = {
  log: {
    warn: () => {
      /* noop */
    },
  },
  mongoLogId: (id: number) => id,
} as unknown as Logger;
describe('parseXmlToMmsJsonResponse', function () {
  it('should parse valid XML string to MMS JSON response', function () {
    const xmlString = `
      <filter>{ age: { $gt: 25 } }</filter>
      <project>{ name: 1, age: 1 }</project>
      <sort>{ age: -1 }</sort>
      <skip>5</skip>
      <limit>10</limit>
      <aggregation>[{ $match: { status: "A" } }]</aggregation>
    `;

    const result = parseXmlToMmsJsonResponse(xmlString, loggerMock);

    expect(result).to.deep.equal({
      content: {
        aggregation: {
          pipeline: '[{"$match":{"status":"A"}}]',
        },
        query: {
          filter: '{"age":{"$gt":25}}',
          project: '{"name":1,"age":1}',
          sort: '{"age":-1}',
          skip: '5',
          limit: '10',
        },
      },
    });
  });

  context('it should return null values for invalid data', function () {
    it('invalid json', function () {
      const result = parseXmlToMmsJsonResponse(
        `<filter>{ age: { $gt: 25 </filter>`,
        loggerMock
      );
      expect(result.content.query.filter).to.equal(null);
    });
    it('empty object', function () {
      const result = parseXmlToMmsJsonResponse(
        `<filter>{}</filter>`,
        loggerMock
      );
      expect(result.content.query.filter).to.equal(null);
    });
    it('empty array', function () {
      const result = parseXmlToMmsJsonResponse(
        `<aggregation>[]</aggregation>`,
        loggerMock
      );
      expect(result.content.aggregation.pipeline).to.equal(null);
    });
    it('zero value', function () {
      const result = parseXmlToMmsJsonResponse(`<limit>0</limit>`, loggerMock);
      expect(result.content.query.limit).to.equal(null);
    });
  });
});
