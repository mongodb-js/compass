import { rgba, css, palette } from '@mongodb-js/compass-components';

const styles = css({
  pointerEvents: 'none',
  width: '276px',
  background: palette.white,
  border: `1px solid ${palette.gray.light2}`,
  margin: '0 auto',
  position: 'absolute',
  borderRadius: '3px',
  padding: '18px 12px 6px 12px',
  boxShadow: `0px 2px 0px ${rgba(palette.black, 0.06)}`,
  '&:hover': { boxShadow: `0px 4px 2px ${rgba(palette.black, 0.12)}` },
  '.stage-header': {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0',
    color: palette.gray.dark2,
  },
  '&-is-shard': {
    background: palette.gray.light3,
    color: palette.gray.base,
    border: 'none',
    boxShadow: 'none',
    '.stage-header': { color: palette.gray.base, textAlign: 'center' },
  },
  ul: { fontSize: '12px', listStyle: 'none', margin: '0', padding: '0' },
  'ul li span.key': { color: palette.gray.base },
  'ul li span.value': { color: palette.gray.dark2, fontWeight: 'bold' },
  'ul li span.key:after': { content: "': '" },
  'ul.core': { marginBottom: '12px' },
  'ul.core li': { display: 'inline-block', marginTop: '9px', lineHeight: 1 },
  'ul.core li.nReturned .value': {
    color: palette.white,
    background: palette.blue.light1,
    fontWeight: 'bold',
    padding: '2px 6px',
    fontSize: '12px',
    lineHeight: 1,
    borderRadius: '20px',
  },
  'ul.core li.exec-time': { cssFloat: 'right', marginRight: '18px' },
  'ul.highlighted li': {
    borderTop: `1px solid ${palette.gray.light2}`,
    padding: '11px 0',
  },
  '.details': {
    borderTop: `1px solid ${palette.gray.light2}`,
    paddingTop: '12px',
    button: { pointerEvents: 'all', margin: '0', marginBottom: '6px' },
  },
  '.details-output': { pointerEvents: 'all', maxHeight: '40vh' },
});

export { styles };
