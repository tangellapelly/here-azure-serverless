/*
 * Copyright (c) 2019 HERE Europe B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * License-Filename: LICENSE
 */

// HERE Serverless Function for HERE Geocoder API

'use strict';

const config = require("../hereLibs/configurations");
const serverlessHandler = require("../hereLibs/serverlessHandler")();
const asyncMiddleware = require("../hereLibs/asyncMiddleware");
const reqProcessor = require("../hereLibs/reqProcessor");
const loggers = require("../hereLibs/logger");
const app = require("express")();
const compression = require("compression");

// HERE credentials App_Code and App_Id
const HERE_AUTH_TYPE = process.env.HERE_AUTH_TYPE;
const HERE_APP_CODE = process.env.HERE_APP_CODE;
const HERE_APP_ID = process.env.HERE_APP_ID;
const HERE_API_KEY = process.env.HERE_API_KEY;

let HERE_GEOCODER_URL = "";
let HERE_REVERSE_GEOCODER_URL = "";

if (  HERE_AUTH_TYPE == "apikey") {
    HERE_GEOCODER_URL = config.authUrls.HERE_GEOCODER_URL;
    HERE_REVERSE_GEOCODER_URL = config.authUrls.HERE_REVERSE_GEOCODER_URL;
}
else { 
    HERE_GEOCODER_URL = config.urls.HERE_GEOCODER_URL;
    HERE_REVERSE_GEOCODER_URL = config.urls.HERE_REVERSE_GEOCODER_URL;
}
let proxyUrl = "";
// Binds the express app to an Azure Function handler
app.use(compression());
module.exports = serverlessHandler(app);

app.all("/api/geocoder/*", asyncMiddleware(async(req, res) => {

    // Find if the call is for geocoder/reverse-geocoder.
    let HERE_API_URL = buildHereApiUrl(req);

    // get logger instance, ( it varies based on selection of express handler.)
    let logger = loggers.getLogger(req);

    // Process Request Object and Prepare Proxy URL using HERE APP Credentials.
    if (  HERE_AUTH_TYPE == "apikey") {
        proxyUrl = reqProcessor.processRequestAuthKey(logger, req, HERE_API_KEY, HERE_API_URL);
    }
    else  { 
        proxyUrl = reqProcessor.processRequestAuthID(logger, req, HERE_APP_CODE, HERE_APP_ID, HERE_API_URL);
    }
    
    // Invoke Proxy URL and fetch Response, GET/POST call is decided based on incoming method.
    let result = await reqProcessor.getAPIResult(logger, req, proxyUrl);

    // Set the Response Object Headers ,StatusCode  and Response Body.
    reqProcessor.sendResponse(logger, req, res, result);

}));

function buildHereApiUrl(req) {
    if (req.url.indexOf("reversegeocode") >= 0) {
        return HERE_REVERSE_GEOCODER_URL;
    } else {
        return HERE_GEOCODER_URL;
    }
}
