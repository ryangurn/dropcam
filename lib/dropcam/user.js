'use strict';

// User specific endpoints
var ENDPOINT = {
	API_CREATE_NEW: 'users.create',
	API_GET_CURRENT: 'users.get_current',
	//API_GET_SESSION_TOKEN: 'users.get_session_token', Endpoint is 404
	API_ADD_EMAIL_NOTIFICATION: 'users.add_email_notification_target',
	API_DELETE_EMAIL_NOTIFICATION: 'users.delete_notification_target',
};

var http = require('./http'), util = require('util'),
	Session = require('./session');

function User(properties, session) {
	this.properties = properties;
	this.session = session;

	Object.defineProperty(this, 'properties', {
		enumerable: true,
		writable: false,
		value: this.properties
	});

	Object.defineProperty(this, "session", {
  		enumerable: true,
  		configurable: false,
  		writable: false,
  		value: this.session
	});
};

// Deprecated function: Will be removed on next release
User.prototype.getSessionToken = function(callback) {
	return callback(null, this.session.token);
};

// Adds a notification email to this user
// Returns an object containing the email and id
User.prototype.addNotificationEmail = function(email, callback) {
	http.get({ url: util.format('%s?email=%s', ENDPOINT.API_ADD_EMAIL_NOTIFICATION, email), 
		headers: { 'Cookie': this.session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, data.items[0]);
			else 
				return callback(new Error(data['status_detail'] || 'Failed to add new notification email'), null);
		}
	);
};

// Removes a notification email from this user by id
// Returns a true/false depending on success
User.prototype.removeNotificationEmail = function(id, callback) {
	http.get({ url: util.format('%s?id=%s', ENDPOINT.API_DELETE_EMAIL_NOTIFICATION, new String(id)), 
		headers: { 'Cookie': this.session.cookies.join(',') } }, 
		function(err, data) {
			if(err)
				return callback(err, false);	
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, true); 	
			else 
				return callback(new Error(data['status_detail'] || 'Failed to delete notification email'), false);
		}
	);
};

// Creates a new user
User.Create = function(session, callback) {
	http.get({ url: ENDPOINT.API_GET_CURRENT, headers: { 'Cookie' : session.cookies.join(',') } }, 
		function(err, data) {
			if(err) 
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') 
				return callback(null, new User(data.items[0], session));
			else 
				return callback(new Error(data['status_detail'] || 'Failed to create a new user'), null);
		}
	);
};

// Registers a new user
User.Register = function(username, password, email, callback) {
	http.get({ url: util.format('%s?username=%s&password=%s&email=%s', ENDPOINT.API_CREATE_NEW, username, password, email) },
		function(err, data) {
			if(err)
				return callback(err, null);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				var session = new Session([], data.items[0].session_token);
				return callback(null, new User(data.items[0], session));
			}
			else
				return callback(new Error(data['status_detail'] || 'Failed to register new user'), null);
		}
	);
};

module.exports = User;
