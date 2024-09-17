import { expect } from 'chai';
import React from 'react';
import d3 from 'd3';
import { render, screen } from '@mongodb-js/testing-library-compass';
import realTimeDispatcher from '../../src/d3/real-time-dispatcher';
import { ServerStatsToolbar } from '../../src/components/server-stats-toolbar';

describe('<ServerStatsToolbar />', function () {
  context('when initialized, mounted and rendered', function () {
    beforeEach(function () {
      this.dispatcher = realTimeDispatcher();
      this.component = render(
        <ServerStatsToolbar eventDispatcher={this.dispatcher} />
      );
    });

    it('shows a default time of 00:00:00', function () {
      expect(screen.getByTestId('server-stats-time').textContent).to.equal(
        '00:00:00'
      );
    });

    context('when the eventDispatcher notifies a newXValue', function () {
      beforeEach(function () {
        this.date = new Date(1512153289331);
        this.dispatcher.newXValue(this.date);
      });

      it('shows the correct time', function () {
        expect(screen.getByTestId('server-stats-time').textContent).to.equal(
          (d3 as any).time.format.utc('%X')(this.date)
        );
      });
    });
  });
});
