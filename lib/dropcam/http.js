'use strict';

var ROUTES = {
	ROOT: 'https://www.dropcam.com',
	NEXUS: 'https://nexusapi.dropcam.com',
	API: '/api' // currently on v1
}, USER_AGENT = 'Dropcam/KitKat'; // THIS MAY OR MAY NOT HAVE EFFECT

function doRequest(method, options, callback) {
	var hyperquest = require('hyperquest'), util = require('util');
	var httpOptions = {};
			
	httpOptions.method = method;

	httpOptions.headers = options.headers || {}; 
	httpOptions.headers['User_Agent'] = USER_AGENT;
	httpOptions.headers['Referer'] = ROUTES.ROOT;

	if(options.override)
		httpOptions.url = options.url;
	else if(options.nexus) 
		httpOptions.url = util.format('%s/%s', ROUTES.NEXUS, options.url);
	else
		httpOptions.url = util.format('%s%s/%s', ROUTES.ROOT, ROUTES.API, options.url);
 
	if(method === 'POST') httpOptions.form = options.form;
		
	var cb = function(err, res) {
		if(res && (res.statusCode === 301 || res.statusCode === 302)) 
			return hyperquest(res.headers.Location, httpOptions, cb);
	};

	var req = hyperquest(httpOptions.url, httpOptions, cb), isPOST = false;
	// Write to the stream if a form exists
	if(httpOptions.form) req.write(httpOptions.form);
	// Handle response
	req.on('response', function(res) {
		var body = '', notJSON = false, cookies = [], buffer = [];
		// Send back if response code is not 200
		if(res && res.statusCode !== 200) callback(new Error(util.format('Response code: %s', res.statusCode)));
		// Set cookie
		if(res.headers['set-cookie']) cookies.push(res.headers['set-cookie']);
		// We should only expect JSON, so check for anything else
		if(res.headers['content-type'].indexOf('application/json') === -1) notJSON = true;
		// Read stream 
		res.on('data', function(chunk) {
			if(notJSON)
				buffer.push(chunk);
			else
				body += chunk.toString();
		});
		// Handle end of stream
		res.on('end', function() {
			if(notJSON) { // We should send back a callback stating the contents if its not standard json
				return callback(null, { buffer: buffer, type: res.headers['content-type'] } , cookies);
			}
			else {
				try {
					// Attempt to parse the body
					return callback(null, JSON.parse(body), cookies);
				} catch(e) {
					return callback(e, null);
				}
			}
		});
	});
	// Handle errors
	req.on('error', function(err) {
		if(err) return callback(err, null);
	});
}

exports.get = function(options, callback) {
	return doRequest('GET', options, callback);
};
		
exports.post = function(options, callback) {
	return doRequest('POST', options, callback);
};
		
exports.delete = function(options, callback) {
	return doRequest('DELETE', options, callback);
};
