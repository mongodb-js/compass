import { expect } from 'chai';
import { parseXmlToJsonResponse } from './parse-xml-response';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

describe('parseXmlToJsonResponse', function () {
  context('handles find', function () {
    const options = { logger: createNoopLogger(), type: 'find' as const };
    const NULL_QUERY = {
      filter: null,
      project: null,
      sort: null,
      skip: null,
      limit: null,
    };
    it('should return aggregation and query if provided', function () {
      const xmlString = `
        <filter>{ age: { $gt: 25 } }</filter>
        <aggregation>[{ $match: { status: "A" } }]</aggregation>
      `;
      const result = parseXmlToJsonResponse(xmlString, options);
      expect(result).to.deep.equal({
        content: {
          aggregation: {
            pipeline: "[{$match:{status:'A'}}]",
          },
          query: {
            filter: '{age:{$gt:25}}',
            project: null,
            sort: null,
            skip: null,
            limit: null,
          },
        },
      });
    });
    it('should return all the query fields if provided', function () {
      const xmlString = `
        <filter>{ age: { $gt: 25 } }</filter>
        <project>{ name: 1, age: 1 }</project>
        <sort>{ age: -1 }</sort>
        <skip>5</skip>
        <limit>10</limit>
        <aggregation></aggregation>
      `;
      const result = parseXmlToJsonResponse(xmlString, options);
      expect(result).to.deep.equal({
        content: {
          aggregation: {
            pipeline: '',
          },
          query: {
            filter: '{age:{$gt:25}}',
            project: '{name:1,age:1}',
            sort: '{age:-1}',
            skip: '5',
            limit: '10',
          },
        },
      });
    });
    context('it should handle invalid data', function () {
      it('invalid json', function () {
        const result = parseXmlToJsonResponse(
          `<filter>{ age: { $gt: 25 </filter>`,
          options
        );
        expect(result.content.query).to.deep.equal(NULL_QUERY);
      });
      it('empty object', function () {
        const result = parseXmlToJsonResponse(`<filter>{}</filter>`, options);
        expect(result.content.query).to.deep.equal(NULL_QUERY);
      });
      it('zero value', function () {
        const result = parseXmlToJsonResponse(`<limit>0</limit>`, options);
        expect(result.content.query).to.deep.equal(NULL_QUERY);
      });
    });
  });

  context('handles aggregate', function () {
    const options = { logger: createNoopLogger(), type: 'aggregate' as const };
    it('returns empty pipeline its not available in the response', function () {
      const xmlString = ``;
      const result = parseXmlToJsonResponse(xmlString, options);
      expect(result).to.deep.equal({
        content: {
          aggregation: {
            pipeline: '',
          },
        },
      });
    });
    it('handles empty array', function () {
      const xmlString = `<aggregation>[]</aggregation>`;
      const result = parseXmlToJsonResponse(xmlString, options);
      expect(result).to.deep.equal({
        content: {
          aggregation: {
            pipeline: '',
          },
        },
      });
    });
    it('returns aggregation pipeline if available', function () {
      const xmlString = `
        <aggregation>[{ $match: { status: "A" } }]</aggregation>
      `;
      const result = parseXmlToJsonResponse(xmlString, options);
      expect(result).to.deep.equal({
        content: {
          aggregation: {
            pipeline: "[{$match:{status:'A'}}]",
          },
        },
      });
    });
  });
});
