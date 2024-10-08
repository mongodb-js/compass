# @mongodb-js/compass-components

Compass Components package contains all foundational components and hooks used to build parts of Compass. Keeping all leafygreen dependencies and core UI components in a single package allows us to easier manage external depedendencies on LeafyGreen (including making sure that we never have multiple versions of the same LeafyGreen packages in the application at the same time as this can lead to technical issues) and make sure that the UI is consistently updated throughout the whole application.

## Guidelines

- If there is a foundational component available in LeafyGreen we **do not write our own**, instead we wrap that in compass-components and use it throughout Compass. LeafyGreen component usage should follow the "Design Documentation" for the component that is being used (when available).
  - Refer to [LeafyGreen Design System](https://www.mongodb.design/) website to see all available LeafyGreen components.
  - Ask in `#leafygreen-ui` Slack channel if you have any questions about the LeafyGreen component usage that the team can't help you answer or documentation is not sufficient.
- Components only use LeafyGreen variables for colors, typography, spacings, etc. Using custom values **should be avoided**. If Figma designs are not aligned with LeafyGreen design tokens, talk to the design team about that.
- Use [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/) guidelines when building components.
  - A screenreader can be used to navigate through and interact with the components.
  - Components are navigable by using tab and arrow keys.
