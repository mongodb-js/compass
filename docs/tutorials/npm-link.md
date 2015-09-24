# How to `npm link`

Say `~/scout-ci` is your work projects folder.
First, grab the money module as the first step in
any debugging adventure is adding a `console.log`
somewhere just to know you're env is setup.

```bash
mkdir -p ~/scout-ci;
cd ~/scout-ci;
git clone git@github.com:mongodb-js/mongodb-connection-model.git;
cd mongodb-connection-model;
npm link;
cd ../;
git clone git@github.com:10gen/scout-server.git;
cd scout-server;
git checkout -t origin/auth;
npm link;
npm link mongodb-connection-model;
cd ../;
git clone git@github.com:10gen/scout-client.git;
cd scout-client;
git checkout -t origin/auth;
npm link;
npm link scout-server;
npm link mongodb-connection-model;
npm install -electron-prebuilt@0.30.6;
./node_modules/.bin/zuul --electron -- test/*.test.js;
```

Yay.  Not so bad.  Yes, that did take a bit of time BUT
next week we be removing aNd updating a tonnnnn of dependencies.
Deep breaths :)

Soooooo now let's run some tests!  Please open a new doc
in google drive because I need to give you a list of
all the places where your print out will need to be correcte...

Nah! Just run:

```bash
npm start;
```

So yeah you know... one command?! big whoop! What could that possibly do?

- Starts a mongodb deployment using the same tooling the nodejs
 driver does (ht @Judah)
- Starts up `scout-server` if one not already running
- [zuul](http://npm.im/zuul) watches your changes to this dir and
 your tests, deps, src and rebuilds your src maps, code coverage,
 starts up Chrome and loads your test harness... But, yeah, that
  was a ton of deps... :)

> @todo (imlucas): How to use Chrome Devtools to Debug Failing or Flakey
> Tests like Dan Pasette [sneak peak](https://cldup.com/745nt7Jca_-1200x1200.png)

What's that you say?  You think their might be something in server
you want to be able to change and have it reloaded automatically?
And when you're connecting to a cluster?
And... on the latest unstable release of the kernel?

Press `ctrl+c`.

```bash
cd ../scout-server;
DEBUG=* MONGODB_VERSION=unstable MONGODB_TOPOLOGY=cluster npm start;
```

Open another terminal window and start up the client tests... oh?  
But in electron? Using the same artifacts we use to build the app  
on our end?  Well.... gee I dunno... Might take a littl.... BOOM!

```bash
cd ~/scout-ci;
cd ~/scout-client;
npm install -electron-prebuilt@0.30.6;
./node_modules/.bin/zuul --electron -- test/*.test.js;
```

> @todo (imlucas): How to use localtunnel to test real-world
> latency between NYC and Sydney w/o filing a JIRA.
