import { expect } from 'chai';
import { parseXmlToMmsJsonResponse } from './xml-to-mms-response';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

describe('parseXmlToMmsJsonResponse', function () {
  it('should return prioritize aggregation over query when available and valid', function () {
    const xmlString = `
      <filter>{ age: { $gt: 25 } }</filter>
      <aggregation>[{ $match: { status: "A" } }]</aggregation>
    `;

    const result = parseXmlToMmsJsonResponse(xmlString, createNoopLogger());

    expect(result).to.deep.equal({
      content: {
        aggregation: {
          pipeline: "[{$match:{status:'A'}}]",
        },
        query: {
          filter: null,
          project: null,
          sort: null,
          skip: null,
          limit: null,
        },
      },
    });
  });

  it('should not return aggregation if its not available in the response', function () {
    const xmlString = `
      <filter>{ age: { $gt: 25 } }</filter>
    `;

    const result = parseXmlToMmsJsonResponse(xmlString, createNoopLogger());
    expect(result).to.deep.equal({
      content: {
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

  it('should not return query if its not available in the response', function () {
    const xmlString = `
      <aggregation>[{ $match: { status: "A" } }]</aggregation>
    `;

    const result = parseXmlToMmsJsonResponse(xmlString, createNoopLogger());

    expect(result).to.deep.equal({
      content: {
        aggregation: {
          pipeline: "[{$match:{status:'A'}}]",
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

    const result = parseXmlToMmsJsonResponse(xmlString, createNoopLogger());

    expect(result).to.deep.equal({
      content: {
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
      const result = parseXmlToMmsJsonResponse(
        `<filter>{ age: { $gt: 25 </filter>`,
        createNoopLogger()
      );
      expect(result.content).to.not.have.property('query');
    });
    it('empty object', function () {
      const result = parseXmlToMmsJsonResponse(
        `<filter>{}</filter>`,
        createNoopLogger()
      );
      expect(result.content).to.not.have.property('query');
    });
    it('empty array', function () {
      const result = parseXmlToMmsJsonResponse(
        `<aggregation>[]</aggregation>`,
        createNoopLogger()
      );
      expect(result.content).to.not.have.property('aggregation');
    });
    it('zero value', function () {
      const result = parseXmlToMmsJsonResponse(
        `<limit>0</limit>`,
        createNoopLogger()
      );
      expect(result.content).to.not.have.property('query');
    });
  });
});
