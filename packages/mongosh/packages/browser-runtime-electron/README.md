# browser-runtime-electron

## ElectronRuntime

`Runtime` implementation that uses Node.js `vm` module as sandbox for
code execution.

``` js
import { ElectronRuntime } from 'mongosh-browser-repl';

const runtime = new ElectronRuntime(serviceProvider);
```

##### Example: usage in Compass

``` js
import { Shell, ElectronRuntime } from 'mongosh-browser-repl';

const runtime = new ElectronRuntime(
  CompassServiceProvider.fromDataService(dataService)
);

function MyShell(props) {
  return <Shell runtime={runtime} />;
}
```
