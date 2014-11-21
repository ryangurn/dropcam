'use strict';

var ENDPOINT = {
	API_SUBSCRIPTIONS_DELETE: 'subscriptions.delete', // camera_uuid
	API_SUBSCRIPTIONS_BLOCK: 'subscriptions.block', 
	API_SUBSCRIPTIONS_UNBLOCK: 'subscriptions.unblock',
	API_SUBSCRIPTIONS_RESEND_INVITE: 'subscriptions.resend_invite',
	API_SUBSCRIPTIONS_CREATE_PUBLIC: 'subscriptions.create_public' // camera_uuid
};

var http = require('./http'), util = require('util');

function Subscription(camera, properties) {
	this.camera = camera;
	this.properties = properties;
}

// Not sure what this does yet
Subscription.prototype.createPublic = function(callback) {
	http.get({ url: util.format('%s?camera_uuid=%s', ENDPOINT.API_SUBSCRIPTIONS_CREATE_PUBLIC, this.camera.properties['uuid']), 
		headers: { 'Cookie': this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err)
				return callback(err, false);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				return callback(null, true);
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to create public subsciption';
				return callback(new Error(err || 'Failed to create public subsciption'), false);
			}
		}
	);
};

// Deletes a subscription
Subscription.prototype.delete = function(callback) {
	http.get({ url: ENDPOINT.API_SUBSCRIPTIONS_DELETE, headers: { 'Cookie': this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err)
				return callback(err, false);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				return callback(null, true);
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to create public subsciption';
				return callback(new Error(err || 'Failed to create public subsciption'), false);
			}
		}
	);
};

Subscription.prototype.block = function(callback) {
	http.get({ url: ENDPOINT.API_SUBSCRIPTIONS_BLOCK, headers: { 'Cookie': this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {

		}
	);
};

Subscription.prototype.unblock = function(callback) {
	http.get({ url: ENDPOINT.API_SUBSCRIPTIONS_UNBLOCK, headers: { 'Cookie': this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {

		}
	);
};

//
Subscription.prototype.resend = function(callback) {
	http.get({ url: ENDPOINT.API_SUBSCRIPTIONS_RESEND_INVITE, headers: { 'Cookie': this.camera.user.session.cookies.join(',') } }, 
		function(err, data) {
			if(err)
				return callback(err, false);
			else if(data['status'] === 0 && data['status_description'] === 'ok') {
				return callback(null, true);
			}
			else {
				var err = data['status_detail'];
				if(err === 'None') // Lets turn it into a more readable err
					err = 'Unable to create public subsciption';
				return callback(new Error(err || 'Failed to create public subsciption'), false);
			}
		}
	);
};

// Build a list of items
Subscription.build = function(uuid, items, session) {
	var subscriptions = [];
	items.every(function(item) {
		subscriptions.push(new Subscription(uuid, item, session));
	}.bind(this));
	return subscriptions;
};

module.exports = Subscription;