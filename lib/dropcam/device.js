'use strict';

var ENDPOINT = {
	API_NOTIFICATIONS_UPDATE: 'camera_notifications.update'
};

var http = require('./http');

function toggle(enabled, camera, properties, callback) {
	var util = require('util');
	http.get({ url: util.format('%s?uuid=%s&type=%s&value=%s&is_enabled=%s', ENDPOINT.API_NOTIFICATIONS_UPDATE, 
		camera.properties['uuid'], properties['type'], properties['value'], new String(enabled)), 
		headers: { 'Cookie': camera.user.session.cookies.join(',') } },
		function(err, data) {
			if(err)
				return callback(err, false);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, true);
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to access device notification settings';
				return callback(new Error(err || 'Failed to update device notification settings'), false);
			}
		}
	);	
}

function Device(camera, properties) {
	this.camera = camera; 
	this.properties = properties;

	Object.defineProperty(this, 'properties', {
		enumerable: true,
		writable: false,
		value: this.properties
	});
}

Device.prototype.enable = function(callback) {
	return toggle(true, this.camera, this.properties, callback);
};

// Disable this device from receiving notifications
Device.prototype.disable = function(callback) {
	return toggle(false, this.camera, this.properties, callback);
};

// Builds an array of devices or device
Device.Create = function(camera, devices) {
	if(Array.isArray(devices)) {
		var _devices = [];
		devices.forEach(function(device) {
			_devices.push(new Device(camera, device.target));
		});
		return _devices;
	}
	else
		return new Device(camera, devices);
};

module.exports = Device;