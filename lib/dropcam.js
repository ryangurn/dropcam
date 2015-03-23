'use strict';

// General endpoints
var ENDPOINT = {
	API_LOGIN: 'login.login',
	API_VISIBLE_CAMERAS: 'cameras.get_visible',
	API_CAMERA_BY_PUBLIC_TOKEN: 'cameras.get_by_public_token',
	API_DROPCAM_DEMOS: 'cameras.get_demo'
};

var async = require('async'), util = require('util');

var User = require('./dropcam/user'),
	Session = require('./dropcam/session'),
	Camera = require('./dropcam/camera'),
	Device = require('./dropcam/device'),
	http = require('./dropcam/http');

// Short hand function to build an array of cameras asynchronously
function createCameras(user, items, callback) {
	var cameras = [];

	async.each(items, 
		function(item, _callback) {
			Camera.Create(user, item, function(err, camera) {
				if(err) throw err;
				cameras.push(camera);
				_callback(null, cameras);
			}); 
		}, 
		function(err, results) {
			return err ? callback(err, null) : callback(null, cameras);
		}
	);
};

// Performs a login to the API
// Returns a user object containing a valid session if successful
exports.login = function(username, password, callback) { // TODO: Figure out `client` param
	var form = util.format('username=%s&password=%s', username, password);
	http.post({ url: util.format('%s', ENDPOINT.API_LOGIN),
   		form: form,
   		headers: { 'Content-Type': 'application/x-www-form-urlencoded',
	   				'Content-Length': form.length } },	
		function(err, data, cookies) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				var session = new Session(cookies, data.items[0].session_token);
				User.Create(session, function(err, user) {
					return err ? callback(err, null) : callback(null, user);
				});
			}
			else 
				return callback(new Error(data['status_detail'] || 'Failed to login'), null);
		}
	);
};

// Searches this API for camera by public token id
exports.search = function(user, public_token, callback) {
	http.get({ url: util.format('%s?token=%s', ENDPOINT.API_CAMERA_BY_PUBLIC_TOKEN, public_token), 
		headers: { 'Cookie' : user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				Camera.Create(user, data.items[0], 
					function(err, camera) {
						return err ? callback(err, null) : callback(null, camera);

					}
				);
			}
			else 
				return callback(new Error(data['status_detail'] || 'Failed to search'), null);			
		}
	)
};

// Returns demos available from the dropcam source
exports.getDemos = function(user, callback) {
	http.get({ url: ENDPOINT.API_DROPCAM_DEMOS, headers: { 'Cookie' : user.session.cookies.join(',') } },
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return createCameras(user, data.items, callback);
			else 
				return callback(new Error(data['status_detail'] || 'Failed to get demos'), null);
		}
	);
};

// Returns all visible cameras associated to the user
exports.getVisibleCameras = function(user, callback) {
	http.get({ url: ENDPOINT.API_VISIBLE_CAMERAS, headers: { 'Cookie' : user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return createCameras(user, data.items, callback);
			else 
				return callback(new Error(data['status_detail'] || 'Unable to fetch cameras'), null);
		}
	);
};

exports.Device = Device;
exports.User = User;
