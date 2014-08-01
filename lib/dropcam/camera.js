module.exports = (function() {
	'use strict';

	// Camera specific endpoints
	var ENDPOINT = {
		// Camera
		API_CAMERA_GET_PROPERTIES: 'dropcams.get_properties',
		API_CAMERA_SET_PROPERTIES: 'dropcams.set_properties',
		API_CAMERA_UPDATE: 'cameras.update',
		API_CAMERA_IMAGE: 'cameras.get_image',
		// Notifications
		API_NOTIFICATIONS_UPDATE: 'camera_notifications.update',
		API_NOTIFICATIONS_FIND_BY_CAMERA: 'camera_notifications.find_by_camera',
		// Subscriptions
		API_SUBSCRIPTIONS_LIST: 'subscriptions.list',
		API_SUBSCRIPTIONS_DELETE: 'subscriptions.delete', // camera_uuid
		API_SUBSCRIPTIONS_BLOCK: 'subscriptions.block', 
		API_SUBSCRIPTIONS_UNBLOCK: 'subscriptions.unblock',
		API_SUBSCRIPTIONS_RESEND_INVITE: 'subscriptions.resend_invite',
		API_SUBSCRIPTIONS_CREATE_PUBLIC: 'subscriptions.create_public', // camera_uuid
		// Clips
		API_VIDEOS_UPDATE: 'videos.update',
		API_VIDEOS_GET: 'videos.get_owned',
		API_VIDEOS_REQUEST: 'videos.request',
		API_VODEOS_DELETE: 'videos.delete',
		API_VIDEOS_FACEBOOK: 'videos.facebook'
	};

	var Screenshot = require('./screenshot'), 
		Stream = require('./stream'), 
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

	// Sets the visibility of this camera - public/private
	Camera.prototype.toggle = function(visible, callback) {
		if(typeof visible === 'string') visible = visible === 'public' ? true : false;

		http.get({ url: ENDPOINT.API_CAMERA_UPDATE + '?uuid=' + this.properties['uuid'] 
			+ '&is_public=' + new String(visible), 
			headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
			function(err, data) {
				if(err) { 
					callback(err, null);
				} 
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					// Update the field
					this.properties['is_public'] = data['is_public'];
					callback(null, (visible ? 'public' : 'private'));
				}
				else {
					var err = data['status_detail'];
					if(err === 'None') // Lets turn it into a more readable err
						err = 'Unable to access visibility settings for this camera';
					callback(new Error(err || 'Failed to toggle visibility'), null);
				}
			}.bind(this)
		);
	};

	// Updates a setting within this camera
	// Returns a true/false depending on success
	Camera.prototype.update = function(keyvalue, callback) {
		var key = keyvalue.key, value = keyvalue.value;

		http.get({ url: ENDPOINT.API_CAMERA_SET_PROPERTIES + '?uuid=' + this.properties['uuid'] 
			+ '&' + key + '=' + new String(value),  
			headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
			function(err, data) {
				var result = false;

				if(err) {
					callback(err, result);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					this.settings = data.items[0]; // update local settings
					// Check the actual key exists
					if(!(key in this.settings)) {
						callback(new Error(key + ' does not exist or is invalid'), result);
					}
					else {
						// Switch to true since we know the key exists
						result = true;
						callback(null, result);
					}
				}
				else {
					var err = data['status_detail'];
					if(err === 'None') // Lets turn it into a more readable err
						err = 'Unable to access settings for this camera';
					callback(new Error(err || 'Failed to update settings'), result);
				}
			}.bind(this)
		);
	}; 

	// Captures a screenshot - Will probably allow for width modification on next update
	Camera.prototype.capture = function(callback) {
		http.get({ url: ENDPOINT.API_CAMERA_IMAGE + '?uuid=' + this.properties['uuid'] + '&width=600', 
			headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
			function(err, data) {
				if(err) { 
					callback(err, null);
				}
				else {
					callback(null, new Screenshot(data.buffer, data.type));
				}
			}
		);
	};

	// Records a live stream to local (records in seconds)
	Camera.prototype.record = function(seconds, callback) {
		// This is assuming every camera has a uuid and a live streaming server. 
		new Stream(this.properties['uuid'], this.properties['download_server_live'], this.user.session.token).start(seconds, callback);
	};

	// Listens for events (motion/sound)
	Camera.prototype.listen = function(event, callback) {
		callback(new Error('Not implemented'), null);
	};

	// Returns all devices with notifications enabled
	Camera.prototype.getDevicesWithNotifications = function(callback) {
		http.get({ url: ENDPOINT.API_NOTIFICATIONS_FIND_BY_CAMERA + '?uuid=' + this.properties['uuid'],
			headers: { 'Cookie' : this.user.session.cookies.join(',') } },
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					callback(null, data.items);
				}
				else {
					var err = data['status_detail'];
					if(err === 'None') // Lets turn it into a more readable err
						err = 'Unable to access devices for this camera';
					callback(new Error(err || 'Failed to retrieve devices with notifications'), null);
				}
			}
		);
	};

	// Creates a new public subscription
	Camera.prototype.createSubscription = function() {
		callback(new Error('Not implemented'), null);
	};

	// Removes subscription
	Camera.prototype.removeSubscription = function() {
		callback(new Error('Not implemented'), null);
	};

	// Returns all subscriptions associated with this camera
	Camera.prototype.getSubscriptions = function(callback) {
		http.get({ url: ENDPOINT.API_SUBSCRIPTIONS_LIST + '?camera_uuid=' + this.properties['uuid'],
			headers: { 'Cookie' : this.user.session.cookies.join(',') } }, 
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					callback(null, data.items);
				}
				else {
					var err = data['status_detail'];
					if(err === 'None') // Lets turn it into a more readable err
						err = 'Unable to access subscriptions for this camera';
					callback(new Error(err || 'Failed to get subscriptions'), null);
				}
			}
		);
	};

	// Returns all video clips associated with this camera
	Camera.prototype.getClips = function(callback) {
		http.get({ url: ENDPOINT.API_VIDEOS_GET + '?uuid=' + this.properties['uuid'],
			headers: { 'Cookie' : this.user.session.cookies.join(',') } },
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					callback(null, data.items);
				}
				else {
					callback(new Error(data['status_detail'] || 'Failed to get clips'), null);
				}
			}
		);
	};

	// Creates a new camera
	Camera.Create = function(user, properties, callback) {
		http.get({ url: ENDPOINT.API_CAMERA_GET_PROPERTIES + '?uuid=' + properties['uuid'], 
			headers: { 'Cookie': user.session.cookies.join(',') } }, 
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					var settings = data.items[0];	
					callback(null, new Camera(user, properties, settings));
				}
				else {
					callback(new Error(data['status_detail'] || 'Failed to create camera'), null);
				}
			}
		);
	};

	return Camera;
})();