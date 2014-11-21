'use strict';

var spawn = require('child_process').spawn;

function createStream(options) {
	var args = [];
	Object.keys(options).forEach(function(key) {
    	if(key.length === 1) args.push('-' + key);
    	else args.push('--' + key);
    	if(options[key]) args.push(options[key]);
  	});
  	return spawn('rtmpdump', args);
}

function Stream(uuid, host, token) {
	this.uuid = uuid;
	this.host = host;
	this.token = token;
	this.events = {};
	this.stream = null;
};

// Ugly, should considering re-writing
// TODO: Connect to RTMPS - Figure out required params
Stream.prototype.start = function(seconds, callback) {
	if(seconds < 0) callback(new Error('You must define a correct number of seconds'), null);

	var options = {
		rtmp: this.host + '/' + this.uuid,
		live: null,
		conn: 'S:' + this.token,
	};

	if(seconds > 0) options['stop'] = seconds;

	this.stream = createStream(options);
	this.stream.on('error', function(error) {
		if(this.events['error'])
			this.events['error'](error);
	}.bind(this));
	this.stream.stderr.on('data', function(data) {
		if(this.events['data'])
			this.events['data'](data.toString());
	}.bind(this));

	callback(null, this);
};

Stream.prototype.pipe = function(to) {
	this.stream.stdout.pipe(to);
};

Stream.prototype.on = function(event, callback) {
	this.events[event] = callback;
};

module.exports = Stream;