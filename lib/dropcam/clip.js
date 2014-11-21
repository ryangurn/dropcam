'use strict';

var ENDPOINT = {
	API_VIDEOS_UPDATE: 'videos.update',
	API_VIDEOS_DELETE: 'videos.delete',
	API_VIDEOS_REQUEST: 'videos.request', // TODO: Fix 
	API_VIDEOS_FACEBOOK: 'videos.facebook' // TODO: Implement
}

var http = require('./http'), util = require('util');

function Clip(camera, properties) {
	this.camera = camera;
	this.properties = properties;

	Object.defineProperty(this, 'properties', {
		enumerable: true,
		writable: false,
		value: this.properties
	});
}

// Update specific properties (only works with `description` and `title`)
Clip.prototype.update = function(pair, callback) {
	var key = pair.key, value = pair.value;

	http.get({ url: util.format('%s?camera_uuid=%s&id=%s&%s=%s', ENDPOINT.API_VIDEOS_UPDATE, this.camera.properties['uuid'], 
		this.properties.id, key, value),
		headers: { 'Cookie' : this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, false);	
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				if(!(key in this.properties)) 
					return callback(new Error(util.format('%s does not exist or is invalid', key)), false);

				var items = data['items'];
				var result = false;
				items.forEach(function(item) {
					if(item['id'] === this.properties.id && item[key] !== this.properties[key]) {
						this.properties[key] = value;
						result = true;
					}
				}.bind(this));
				return callback(null, result);
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to access settings for this clip';
				return callback(new Error(err || 'Failed to update clip settings'), false);
			}
		}.bind(this)
	);
};

// Downloads this clip
Clip.prototype.download = function(callback) {
	var streamify = require('stream-array');
	http.get({ override: true, url: util.format('https://%s/%s', this.properties.server, this.properties.filename), 
		headers: { 'Cookie' : this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {
			return err ? callback(err, null) : callback(null, { filename: this.properties.filename, stream: streamify(data.buffer), 
				type: data.type })
		}.bind(this)
	);
};

// Deletes this clip
Clip.prototype.delete = function(callback) {
	http.get({ url: util.format('%s?camera_uuid=%s&id=%s', ENDPOINT.API_VIDEOS_DELETE, this.camera.properties['uuid'], this.properties.id), 
		headers: { 'Cookie' : this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err)
				return callback(err, false);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				this.properties = undefined;
				this.camera = undefined;
				return callback(null, true);
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to delete clip';
				return callback(new Error(err || 'Unable to delete clip'), false);	
			}
 		}.bind(this)
	);
};

// Find a specific clip (params = start_date (unix timestamp) and length (float))
// This doesn't work as expected - TODO: Figure out why
Clip.Search = function(params, camera, callback) {
	http.get({ url: util.format('%s?uuid=%s&start_date=%s&length=%s', ENDPOINT.API_VIDEOS_REQUEST, camera.properties['uuid'], 
		params.start_date, params.length),
		headers: { 'Cookie': camera.user.session.cookies.join(',') } },
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				return callback(new Error('Function not fully implemented'), null);
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to find clip';
				return callback(new Error(err || 'Unable to find clip'), false);	
			}

		}
	);
};

// Build a list of items into fully usable clips
Clip.Create = function(camera, items) {
	var clips = [];
	items.every(function(item) {
		clips.push(new Clip(camera, item));
	});
	return clips;
};

module.exports = Clip;