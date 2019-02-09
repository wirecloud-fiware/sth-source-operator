/*
 * Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* globals MashupPlatform */

(function (mp) {

    "use strict";


    // =========================================================================
    // PUBLIC
    // =========================================================================

    var STHSource = function STHSource() {
        mp.wiring.registerCallback("entity", function (entity) {
            requestData(entity);
        });

        requestData();
    };

    // =========================================================================
    // PRIVATE
    // =========================================================================

    var HLIMIT = 10 /* days */ * 24 /* hours */ * 60 /* mins */ * 60 /* seconds */;
    var entity_type = mp.prefs.get('entity_type');
    var entity = mp.prefs.get('entity');

    var requestData = function requestData() {

        var server = new URL(mp.prefs.get('sth_server'));
        if (server.pathname[server.pathname.length - 1] !== "/") {
            server.pathname += "/";
        }
        var request_headers = {};

        var tenant = mp.prefs.get('ngsi_tenant').trim().toLowerCase();
        if (tenant !== '') {
            request_headers['FIWARE-Service'] = tenant;
        }

        var path = mp.prefs.get('ngsi_service_path').trim().toLowerCase();
        if (path !== '') {
            request_headers['FIWARE-ServicePath'] = path;
        }

        var today = new Date();
        var from = new Date(today - (10 /* days */ * 24 /* hours */ * 60 /* mins */ * 60 /* segs */ * 1000 /* miliseconds */));
        // var to = today;
        var attribute = mp.prefs.get('attribute');

        var url = new URL('v1/contextEntities/type/' + entity_type + '/id/' + entity + '/attributes/' + attribute, server);

        mp.http.makeRequest(url, {
            method: "GET",
            requestHeaders: request_headers,
            parameters: {
                lastN: HLIMIT,
                dateFrom: from.toISOString()/* ,
                dateTo: to.toISOString()*/
            },
            onSuccess: function (response) {
                if (response.status !== 200) {
                    throw new Error('Unexpected response from STH');
                }

                var data = JSON.parse(response.responseText).contextResponses[0].contextElement.attributes[0].values;
                mp.wiring.pushEvent("values", data.map(function (entry) {return Number(entry.attrValue);}));
                mp.wiring.pushEvent("timestamps", data.map(function (entry) {return (new Date(entry.recvTime)).getTime();}));
            },
            onFailure: function (response) {
                throw new Error('Unexpected response from STH');
            },
            onException: function (reason) {
                mp.operator.log(reason);
            }
        });
    };

    new STHSource();

})(MashupPlatform);
