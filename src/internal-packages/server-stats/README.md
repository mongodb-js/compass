# Compass Real Time Server Stats Package

The RTSS page is compromised of 3 main elements:
- The "Hot Collections" table based on the `top` command
- The "Slow Operations" table based on the `currentOp` command
- Four charts based on the `serverStatus` command

# Components

The top-level component for the RTSS view is the `PerformanceComponent`, which contains the `TimeAndPauseButton` (the pause button and timer at the top of the page), `DBErrorComponent`, and the lists and charts components.

- PerformanceComponent
  - TimeAndPauseButton
  - DBErrorComponent
  - ServerStatsListComponent
    - TopComponent
    - CurrentOpComponent
  - ServerStatsGraphsComponent
    - ChartComponent (x4)

## Lists
The lists are contained in the `ServerStatsListsComponent`, which contains both `TopComponent` and the `CurrentOpComponent`. The Slow Operations table also includes the `DetailViewComponent`, which shows the raw data from the `currentOp` command.

## Charts
The `ServerStatsGraphsComponent` contains four instances of `ChartComponent`, one for each instance of the d3 chart defined in the `d3` folder.

# Stores

## Charts
The `ServerStatsGraphsStore` listens to the `DataServiceActions.serverStatsComplete`, `pause`, and `restart` actions. When `DataServiceActions.serverStats` is called, about once a second, [the serverStatus command](https://docs.mongodb.com/manual/reference/command/serverStatus/#dbcmd.serverStatus) is called on the DataService client. The results of the command is then passed to each of the four graph stores, which are named after the field of the result that they display. Each of the chart stores listen to the `ServerStatsStore` and the `restart` action.

The `restart` action clears the stored data in each of the chart stores and the `pause` action stops new data from being displayed but continues to collect data.

The charts' X axes are the time from [the "localTime" field](https://docs.mongodb.com/manual/reference/command/serverStatus/#serverstatus.localTime) and the Y axes vary depending on the graph. Each graph store selects data to send to it's instance of `ChartComponent` where it is put into a d3 chart.

Because the Network and Operations graphs show deltas, all graphs are shown with a 1-second delay. Chart lines will not draw if a pause of more than 1.5 seconds is detected between data points. This results in charts that may not be contiguous but will never show back-in-time behavior due to interpolation.

### Memory
The `MemStore` gets data from [the "mem" field](https://docs.mongodb.com/manual/reference/command/serverStatus/#mem). The Y values are the current memory usage from `serverStatus.mem.vsize` (virtual), `serverStatus.mem.resident`, and `serverStatus.mem.mapped` converted to GB.

### Network
The `NetworkStore` gets data from [the "network" field](https://docs.mongodb.com/manual/reference/command/serverStatus/#serverstatus.network). The Y values are the network usage **_deltas_** from `serverStatus.network.bytesIn` and `serverStatus.network.bytesOut` in KB, i.e. the increase or decrease in network usage since the previous second.

### Operations
The `OpCounterStore` gets data from [the "opcounters" field](https://docs.mongodb.com/manual/reference/command/serverStatus/#opcounters). The Y values are the operation count **_deltas_** from `serverStatus.opCounters.insert` / `query` / `update` / `delete` / `command` / `getmore`. This graph shows the increase or decrease in the number of each operation per second.

### Reads and Writes

The `GlobaLockStore` gets data from [the "globallock" field](https://docs.mongodb.com/manual/reference/command/serverStatus/#server-status-global-lock). The Y values are the current number of operations from `serverStatus.globalLock.activeClients.readers`(active reads) `serverStatus.globalLock.activeClients.writers` (active writes), `serverStatus.globalLock.currentQueue.readers` (queued reads) and `serverStatus.globalLock.currentQueue.writers` (queued writes).

## Hot Collections
The `TopStore` listens to `DataServiceActions.topComplete`, `pause`, `restart`, `mouseOver`, and `mouseOut` actions. When `DataServiceActions.top` is called, [the top command](https://docs.mongodb.com/master/reference/command/top) is called on the DataService and passes the list of hottest (i.e. most used, or **greatest system load**) to the `TopComponent`. The order of the list is calculated to be consistent with how the Cloud team and `mongotop` rank their hot collections.

The `restart` action clears the stored data in each of the chart stores and the `pause` action stops new data from being displayed but continues to collect data.

The `mouseover` action changes the data sent to the `TopComponent` from the current value to match the point in time that is being moused over on the charts. The `mouseOut` action resets the data to the current time.

#### Variables:
Each data point _x_ includes the fields `total`, `readLock`, and `writeLock`.

_x<sub>i</sub>_ = data point at current time

_x<sub>i-1</sub>_ = data point at 1 interval before current time.

_P_ = interval in microseconds. We can calculate interval with _x<sub>i</sub> - x<sub>i-1</sub>_ but we already know what it will be since we are polling once/second.

_N_ = number of cores on the machine. This information is from `buildInfo` and accessed through `app.instance.host.cpu_cores`.

First we need to calculate the deltas for each field of _x_.

_T<sub>delta</sub>_ = _x.total<sub>i</sub>_ - _x.total<sub>i-1</sub>_

_R<sub>delta</sub>_ = _x.readLock<sub>i</sub>_ - _x.readLock<sub>i-1</sub>_

_W<sub>delta</sub>_ = _x.writeLock<sub>i</sub>_ - _x.writeLock<sub>i-1</sub>_

**We can calculate the system load as follows:**

_SYSTEM LOAD_ = (_T<sub>delta</sub>_ * 100) / (_P_* _N_)

## Slow Operations

The `CurrentOpStore` listens to the `DataServiceActions.currentOpComplete`, `pause`, `restart`, `mouseOver` and `mouseOut` actions. When `DataServiceActions.currentOp` is called, [the currentOp command](https://docs.mongodb.com/manual/reference/method/db.currentOp) is called on the DataService and passes the list of active slowest operations to the `CurrentOpComponent`.

The `restart` action clears the stored data in each of the chart stores and the `pause` action stops new data from being displayed but continues to collect data.

The `mouseover` action changes the data sent to the `CurrentOpComponent` from the current value to match the point in time that is being moused over on the charts. The `mouseOut` action resets the data to the current time.

## DB Errors

If any of `ServerStatsGraphsStore`, `TopStore`, or `CurrentOpStore` receive an error from the DataService, they will trigger the `dbError` action. The `DBErrorStore` listens for errors and passes any new errors to the `DBErrorComponent` which will display a red banner with an interpretation of the error received. The raw errors are transformed from MongoErrors to more human-readable and helpful error messages with [mongodb-js-errors.translate](https://github.com/mongodb-js/errors/blob/master/index.js). If an error goes away, i.e. dbError is triggered and the error is now null, then the banner will be removed. If the d3 charts receive data with a non-null error they will not draw the charts and instead display "DATA UNAVAILABLE".


| Key                           | Description                                  |
|-------------------------------|----------------------------------------------|
| `Performance.PerformanceView` | Renders the complete server stats component. |
