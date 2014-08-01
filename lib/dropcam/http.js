module.exports = (function() {
	'use strict';

	var ROUTES = {
		ROOT: 'https://www.dropcam.com',
		NEXUS: 'https://nexusapi.dropcam.com',
		API: '/api' // currently on v1
	}, USER_AGENT = 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0';

	var hyperquest = require('hyperquest');

	function doRequest(method, options, callback) {
		var httpOptions = {};
			
		httpOptions.method = method;

		httpOptions.url = ROUTES.ROOT + ROUTES.API + '/' + options.url;

		httpOptions.headers = options.headers || {}; 
		httpOptions.headers['User_Agent'] = USER_AGENT;
 
		if(method === 'POST') httpOptions.form = options.form;
		
		var cb = function(err, res) {
			if(res && res.statusCode === 301 || res.statusCode === 302) 
				return hyperquest(res.headers.Location, httpOptions, cb);
		};

		var req = hyperquest(httpOptions.url, httpOptions, cb), isPOST = false;
		// Check if form is apart of options
		var isPOST = httpOptions.form ? true : false;
		// Write to the stream if a form exists
		if(isPOST) req.write(httpOptions.form);
		// Handle response
		req.on('response', function(res) {
			var body = '', notJSON = false, cookies = [], buffer = [];
			// Send back if response code is not 200
			if(res && res.statusCode !== 200) callback(new Error(res.statusCode));
			// Set cookie
			if(res.headers['set-cookie']) cookies.push(res.headers['set-cookie']);
			// We should only expect JSON, so check for anything else
			if(res.headers['content-type'] !== 'application/json') notJSON = true;
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
					callback(null, { buffer: buffer, type: res.headers['content-type'] } , cookies);
				}
				else {
					try {
						// Attempt to parse the body
						callback(null, JSON.parse(body), cookies);
					} catch(e) {
						callback(e, null);
					}
				}
			});
		});
		// Handle errors
		req.on('error', function(err) {
			if(err) callback(err, null);
		});
	}

	return {
		get: function(options, callback) {
			doRequest('GET', options, callback);
		},
		post: function(options, callback) {
			doRequest('POST', options, callback);
		},
		delete: function(options, callback) {
			doRequest('DELETE', options, callback);
		}
	};
})();