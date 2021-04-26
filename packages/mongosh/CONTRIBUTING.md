# Contributing

## Workflow

MongoDB welcomes community contributions! If you’re interested in making a contribution to the MongoDB Shell, please follow the steps below before you start writing any code:

1. Sign the [contributor's agreement](http://www.mongodb.com/contributor). This will allow us to review and accept contributions.
1. Fork the repository on GitHub
1. Create a branch with a name that briefly describes your feature
1. Implement your feature or bug fix
1. Add new test cases that verify your bug fix or make sure no one
   unintentionally breaks your feature in the future and run them with `npm test`
1. Add comments around your new code that explain what's happening
1. Commit and push your changes to your branch then submit a pull request

## Bugs

You can report new bugs by
[creating a new issue](https://jira.mongodb.org/browse/MONGOSH/).
Please include as much information as possible about your environment.

## Node.js versions

We support Node.js 12.x+ for the individual packages, and Node.js 14.x only for
the CLI repl specifically. These versions are mentioned:

- In the individual packages’ package.json files
- In the evergreen config
- In the homebrew generation script
- In the Docker files we use for building the binary/testing vscode
