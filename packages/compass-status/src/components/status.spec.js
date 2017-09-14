import React from 'react';
import { mount } from 'enzyme';

import Status from 'components/status';
import styles from './status.less';

describe('Status [Component]', () => {
  describe('#render', () => {
    context('when the component is at the default state', () => {
      let component;

      beforeEach(() => {
        component = mount(<Status />);
      });

      afterEach(() => {
        component = null;
      });

      it('renders the status section', () => {
        expect(component.find(`.${styles.status}`)).to.be.present();
      });

      it('sets the status as hidden', () => {
        expect(component.find(`.${styles['status-is-visible']}`)).to.not.be.present();
      });

      it('does not render the sidebar space', () => {
        expect(component.find(`.${styles['sidebar-is-visible']}`)).to.not.be.present();
      });

      it('renders the message area', () => {
        expect(component.find(`.${styles.message}`)).to.be.present();
      });

      it('does not render the message text area', () => {
        expect(component.find(`.${styles['message-text-is-visible']}`)).to.not.be.present();
      });

      it('does not render the spinner area', () => {
        expect(component.find(`.${styles['spinner-is-visible']}`)).to.not.be.present();
      });
    });

    context('when the component is visible', () => {
      context('when the progress bar is not visible', () => {
        let component;

        beforeEach(() => {
          component = mount(<Status visible />);
        });

        afterEach(() => {
          component = null;
        });

        it('renders the status section', () => {
          expect(component.find(`.${styles.status}`)).to.be.present();
        });

        it('sets the status as visible', () => {
          expect(component.find(`.${styles['status-is-visible']}`)).to.be.present();
        });

        it('does not render the sidebar space', () => {
          expect(component.find(`.${styles['sidebar-is-visible']}`)).to.not.be.present();
        });

        it('renders the message area', () => {
          expect(component.find(`.${styles.message}`)).to.be.present();
        });

        it('does not render the message text area', () => {
          expect(component.find(`.${styles['message-text-is-visible']}`)).to.not.be.present();
        });

        it('does not render the spinner area', () => {
          expect(component.find(`.${styles['spinner-is-visible']}`)).to.not.be.present();
        });
      });

      context('when the prgress bar is visible', () => {
        context('when there is no progress', () => {
          let component;

          beforeEach(() => {
            component = mount(<Status visible progressbar progress={0} />);
          });

          afterEach(() => {
            component = null;
          });

          it('displays the progress bar', () => {
            expect(component.find(`.${styles['progress-is-visible']}`)).to.be.present();
          });

          it('displays the progress bar', () => {
            expect(component.find(`.${styles['progress-bar-is-active']}`)).to.be.present();
          });

          it('sets progress bar width to 0%', () => {
            expect(component.find(`.${styles['progress-bar']}`)).to.have.style('width', '0%');
          });

          it('renders the status section', () => {
            expect(component.find(`.${styles.status}`)).to.be.present();
          });

          it('sets the status as visible', () => {
            expect(component.find(`.${styles['status-is-visible']}`)).to.be.present();
          });

          it('does not render the sidebar space', () => {
            expect(component.find(`.${styles['sidebar-is-visible']}`)).to.not.be.present();
          });

          it('renders the message area', () => {
            expect(component.find(`.${styles.message}`)).to.be.present();
          });

          it('does not render the message text area', () => {
            expect(component.find(`.${styles['message-text-is-visible']}`)).to.not.be.present();
          });

          it('does not render the spinner area', () => {
            expect(component.find(`.${styles['spinner-is-visible']}`)).to.not.be.present();
          });
        });

        context('when there is partial progress', () => {
          let component;

          beforeEach(() => {
            component = mount(<Status visible progressbar progress={50} />);
          });

          afterEach(() => {
            component = null;
          });

          it('sets progress bar width to 50%', () => {
            expect(component.find(`.${styles['progress-bar']}`)).to.have.style('width', '50%');
          });
        });
      });

      context('when the animation is visible', () => {
        context('when the message is empty', () => {
          let component;

          beforeEach(() => {
            component = mount(<Status visible animation />);
          });

          afterEach(() => {
            component = null;
          });

          it('does not display the progress area', () => {
            expect(component.find(`.${styles['progress-is-visible']}`)).to.not.be.present();
          });

          it('renders the status section', () => {
            expect(component.find(`.${styles.status}`)).to.be.present();
          });

          it('sets the status as visible', () => {
            expect(component.find(`.${styles['status-is-visible']}`)).to.be.present();
          });

          it('does not render the sidebar space', () => {
            expect(component.find(`.${styles['sidebar-is-visible']}`)).to.not.be.present();
          });

          it('renders the message area', () => {
            expect(component.find(`.${styles.message}`)).to.be.present();
          });

          it('does not render the message text area', () => {
            expect(component.find(`.${styles['message-text-is-visible']}`)).to.not.be.present();
          });

          it('displays spinner area', () => {
            expect(component.find(`.${styles['spinner-is-visible']}`)).to.be.present();
          });
        });

        context('when the message is not empty', () => {

        });

        context('when a sidebar is present', () => {

        });

        context('when a sidebar is not present', () => {

        });

        context('when a subview is not present', () => {

        });

        context('when a subview is present', () => {

        });
      });
    });
  });
});
