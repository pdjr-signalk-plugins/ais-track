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

The plugin creates one or more *listener*s each of which is associated
with a specific UDP port on which it will expect to receive a steam of
incoming AIS position reports.

Each listener builds a *current track* from received position reports
by rounding latitude and longitude values to some user-configured
resolution and saving the clean position.
Consecutive identical repeat positions are discarded.

When the position report stream dries up for a configured interval the
current track is closed and sent using an HTTP POST API call to a
specified Signal K compliant resource handler before the plugin returns
to await further possible incoming AIS position reports.
Typically, each track will be saved as a Signal K Route.

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

This minimal configuration relies on built-in, global, defaults to
trim position latitude and longitude to five decimal places and sees an
interruption in the incoming position data steam of 30 minutes as a
signal to save any current track and start a new one.

#### Configuration properties

|-- |-- |
| *listeners* | Required array of *listener* definition objects. |
| *listener.name* | Optional identifier to be used as a Route name for tracks from this listener. |
| *listener.port* | Required number of the UDP port on which the listener should wait. |
| [*listener*.]*postUrl* | Required POST path to a Signal K resource manager that will save completed tracks. |
| [*listener*.]*accessToken* | Optional access token which may be required by the resource manager. |
| [*listener*.]*positionAccuracy* | Optional number specifying the number of decimal places to which
position latitude and longitude must be forced. Defaults to 4. |
| [*listener*.]*resetInterval* | Optional number specifying the number of minutes that can elapse between the arrival of consecutive position reports for the reports to be considered part of the current track. Defaults to 30. |
| [*listener*.]*resetRepeat* | Optional number specifying the number of consecutive, identical, positions that should trigger closure of a track. Defauts to 30. |

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
