import { expect } from 'chai';
import sinon from 'sinon';
import { EditorView, showTooltip, type Tooltip } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import {
  lintTooltipExitDelay,
  TOOLTIP_DATA_ATTR,
  TOOLTIP_SELECTOR,
} from './lint-tooltip-exit-delay';

const EXIT_DELAY = 300;

const setTooltip = StateEffect.define<Tooltip | null>();
const tooltipField = StateField.define<Tooltip | null>({
  create() {
    return null;
  },
  update(tooltip, tr) {
    return tr.effects.reduce(
      (current, effect) => (effect.is(setTooltip) ? effect.value : current),
      tooltip
    );
  },
  provide: (field) => showTooltip.from(field),
});

const tooltip: Tooltip = {
  pos: 0,
  create() {
    // Mirror the DOM shape produced by codemirror
    const dom = document.createElement('ul');
    dom.className = 'cm-tooltip-lint';
    const diagnostic = document.createElement('li');
    diagnostic.className = 'cm-diagnostic';
    const message = document.createElement('span');
    message.setAttribute(TOOLTIP_DATA_ATTR, 'true');
    message.textContent = 'Exceeds safe integer range.';
    diagnostic.appendChild(message);
    dom.appendChild(diagnostic);
    return { dom };
  },
};

describe('lintTooltipExitDelay', function () {
  let clock: sinon.SinonFakeTimers;
  let view: EditorView;

  const tooltipInDom = () => !!view.dom.querySelector(TOOLTIP_SELECTOR);

  const mousemoveOver = (selector: string) => {
    const target = view.dom.querySelector(selector) ?? view.dom;
    target.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    );
  };

  const mousemoveOutside = () => {
    document.body.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true })
    );
  };

  beforeEach(function () {
    clock = sinon.useFakeTimers();
    view = new EditorView({
      doc: '1234',
      extensions: [tooltipField, lintTooltipExitDelay(EXIT_DELAY)],
      parent: document.body,
    });
    view.dispatch({ effects: setTooltip.of(tooltip) });
    expect(tooltipInDom()).to.be.true;
  });

  afterEach(function () {
    view.destroy();
    clock.restore();
  });

  it('keeps the tooltip visible for the exit delay', function () {
    view.dispatch({ effects: setTooltip.of(null) });
    expect(tooltipInDom()).to.be.true;

    clock.tick(EXIT_DELAY - 1);
    expect(tooltipInDom()).to.be.true;

    clock.tick(1);
    expect(tooltipInDom()).to.be.false;
  });

  it('keeps the tooltip visible when the pointer comes back onto it', function () {
    view.dispatch({ effects: setTooltip.of(null) });

    clock.tick(EXIT_DELAY - 100);
    mousemoveOver(TOOLTIP_SELECTOR);

    clock.tick(EXIT_DELAY * 10);
    expect(tooltipInDom()).to.be.true;
  });

  it('hides the tooltip when the pointer leaves again after coming back', function () {
    view.dispatch({ effects: setTooltip.of(null) });
    clock.tick(EXIT_DELAY - 100);
    mousemoveOver(TOOLTIP_SELECTOR);
    clock.tick(EXIT_DELAY * 10);
    expect(tooltipInDom()).to.be.true;

    mousemoveOutside();
    clock.tick(EXIT_DELAY - 1);
    expect(tooltipInDom()).to.be.true;

    clock.tick(1);
    expect(tooltipInDom()).to.be.false;
  });
});
