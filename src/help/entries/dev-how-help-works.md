---
title: Compass Help System
tags:
  - help
devOnly: true
---

<strong>This entry explains the help system in Compass.</strong>

The Help system in Compass runs in a separate singleton window, like the
Connect Window. The sidebar shows a list of all available entries, sorted
alphabetically, the main view shows the title, tags, the actual help text,
and related entries.

### How to add a help button in Compass

To add a help button (little round info circle) anywhere in the app, go to
the `.jade` file and add a font-awesome symbol like so:

```
i.help(data-hook='my-help-entry')
```

The data-hook needs to point to a valid help entry key, in this case
`my-help-entry`.

No additional click handlers are required in any of the view classes. This
is already handled in `./src/app.js`, see the `event` object and the
`onHelpClicked` method.  


### How to add a help entry

To add a help entry, add a file to the `src/help/entries` folder.
The filename must be the help entry that was used in the `i.help`
element, and the extension is `.md` for markdown, e.g. `my-help-entry.md`.

As a convention, the first part of the entry key should be one of:

- `connect-` for help entries related to the Connect Window
- `schema-` for help entries related to the Schema Window
- `dev-` for developer-only help entries like this one


##### Front Matter

The entry content itself needs to start with a header called "front matter",
which is in YAML format. Here is an example:

```
---
title: Kerberos Principal
tags:
  - authentication
  - connect
  - kerberos
related:
  - connect-kerberos-service-name
devOnly: false
---
```

The only required field in the front matter is the `title` field. All other
fields are optional.

##### Tags

`tags` are added to the top of the article below the title, but currently
don't have any other function. We might add search by tags in a later version.

##### Related Links

When you add one or more related entry keys under the `related` field, a
"Related" section is automatically added at the bottom of the article, linking
to the related entries.

##### Entries for Developers

If the `devOnly` field is present and set to `true`, the entry receives
a special red `development` tag, indicating that this entry is meant for
internal development. All such entries are filtered out in the production
version and will not be visible to the end user.

##### Content

The actual content for a help entry is written in Markdown. For instructions
see Google.

##### Images

Images can be included in help entries as well. To add an image, copy it
to the `./images/help/` folder at the top level, and insert the image in
a help entry like so:

```
![](./images/help/my_image.png)
```

### Known Issues

- The help system currently doesn't support external links yet.
- The help window is not yet a singleton
- The help window is too big
- The help window needs styling
- The sidebar should have some hierarchy to find articles faster
- The sidebar should have a filter at the top to find articles faster
- The help system should be accessible from the Help menu
