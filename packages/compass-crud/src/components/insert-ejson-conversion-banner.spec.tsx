import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { ObjectId } from 'bson';
import InsertEJSONConversionBanner from './insert-ejson-conversion-banner';

const bannerTestId = 'insert-document-ejson-conversion-banner';

describe('InsertEJSONConversionBanner', function () {
  it('does not render for shell syntax', function () {
    render(
      <InsertEJSONConversionBanner
        parsedEditorText={{ _id: new ObjectId() }}
        conversionError={null}
        onConvert={() => {}}
      />
    );

    expect(screen.queryByTestId(bannerTestId)).to.not.exist;
  });

  it('does not render when the text could not be parsed', function () {
    render(
      <InsertEJSONConversionBanner
        parsedEditorText={null}
        conversionError={null}
        onConvert={() => {}}
      />
    );

    expect(screen.queryByTestId(bannerTestId)).to.not.exist;
  });

  it('renders the detected key and its shell equivalent', function () {
    render(
      <InsertEJSONConversionBanner
        parsedEditorText={{ _id: { $oid: '642d766b7300158b1f22e972' } }}
        conversionError={null}
        onConvert={() => {}}
      />
    );

    const banner = screen.getByTestId(bannerTestId);
    expect(banner).to.contain.text('$oid');
    expect(banner).to.contain.text('ObjectId()');
  });

  it('calls onConvert when the action is clicked', function () {
    const onConvert = sinon.spy();
    render(
      <InsertEJSONConversionBanner
        parsedEditorText={{ n: { $numberLong: '1' } }}
        conversionError={null}
        onConvert={onConvert}
      />
    );

    userEvent.click(
      screen.getByTestId('insert-document-ejson-conversion-button')
    );

    expect(onConvert).to.have.been.calledOnce;
  });

  it('shows why a conversion failed', function () {
    render(
      <InsertEJSONConversionBanner
        parsedEditorText={{ _id: { $oid: 'not-an-object-id' } }}
        conversionError="input must be a 24 character hex string"
        onConvert={() => {}}
      />
    );

    expect(
      screen.getByTestId('insert-document-ejson-conversion-error')
    ).to.contain.text('input must be a 24 character hex string');
  });

  it('hides the banner once dismissed', function () {
    render(
      <InsertEJSONConversionBanner
        parsedEditorText={{ n: { $numberLong: '1' } }}
        conversionError={null}
        onConvert={() => {}}
      />
    );

    userEvent.click(screen.getByLabelText('Close Message'));

    expect(screen.queryByTestId(bannerTestId)).to.not.exist;
  });
});
