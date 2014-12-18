'use strict';

// Camera specific endpoints
var ENDPOINT = {
	// Camera
	API_CAMERA_GET_PROPERTIES: 'dropcams.get_properties',
	API_CAMERA_SET_PROPERTIES: 'dropcams.set_properties',
	API_CAMERA_UPDATE: 'cameras.update',
	// Camera Schedules
	API_CAMERA_SCHEDULES_GEOFENCING: 'camera_schedules.set_geofencing_enabled',
	// Notifications
	API_NOTIFICATIONS_FIND_BY_CAMERA: 'camera_notifications.find_by_camera',
	// Android register/deregister
	API_NOTIFICATION_TARGETS_ANDROID_REGISTER: 'notification_targets.register_android_device',
	API_NOTIFICATION_TARGETS_ANDROID_DEREGISTER: 'notification_targets.deregister_android_device',
	// Subscriptions
	API_SUBSCRIPTIONS_LIST: 'subscriptions.list', 
	// Clips
	API_VIDEOS_GET: 'videos.get_owned'
};

var EventEmitter = require('events').EventEmitter,
	util = require('util'),
	inherits = require('inherits'),
	async = require('async'),
	Screenshot = require('./screenshot'), 
	Subscription = require('./subscription'),
	Device = require('./device'),
	Clip = require('./clip'), 
	Event = require('./event'),
	http = require('./http');

function Camera(user, properties, settings) {
	this.user = user;
	this.properties = properties;
	this.settings = settings;

	Object.defineProperty(this, "user", {
  		enumerable: true,
  		configurable: false,
  		writable: false,
  		value: this.user
	});

	Object.defineProperty(this, "properties", {
  		enumerable: true,
  		configurable: false,
  		writable: false,
  		value: this.properties
	});

	Object.defineProperty(this, "settings", {
  		enumerable: true,
  		configurable: false,
  		writable: true,
  		value: this.settings
	});
};

inherits(Camera, EventEmitter); 

// Listens for incoming events
Camera.prototype.listen = function(timeout) {
	var exec = function(done) {
		http.get({ nexus: true, url: util.format('get_cuepoint?uuid=%s&human=false', this.properties['uuid']), 
			headers: { 'Cookie': new String(this.user.session.cookies[0]).split('; ')[0] } }, // Nexus API seems to be specific on which cookies it wants
			function(err, data) {
				if(err) 
					return done(err);
				else if(data.length > lastCount && lastCount !== 0) {
					var e = data[data.length - 1], evt = new Event(e); // always get last entry
					this.emit(evt.type, evt); 
				}
				lastCount = data.length;
				// Delay for about a second
				setTimeout(function() {
					done(null);
				}, (timeout || 1000));
			}.bind(this)
		);
	}.bind(this), lastCount = 0;
	async.forever(exec, function(err) {
		this.emit('error', err);
	}.bind(this));
};

// Sets the visibility of this camera - public/private
Camera.prototype.toggle = function(visible, callback) {
	if(typeof visible === 'string') visible = visible === 'public' ? true : false;

	http.get({ url: util.format('%s?uuid=%s&is_public=%s', ENDPOINT.API_CAMERA_UPDATE, this.properties['uuid'], new String(visible)), 
		headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				// Update the field
				this.properties['is_public'] = data['is_public'];
				return callback(null, (visible ? 'public' : 'private'));
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to access visibility settings for this camera';
				return callback(new Error(err || 'Failed to toggle visibility'), null);
			}
		}.bind(this)
	);
};

// Updates a setting within this camera
// Returns a true/false depending on success
Camera.prototype.update = function(pair, callback) {
	var key = pair.key, value = pair.value;

	http.get({ url: util.format('%s?uuid=%s&%s=%s', ENDPOINT.API_CAMERA_SET_PROPERTIES, this.properties['uuid'], key, new String(value)),  
		headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, false);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				// Check the actual key exists
				if(!(key in this.settings)) 
					return callback(new Error(util.format('%s does not exist or is invalid', key)), false);
				this.settings = data.items[0]; // update local settings
				return callback(null, true); // Switch to true since we know the key exists
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to access settings for this camera';
				return callback(new Error(err || 'Failed to update camera settings'), false);
			}
		}.bind(this)
	);
}; 

// Searchs a collection
Camera.prototype.search = function(collection, params, callback) {
	if(collection === 'clips') 
		return Clip.search(params, this.properties['uuid'], this.user.session, callback);
	else 
		return callback(new Error('Unknown collection: %s', collection), null);
};

// Captures a screenshot
Camera.prototype.capture = function(callback, width) {
	http.get({ nexus: true, url: util.format('get_image?uuid=%s&width=%s', this.properties['uuid'], (width || 600)), 
		headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
		function(err, data) {
			return err ? callback(err, null) : callback(null, new Screenshot(data.buffer, data.type));
		}
	);
};

// Records a live stream to local (records in seconds)
Camera.prototype.record = function(seconds, callback) {
	// This is assuming every camera has a uuid and a live streaming server. 
	return callback(new Error('Function has been disabled temporarily'), null);
};

// TODO
Camera.prototype.talkback = function(stream) {
	// TODO: Pipe a live recording to Dropcam's servers
	return callback(new Error('Not implemented'), null);
};

// Returns all devices with notifications enabled
Camera.prototype.getNotificationDevices = function(callback) {
	http.get({ url: util.format('%s?uuid=%s', ENDPOINT.API_NOTIFICATIONS_FIND_BY_CAMERA, this.properties['uuid']),
		headers: { 'Cookie' : this.user.session.cookies.join(',') } },
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, Device.Create(this, data.items));
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to access devices for this camera';
				return callback(new Error(err || 'Failed to retrieve devices with notifications'), null);
			}
		}.bind(this)
	);
};

// Returns all subscriptions associated with this camera
Camera.prototype.getSubscriptions = function(callback) {
	http.get({ url: util.format('%s?camera_uuid=%s', ENDPOINT.API_SUBSCRIPTIONS_LIST, this.properties['uuid']),
		headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);	
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, data.items); //Subscription.build(data.items) 
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to access subscriptions for this camera';
				return callback(new Error(err || 'Failed to get subscriptions'), null);
			}
		}
	);
};

// Returns all video clips associated with this camera
Camera.prototype.getClips = function(callback) {
	http.get({ url: util.format('%s?uuid=%s', ENDPOINT.API_VIDEOS_GET, this.properties['uuid']), 
		headers: { 'Cookie' : this.user.session.cookies.join(',') } },
		function(err, data) {
			if(err)
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, Clip.Create(this, data.items));
			else
				return callback(new Error(data['status_detail'] || 'Failed to get clips'), null);
		}.bind(this)
	);
};

// Creates a new camera
Camera.Create = function(user, properties, callback) {
	http.get({ url: util.format('%s?uuid=%s', ENDPOINT.API_CAMERA_GET_PROPERTIES, properties['uuid']), 
		headers: { 'Cookie': user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, new Camera(user, properties, data.items[0]));
			else 
				return callback(new Error(data['status_detail'] || 'Failed to create camera'), null);
		}
	);
};

module.exports = Camera;
