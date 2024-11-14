import ConnectionForm, { ColorCircleGlyph } from './components/connection-form';
import type { ConnectionFormProps } from './components/connection-form';
import { adjustConnectionOptionsBeforeConnect } from './hooks/use-connect-form';

export { adjustConnectionOptionsBeforeConnect, ColorCircleGlyph };

export type { ConnectionFormProps };

export {
  useConnectionColor,
  DefaultColorCode,
  CONNECTION_COLOR_CODES,
} from './hooks/use-connection-color';

export default ConnectionForm;
