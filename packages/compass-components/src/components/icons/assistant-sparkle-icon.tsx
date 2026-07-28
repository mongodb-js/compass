import React from 'react';
import { AssistantAvatar } from '@leafygreen-ui/avatar';

/**
 * The gradient Sparkle that brands AI assistant entry points, per
 * https://www.mongodb.design/pattern/ai-branding
 *
 * `AssistantAvatar` is Leafygreen's gradient Sparkle. It is glyph-compatible
 * (its props extend `LGGlyph.ComponentProps`), so it can be passed as a button
 * `leftGlyph` in place of `<Icon glyph="Sparkle" />`, and it derives its own
 * gradient stops from the active theme, so it needs no color overrides.
 */
function AssistantSparkleIcon(): React.ReactElement {
  return <AssistantAvatar />;
}

export { AssistantSparkleIcon };
