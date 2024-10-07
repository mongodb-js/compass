# @mongodb-js/compass-components

Compass Components package contains all foundational components and hooks used to build parts of Compass.

## Guidelines

- If there is a foundational component available in LeafyGreen we **do not write our own**, instead we wrap that in compass-components and use it throughout Compass. LeafyGreen component usage should follow the "Design Documentation" for the component that is being used (when available).
  - Refer to [LeafyGreen Design System](https://www.mongodb.design/) website to see all available LeafyGreen components.
  - Ask in `#leafygreen-ui` Slack channel if you have any questions about the LeafyGreen component usage that the team can't help you answer or documentation is not sufficient.
- Components only use LeafyGreen variables for colors, typography, spacings, etc. Using custom values **should be avoided**. If Figma designs are not aligned with LeafyGreen design tokens, talk to the design team about that.
- Use [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/) guidelines when building components.
  - A screenreader can be used to navigate through and interact with the components.
  - Components are navigable by using tab and arrow keys.
