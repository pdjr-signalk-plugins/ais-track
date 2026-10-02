"use strict";
/**
 * Copyright 2024-2026 Paul Reeve <preeve@pdjr.eu>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Listener_1 = require("./Listener");
const signalk_libpluginstatus_1 = require("signalk-libpluginstatus");
const DEFAULT_MY_AIS_CLASS = 'B';
const DEFAULT_LISTENER_OPTIONS = { resetInterval: 30, positionAccuracy: 5 };
const PLUGIN_ID = 'ais-track';
const PLUGIN_NAME = 'ais-track';
const PLUGIN_DESCRIPTION = 'Generate tracks from AIS data.';
const PLUGIN_SCHEMA = {
    "type": "object",
    "required": ["listeners"],
    "properties": {
        "resetInterval": {
            "title": "Number of minutes silence after which the current track will be closed",
            "type": "integer",
            "minimum": 0
        },
        "resetRepeat": {
            "title": "Number of identical, consecutive, positions that should trigger closure of a track",
            "type": "integer",
            "minimum": 2
        },
        "positionAccuracy": {
            "title": "Trim all latitude and longitude values to this number of decimal places",
            "type": "integer",
            "minimum": 0
        },
        "postUrl": {
            "title": "URL of a reource manager to which completed tracks should be POSTed",
            "type": "string"
        },
        "accessToken": {
            "title": "Access token that may be required by the reource manager",
            "type": "string"
        },
        "listeners": {
            "type": "array",
            "title": "UDP port listeners",
            "items": {
                "type": "object",
                "required": ["port"],
                "properties": {
                    "name": {
                        "title": "Listener name",
                        "type": "string"
                    },
                    "port": {
                        "title": "Endpoint port number",
                        "type": "number",
                        "minimum": 0
                    },
                    "resetRepeat": {
                        "title": "Number of identical, consecutive, positions that should trigger closure of a track",
                        "type": "integer",
                        "minimum": 2
                    },
                    "resetInterval": {
                        "title": "Number of minutes silence after which the current track will be closed",
                        "type": "integer",
                        "minimum": 0
                    },
                    "positionAccuracy": {
                        "title": "Trim all latitude and longitude values to this number of decimal places",
                        "type": "integer",
                        "minimum": 0
                    },
                    "postUrl": {
                        "title": "URL for PUTting finished tracks",
                        "type": "string"
                    },
                    "accessToken": {
                        "title": "Access token that may be required by the reource manager",
                        "type": "string"
                    }
                }
            }
        }
    }
};
const PLUGIN_UISCHEMA = {};
module.exports = function (app) {
    var pluginConfiguration;
    var pluginStatus;
    const plugin = {
        id: PLUGIN_ID,
        name: PLUGIN_NAME,
        description: PLUGIN_DESCRIPTION,
        schema: PLUGIN_SCHEMA,
        uiSchema: PLUGIN_UISCHEMA,
        start: function (options) {
            pluginStatus = new signalk_libpluginstatus_1.PluginStatus(app, 'started');
            try {
                pluginConfiguration = makePluginConfiguration(options, DEFAULT_LISTENER_OPTIONS);
                if (pluginConfiguration.listeners.length > 0) {
                    pluginStatus.setDefaultStatus(`Generating tracks from ${pluginConfiguration.listeners.length} endpoint${(pluginConfiguration.listeners.length == 1) ? '' : 's'} (${pluginConfiguration.listeners.map((e) => ('\'' + e.getPort() + '\'')).join(', ')})`);
                    startListening(pluginConfiguration);
                }
                else {
                    pluginStatus.setDefaultStatus('Stopped: no configured listeners');
                }
            }
            catch (e) {
                pluginStatus.setDefaultStatus('Stopped: error');
                app.debug(e.message);
            }
        },
        stop: function () {
            stopListening(pluginConfiguration);
        },
        registerWithRouter: function (router) {
            router.get('/status', handleRoutes);
        },
        getOpenApi: function () {
            return (require('./openApi.json'));
        }
    };
    /**
     * Create a canonical plugin configuration from the user-supplied
     * JSON configuration. Global and default properties are consolidated
     * so that all properties reside within endpoint object definitions.
     *
     * Fatal errors cause an exception.
     *
     * @param options - contenf of JSON configuration file.
     * @returns - a canonical PluginConfiguration.
     */
    function makePluginConfiguration(options, defaults) {
        var retval = {
            listeners: options.listeners.map((option) => new Listener_1.Listener([option, options, defaults], app))
        };
        return (retval);
    }
    /**
     * Creates a timer and associated calback function which is executed
     * once per minute and manages the entire reporting process by
     * raising position and static reports for all endpoints at the
     * intervals specified in pluginConfiguration and recording resources
     * consumed by the activity of each endpoint.
     *
     * @param pluginConfiguration - a canonical PluginConfiguration.
     * @param udpSocket - open Socket to be used for reporting over UDP.
     * @returns - NodeJS.timeout handle of the timer control.
     */
    function startListening(pluginConfiguration) {
        pluginConfiguration.listeners.forEach(listener => listener.startListening());
    }
    function stopListening(pluginConfiguration) {
        pluginConfiguration.listeners.forEach(listener => listener.stopListening());
    }
    function handleRoutes(req, res) {
        app.debug(`handleRoutes(${req.method}, ${req.path})...`);
        try {
            switch (req.path.slice(0, (req.path.indexOf('/', 1) == -1) ? undefined : req.path.indexOf('/', 1))) {
                case '/status':
                    /*const status = (pluginConfiguration.endpoints || []).reduce((a: Dictionary<StatusResponse>, endpoint: Endpoint) => {
                      let hours: number = (endpoint.statistics.started)?(Date.now() - endpoint.statistics.started) / 3600000:1;
                      a[endpoint.name] = {
                        ipAddress: endpoint.ipAddress,
                        port: endpoint.port,
                        started: (endpoint.statistics.started)?(new Date(endpoint.statistics.started)).toISOString():'never',
                        totalBytesTransmitted: endpoint.statistics.totalBytes,
                        positionSelfBytesPerHour: Math.floor(endpoint.statistics.position.self.bytes / hours),
                        positionOthersBytesPerHour: Math.floor(endpoint.statistics.position.others.bytes / hours),
                        staticSelfBytesPerHour: Math.floor(endpoint.statistics.static.self.bytes / hours),
                        staticOthersBytesPerHour: Math.floor(endpoint.statistics.static.others.bytes / hours)
                      };
                      return(a);
                    }, {});
                    expressSend(res, 200, status, req.path);*/
                    break;
                default:
                    break;
            }
        }
        catch (e) {
            app.debug(e.message);
            expressSend(res, ((/^\d+$/.test(e.message)) ? parseInt(e.message) : 500), null, req.path);
        }
        function expressSend(res, code, body, debugPrefix = null) {
            app.debug(`expressSend(res, ${code}, ${JSON.stringify(body)}, ${debugPrefix})...`);
            const FETCH_RESPONSES = { "200": null, "201": null, "400": "bad request", "403": "forbidden", "404": "not found", "503": "service unavailable (try again later)", "500": "internal server error" };
            res.status(code).send((body) ? body : ((FETCH_RESPONSES['' + code]) ? FETCH_RESPONSES['' + code] : null));
            return (false);
        }
    }
    return (plugin);
};
