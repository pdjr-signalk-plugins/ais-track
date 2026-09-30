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
const _ = require("lodash");
const Listener_1 = require("./Listener");
const dgram_1 = require("dgram");
const signalk_libpluginstatus_1 = require("signalk-libpluginstatus");
const DEFAULT_MY_AIS_CLASS = 'B';
const DEFAULT_LISTENER_OPTIONS = { RESET_INTERVAL: 30, POSITION_ACCURACY: 5 };
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
        "positionAccuracy": {
            "title": "Trim all latitude and longitude values to this number of decimal places",
            "type": "integer",
            "minimum": 0
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
                    "resetInterval": {
                        "title": "Number of minutes silence after which the current track will be closed",
                        "type": "integer",
                        "minimum": 0
                    },
                    "positionAccuracy": {
                        "title": "Trim all latitude and longitude values to this number of decimal places",
                        "type": "integer",
                        "minimum": 0
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
                app.debug(`using configuration: ${JSON.stringify(pluginConfiguration, null, 2)}`);
                if (pluginConfiguration.listeners.length > 0) {
                    pluginStatus.setDefaultStatus(`Generating tracks from ${pluginConfiguration.listeners.length} endpoint${(pluginConfiguration.listeners.length == 1) ? '' : 's'} (${pluginConfiguration.listeners.map((e) => ('\'' + e.port + '\'')).join(', ')})`);
                    startListening(pluginConfiguration);
                }
                else {
                    pluginStatus.setDefaultStatus('Stopped: no configured listeners');
                }
            }
            catch (e) {
                pluginStatus.setDefaultStatus('Stopped: configuration error');
                app.debug(`${e.lineNumber}: ${e.message}`);
            }
        },
        stop: function () {
            pluginConfiguration.listeners.map((l) => l.udpSocket.close());
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
        app.debug(`makePluginConfiguration(${JSON.stringify(options)})...`);
        var retval = {
            listeners: options.listeners.map((option) => new Listener_1.Listener(option, options, defaults))
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
        app.debug(`startListening(pluginConfiguration)...`);
        pluginConfiguration.listeners.forEach(listener => {
            listener.udpSocket = (0, dgram_1.createSocket)('udp4', (msg, rinfo) => {
            });
        });
        return (setInterval(() => {
            app.debug(`reportMaybe(${heartbeatCount})...`);
            pluginConfiguration.endpoints.forEach((endpoint) => {
                try {
                    var reportStatistics = {};
                    var totalBytes = 0;
                    let mvIDX = ((endpoint.intervals.updateIntervalIndexPath) ? (app.getSelfPath(`${endpoint.intervals.updateIntervalIndexPath}.value`) || 0) : 0);
                    let ovIDX = ((endpoint.intervals.updateIntervalIndexPath) ? (app.getSelfPath(`${endpoint.intervals.updateIntervalIndexPath}.value`) || 0) : 0);
                    let mvPUI = _.get(endpoint.intervals, `myPositionUpdateIntervals[${mvIDX}]`, 0);
                    let mvSUI = _.get(endpoint.intervals, `myStaticUpdateIntervals[${mvIDX}]`, 0);
                    let ovPUI = _.get(endpoint.intervals, `positionUpdateIntervals[${ovIDX}]`, 0);
                    let ovSUI = _.get(endpoint.intervals, `staticUpdateIntervals[${ovIDX}]`, 0);
                    app.debug(`mvIDX = ${mvIDX}, mvPUI = ${mvPUI}, mvSUI = ${mvSUI}`);
                    app.debug(`ovIDX = ${ovIDX}, ovPUI = ${ovPUI}, ovSUI = ${ovSUI}`);
                    if (((mvPUI !== 0) && ((heartbeatCount % mvPUI) === 0)) || ((ovPUI !== 0) && ((heartbeatCount % ovPUI) === 0))) {
                        pluginStatus.setStatus(`sending position report to endpoint '${endpoint.name}'`);
                        reportStatistics = reportPosition(udpSocket, endpoint, (mvPUI === 0) ? false : ((heartbeatCount % mvPUI) === 0), (ovPUI === 0) ? false : ((heartbeatCount % ovPUI) === 0));
                        endpoint.updateStatistics('position', reportStatistics);
                    }
                    ;
                    if (((mvSUI !== 0) && ((heartbeatCount % mvSUI) === 0)) || ((ovSUI !== 0) && ((heartbeatCount % ovSUI) === 0))) {
                        pluginStatus.setStatus(`sending static data report to endpoint '${endpoint.name}'`);
                        reportStatistics = reportStatic(udpSocket, endpoint, (mvSUI === 0) ? false : ((heartbeatCount % mvSUI) === 0), (ovSUI === 0) ? false : ((heartbeatCount % ovSUI) === 0));
                        endpoint.updateStatistics('static', reportStatistics);
                    }
                }
                catch (e) {
                    app.debug(`${e.message}`);
                }
            });
            heartbeatCount++;
        }, heartbeat));
    }
    /**
     * Generate one or more AIS position reports for transmission to a
     * specified endpoint and forward these reports for UDP output.
     *
     * @param socket - Socket to be used for report transmission.
     * @param endpoint - Endpoint to be processed.
     * @param reportSelf - true to report 'self' vessel.
     * @param reportOthers - true to report vessels other than 'self'.
     * @returns - ReportStatistics for the transmission.
     */
    function reportPosition(socket, endpoint, reportSelf, reportOthers) {
        app.debug(`reportPosition(socket, ${endpoint.name}, ${reportSelf}, ${reportOthers})...`);
        var reportStatistics = { self: { reports: 0, bytes: 0 }, others: { reports: 0, bytes: 0 } };
        var aisClass;
        var aisProperties;
        var msg;
        var bytesTransmitted;
        Object.values(app.getPath('vessels'))
            .filter((vessel) => ((reportSelf && (vessel.mmsi == pluginConfiguration.myMMSI)) || (reportOthers && (vessel.mmsi != pluginConfiguration.myMMSI))))
            .filter((vessel) => (reportSelf && (_.get(vessel, 'navigation.position.timestamp', false)) || (reportOthers && (_.get(vessel, 'navigation.position.timestamp', false)))))
            .forEach((vessel) => {
            try {
                aisProperties = { mmsi: vessel.mmsi };
                aisClass = (vessel.mmsi == pluginConfiguration.myMMSI) ? pluginConfiguration.myAisClass : _.get(vessel, 'sensors.ais.class.value', DEFAULT_MY_AIS_CLASS);
                aisProperties['accuracy'] = 0;
                aisProperties['aistype'] = (aisClass == 'A') ? 1 : 18;
                aisProperties['cog'] = radsToDeg(_.get(vessel, 'navigation.courseOverGroundTrue.value', 0));
                aisProperties['hdg'] = _.get(vessel, 'navigation.headingTrue.value', 511);
                aisProperties['lat'] = vessel.navigation.position.value.latitude;
                aisProperties['lon'] = vessel.navigation.position.value.longitude;
                aisProperties['own'] = (pluginConfiguration.myMMSI == vessel.mmsi) ? 1 : 0;
                aisProperties['repeat'] = 3;
                aisProperties['rot'] = _.get(vessel, 'navigation.rateOfTurn.value', 128);
                aisProperties['sog'] = mpsToKn(_.get(vessel, 'navigation.speedOverGround.value', 0));
                aisProperties['smi'] = decodeSMI(_.get(vessel, 'navigation.specialManeuver', 'not available'));
                msg = new AisEncode(aisProperties);
                if ((msg) && (msg.valid)) {
                    bytesTransmitted = sendReportMsg(socket, msg.nmea, endpoint);
                    if ((reportSelf) && (vessel.mmsi == pluginConfiguration.myMMSI)) { // reporting self
                        reportStatistics.self.reports++;
                        reportStatistics.self.bytes += bytesTransmitted;
                    }
                    else {
                        reportStatistics.others.reports++;
                        reportStatistics.others.bytes += bytesTransmitted;
                    }
                }
                else
                    throw new Error('AIS encode failed');
            }
            catch (e) {
                app.debug(`error sending AIS position report for vessel '${vessel.mmsi}' to endpoint '${endpoint.name}' (${e.message})`);
            }
        });
        return (reportStatistics);
    }
    /**
     * Generate one or more AIS static data reports for transmission to a
     * specified endpoint and forward these reports for UDP output.
     *
     * @param socket - Socket to be used for report transmission.
     * @param endpoint - Endpoint to be processed.
     * @param reportSelf - true to report 'self' vessel.
     * @param reportOthers - true to report vessels other than 'self'.
     * @returns - ReportStatistics for the transmission.
     */
    function reportStatic(socket, endpoint, reportSelf = false, reportOthers = false) {
        app.debug(`reportStatic(socket, ${endpoint.name}, ${reportSelf}, ${reportOthers})...`);
        var reportStatistics = { self: { reports: 0, bytes: 0 }, others: { reports: 0, bytes: 0 } };
        var aisClass;
        var aisProperties;
        var msg, msgB;
        var bytesTransmitted;
        Object.values(app.getPath('vessels'))
            .filter((vessel) => ((reportSelf && (vessel.mmsi == pluginConfiguration.myMMSI)) || (reportOthers && (vessel.mmsi != pluginConfiguration.myMMSI))))
            .filter((vessel) => (reportSelf && (_.get(vessel, 'navigation.position.timestamp', false)) || (reportOthers && (_.get(vessel, 'navigation.position.timestamp', false)))))
            .forEach((vessel) => {
            try {
                aisProperties = { mmsi: vessel.mmsi };
                aisClass = (vessel.mmsi == pluginConfiguration.myMMSI) ? pluginConfiguration.myAisClass : _.get(vessel, 'sensors.ais.class.value', DEFAULT_MY_AIS_CLASS);
                aisProperties['callsign'] = '';
                aisProperties['cargo'] = _.get(vessel, 'design.aisShipType.value.id', 0);
                aisProperties['destination'] = _.get(vessel, 'navigation.destination.commonName', '');
                aisProperties['dimA'] = (_.get(vessel, 'sensors.ais.fromBow.value', 0)).toFixed(0);
                aisProperties['dimB'] = (_.get(vessel, 'design.length.value.overall', 0) - _.get(vessel, 'sensors.gps.fromBow.value', 0)).toFixed(0);
                aisProperties['dimC'] = (_.get(vessel, 'design.beam.value', 0) / 2 + _.get(vessel, 'sensors.gps.fromCenter.value', 0)).toFixed(0);
                aisProperties['dimD'] = (_.get(vessel, 'design.beam.value', 0) / 2 - _.get(vessel, 'sensors.gps.fromCenter.value', 0)).toFixed(0);
                aisProperties['draught'] = _.get(vessel, 'design.draft.value.maximum', 0);
                aisProperties['etaDay'] = 0;
                aisProperties['etaHr'] = 0;
                aisProperties['etaMin'] = 0;
                aisProperties['etaMo'] = 0;
                aisProperties['imo'] = '';
                aisProperties['repeat'] = 3;
                aisProperties['shipname'] = _.get(vessel, 'name', '');
                switch (aisClass) {
                    case 'A':
                        aisProperties['aistype'] = 5;
                        msg = new AisEncode(aisProperties);
                        if ((msg) && (msg.valid)) {
                            bytesTransmitted = sendReportMsg(socket, msg.nmea, endpoint);
                            if ((reportSelf) && (vessel.mmsi == pluginConfiguration.myMMSI)) {
                                reportStatistics.self.reports++;
                                reportStatistics.self.bytes += bytesTransmitted;
                            }
                            else {
                                reportStatistics.others.reports++;
                                reportStatistics.others.bytes += bytesTransmitted;
                            }
                        }
                        else
                            throw new Error('AIS encode failed');
                        break;
                    case 'B':
                        aisProperties['aistype'] = 24;
                        aisProperties['part'] = 0;
                        msg = new AisEncode(aisProperties);
                        if ((msg) && (msg.valid)) {
                            aisProperties['part'] = 1;
                            msgB = new AisEncode(aisProperties);
                            if ((msgB) && (msgB.valid)) {
                                bytesTransmitted = sendReportMsg(socket, msg.nmea, endpoint);
                                bytesTransmitted += sendReportMsg(socket, msgB.nmea, endpoint);
                                if ((reportSelf) && (vessel.mmsi == pluginConfiguration.myMMSI)) {
                                    reportStatistics.self.reports++;
                                    reportStatistics.self.bytes += bytesTransmitted;
                                }
                                else {
                                    reportStatistics.others.reports++;
                                    reportStatistics.others.bytes += bytesTransmitted;
                                }
                            }
                            else
                                throw new Error('AIS Part B encode failed');
                        }
                        else
                            throw new Error('AIS Part A encode failed');
                        break;
                    default:
                        break;
                }
            }
            catch (e) {
                app.debug(`error sending AIS static data report for vessel '${vessel.mmsi}' to endpoint '${endpoint.name}' (${e.message})`);
            }
        });
        return (reportStatistics);
    }
    /**
     * Transmits a message string over UDP.
     *
     * Throws an exception on transmission error.
     *
     * @param socket - Socket to be used for report transmission.
     * @param msg - message string to be transmitted.
     * @param endpoint - Endpoint specifying the transmission target.
     * @returns - number of bytes transmitted.
     */
    function sendReportMsg(socket, msg, endpoint) {
        app.debug(`sendReportMsg(socket, ${msg}, ${endpoint.name})...`);
        socket.send(msg + '\n', 0, msg.length + 1, endpoint.port, endpoint.ipAddress, (e) => { });
        return (msg.length + 1);
    }
    function radsToDeg(radians) {
        return (radians * 180 / Math.PI);
    }
    function mpsToKn(mps) {
        return (1.9438444924574 * mps);
    }
    function decodeSMI(label) {
        switch (label) {
            case 'not available': return (0);
            case 'not engaged': return (1);
            case 'engaged': return (2);
            default: return (0);
        }
    }
    function handleRoutes(req, res) {
        app.debug(`handleRoutes(${req.method}, ${req.path})...`);
        try {
            switch (req.path.slice(0, (req.path.indexOf('/', 1) == -1) ? undefined : req.path.indexOf('/', 1))) {
                case '/status':
                    const status = (pluginConfiguration.endpoints || []).reduce((a, endpoint) => {
                        let hours = (endpoint.statistics.started) ? (Date.now() - endpoint.statistics.started) / 3600000 : 1;
                        a[endpoint.name] = {
                            ipAddress: endpoint.ipAddress,
                            port: endpoint.port,
                            started: (endpoint.statistics.started) ? (new Date(endpoint.statistics.started)).toISOString() : 'never',
                            totalBytesTransmitted: endpoint.statistics.totalBytes,
                            positionSelfBytesPerHour: Math.floor(endpoint.statistics.position.self.bytes / hours),
                            positionOthersBytesPerHour: Math.floor(endpoint.statistics.position.others.bytes / hours),
                            staticSelfBytesPerHour: Math.floor(endpoint.statistics.static.self.bytes / hours),
                            staticOthersBytesPerHour: Math.floor(endpoint.statistics.static.others.bytes / hours)
                        };
                        return (a);
                    }, {});
                    expressSend(res, 200, status, req.path);
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
