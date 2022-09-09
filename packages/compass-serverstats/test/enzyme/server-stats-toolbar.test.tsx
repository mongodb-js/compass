import { expect } from 'chai';
import enzyme from 'enzyme';
import React from 'react';
import d3 from 'd3';

import realTimeDispatcher from '../../src/d3/real-time-dispatcher';
import { ServerStatsToolbar } from '../../src/components/server-stats-toolbar';

describe('<ServerStatsToolbar />', function() {
  context('when initialized, mounted and rendered', function() {
    beforeEach(function() {
      this.dispatcher = realTimeDispatcher();
      this.component = enzyme.mount(
        <ServerStatsToolbar
          eventDispatcher={this.dispatcher}
        />
      );
    });

    it('shows a default time of 00:00:00', function() {
      expect(this.component.find('[data-testid="server-stats-time"]').text()).to.equal('00:00:00');
    });

    context('when the eventDispatcher notifies a newXValue', function() {
      beforeEach(function() {
        this.date = new Date(1512153289331);
        this.dispatcher.newXValue(this.date);
      });

      it('shows the correct time', function() {
        expect(
          this.component.find('[data-testid="server-stats-time"]').text()
        ).to.equal(d3.time.format.utc('%X')(this.date));
      });
    });
  });
});
