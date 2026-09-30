# ais-track

**ais-track** is a
[Signal K](https://www.signalk.org/)
plugin which creates a track from AIS position reports received over
a UDP connection.

The plugin was written to automatically maintain daily cruising tracks
for the host vessel by exploiting the data management facilities
offered by
[ais-reporter](https://github.com/pdjr-signalk-plugins/ais-reporter).

## Working principle

The plugin listens on a specified UDP port for incoming AIS position
reports.
When position reports start to be received they are concatenated into
a Signal K track resource named `YYYYMMDD:hhmm` (which reflects the
start time of the track).
When the position report stream dries up for a configured interval the
resource is closed and the plugin returns to listening,

## Generating AIS position data

AIS position reports can come from anywhere, but it is convenient to
use the `ais-reporter` plugin as a data source by including an endpoint
in its configuration which pushes data to `ais-track`.
The following non-trivial endpoint is configured to only push AIS data
when the host vessel's main engine is operating (as reported by
`updateIntervalIndexPath`).
See the `ais-reporter` documentation for more information.

```json
...
{
  "name": "ais-track",
  "ipAddress": "127.0.0.1",
  "port": 12346,
  "positionReportInterval": 0,
  "staticReportInterval": 0,
  "myPositionReportInterval": [0,5],
  "myStaticReportInterval": 0,
  "updateIntervalIndexPath": "electrical.switches.bank.16.16.state"
}
...
```

## Plugin configuration

To operate at all the plugin's JSON configuration file
`~/.signalk/plugin-configuration-data/ais-reporter.json`
must be initialised using either Signal K's plugin configuration GUI
or a text editor.

Some features of the configuration file are poorly supported by Signal
K's plugin configuration GUI and the following discussion assumes that
a text editor is being used to directly edit the JSON configuration.

### A minimal configuration

The plugin includes built-in defaults for most configuration properties
so a minimal working configuration requires a *listeners* array
containing at least one listener endpoint specified in terms of its
service *port* (with maybe an optional descriptive *name*).

```json
{  
  "configuration": {  
    "listeners": [  
      { 
        "name": "Simple track",   
        "port": 12346  
      }  
    ]  
  },  
  "enabled": true  
}
```

## Plugin API

The plugin presents an API on `/plugins/ais-track/status` which
returns some data on resources consumed by each listener.

```json
{
  "Simple track": {
    "port": 12346,
    "status": "running",
    "resource": "20260911:1604",
    "positionCount": 382
  }
}
```

## Author

Paul Reeve <*preeve_at_pdjr_dot_eu*>
