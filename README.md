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

The plugin listens on one or more specified UDP ports for incoming
AIS position reports.

For each UDP port listener the plugin builds a track by rounding the
latitude and longitude of each incoming position and if the result
differs from the previously received value concatenating it onto
the developing track.

When the position report stream dries up for a configured interval the
track is closed and sent using an HTTP POST API call to a specified
Signal K compliant resource handler before the plugin returns to
listening for incoming AIS position reports.

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
  "port": 12345,
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
`~/.signalk/plugin-configuration-data/ais-track.json`
must be initialised using either Signal K's plugin configuration GUI
or a text editor.

Some features of the configuration file are poorly supported by Signal
K's plugin configuration GUI and the following discussion assumes that
a text editor is being used to directly edit the JSON configuration.

### A minimal configuration

The plugin includes built-in defaults for most configuration properties
so a minimal working configuration can be as simple as:

```json
{  
  "configuration": {  
    "listeners": [  
      { 
        "port": 12345,
        "postUrl": "http://localhost:3000/signalk/v2/api/resources/routes"
      }  
    ]  
  },  
  "enabled": true,
  "enableDebug": false
}
```

### Default reporting intervals

The minimal configuration described above uses built in, global,
defaults to trim position latitude and longitude to five decimal
places and sees a interruption in the incoming position data steam of
30 minutes as a signal to save any current track and start a new one.

#### Overriding plugin defaults

The default described above can be overriden using the
properties described below.

*positionAccuracy* specifies the number of decimal places to which
position latitude and longitude must be forced.

*resetInterval* specifies the number of minutes that can elapse between
the arrival of consecutive position reports for the reports to be
considered part of the current track.

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
