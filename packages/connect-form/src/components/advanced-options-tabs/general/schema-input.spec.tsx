import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './schema-input';

describe('SchemaInput', function () {
  let setConnectionStringUrlSpy: sinon.SinonSpy;

  beforeEach(function () {
    setConnectionStringUrlSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('with a srv connection string schema (mongodb+srv://)', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      render(
        <SchemaInput
          connectionStringUrl={connectionStringUrl}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should render the srv box selected', function () {
      const srvRadioBox = screen.getAllByRole('radio')[1] as HTMLInputElement;
      expect(srvRadioBox.checked).to.equal(true);
      expect(srvRadioBox.getAttribute('aria-checked')).to.equal('true');
    });

    it('should render the standard box not selected', function () {
      const standardSchemaRadioBox = screen.getAllByRole(
        'radio'
      )[0] as HTMLInputElement;
      expect(standardSchemaRadioBox.checked).to.equal(false);
      expect(standardSchemaRadioBox.getAttribute('aria-checked')).to.equal(
        'false'
      );
    });

    describe('when the standard schema radio box is clicked', function () {
      beforeEach(function () {
        const standardSchemaRadioBox = screen.getAllByRole('radio')[0];
        fireEvent.click(standardSchemaRadioBox);
      });

      it('should call to update the connection string with standard schema', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(1);
        expect(setConnectionStringUrlSpy.firstCall.args[0].isSRV).to.equal(
          false
        );
        expect(setConnectionStringUrlSpy.firstCall.args[0].toString()).to.equal(
          'mongodb://0ranges:p!neapp1es@localhost:27017/?ssl=true'
        );
      });
    });

    describe('when the srv radio box is clicked again', function () {
      beforeEach(function () {
        const srvRadioBox = screen.getAllByRole('radio')[1];
        fireEvent.click(srvRadioBox);
      });

      it('should not call to update the connection string', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(0);
      });
    });
  });

  describe('with a standard connection string schema (mongodb://)', function () {
    describe('with a single host', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27017/?ssl=true'
        );
        render(
          <SchemaInput
            connectionStringUrl={connectionStringUrl}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );
      });

      it('should render the standard selected', function () {
        const srvRadioBox = screen.getAllByRole('radio')[0] as HTMLInputElement;
        expect(srvRadioBox.checked).to.equal(true);
        expect(srvRadioBox.getAttribute('aria-checked')).to.equal('true');
      });

      it('should render the srv box not selected', function () {
        const srvRadioBox = screen.getAllByRole('radio')[1] as HTMLInputElement;
        expect(srvRadioBox.checked).to.equal(false);
        expect(srvRadioBox.getAttribute('aria-checked')).to.equal('false');
      });

      describe('when the srv schema radio box is clicked', function () {
        beforeEach(function () {
          const srvSchemaRadioBox = screen.getAllByRole('radio')[1];
          fireEvent.click(srvSchemaRadioBox);
        });

        it('should call to update the connection string with srv schema', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(setConnectionStringUrlSpy.firstCall.args[0].isSRV).to.equal(
            true
          );
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal('mongodb+srv://0ranges:p!neapp1es@outerspace/?ssl=true');
        });
      });
    });

    describe('with direct connection set', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@localhost:27017/?directConnection=true&ssl=true'
        );
        render(
          <SchemaInput
            connectionStringUrl={connectionStringUrl}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );
      });

      describe('when the srv schema radio box is clicked', function () {
        beforeEach(function () {
          const srvSchemaRadioBox = screen.getAllByRole('radio')[1];
          fireEvent.click(srvSchemaRadioBox);
        });

        it('should call to update the connection string with srv schema and directConnection unset', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(setConnectionStringUrlSpy.firstCall.args[0].isSRV).to.equal(
            true
          );
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal('mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true');
        });
      });
    });

    describe('with multiple hosts', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27099,outerspace:27098,localhost:27098/?ssl=true'
        );
        render(
          <SchemaInput
            connectionStringUrl={connectionStringUrl}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );
      });

      describe('when the srv schema radio box is clicked', function () {
        beforeEach(function () {
          const srvSchemaRadioBox = screen.getAllByRole('radio')[1];
          fireEvent.click(srvSchemaRadioBox);
        });

        it('should call to update the connection string with srv schema', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(setConnectionStringUrlSpy.firstCall.args[0].isSRV).to.equal(
            true
          );
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal('mongodb+srv://0ranges:p!neapp1es@outerspace/?ssl=true');
        });
      });

      describe('when the standard schema radio box is clicked again', function () {
        beforeEach(function () {
          const standardRadioBox = screen.getAllByRole('radio')[0];
          fireEvent.click(standardRadioBox);
        });

        it('should not call to update the connection string', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(0);
        });
      });
    });
  });
});
