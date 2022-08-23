# leafy-green

> Copied from the [Leafy Green][leafy-green-repository] repository components.

The most recent versions of Leafy Green comments cause all sorts of breaking changes and bring new branding designs that we currently postpone with enabling in Compass. The LG team hasn’t backported fixes in the past to the older versions of components, therefore to solve critical issues we decided to temporarily copy the broken LG components to our project to fix bugs on our end as a workaround.

## Components

### @leafygreen-ui/combobox@0.9.0

The LG [Combobox][leafy-green-combobox] component is [not escaping][no-escape-regexp] option display names before passing them to regexp constructor leading to possible crashes when option display names are invalid regexp. In Compass, it brakes creating indexes with special characters e.g. [wildcard indexes][wildcard-indexes] (`field.$**`). This also means that there is also a potential issue with having malicious regex being evaluated if any user input is rendered as Combobox options.

### @leafygreen-ui/pipeline@2.1.7

We copied this package here as part of https://jira.mongodb.org/browse/COMPASS-5388, since at the time there wasn't a rebranded version of the pipeline component without outdated dependencies.

[leafy-green-repository]: https://github.com/mongodb/leafygreen-ui
[leafy-green-combobox]: https://github.com/mongodb/leafygreen-ui/tree/main/packages/combobox
[no-escape-regexp]: https://github.com/mongodb/leafygreen-ui/pull/1351/files#diff-1a4166952e6e8b6479fcd56d6fafb06ad44c0d326078ae6010e2b2fb1e075363L20
[wildcard-indexes]: https://www.mongodb.com/docs/compass/current/indexes/#wildcard-indexes
