(function() {
	'use strict';

	var dropcam = require('dropcam');
	var util = require('util');

	var credentials = {
		username: 'YOUR_USERNAME',
		password: 'YOUR_PASSWORD'
	};

	// You must always call the login function before accessing the entire API
	dropcam.login(credentials.username, credentials.password, function(err, user) {
		if(err) console.error(err);

		// Logs out the user's details
		console.log('Username: %s', user.username);
		console.log('ID: %s', user.id);
		console.log('Email: %s', user.email);
		console.log('Timezone: %s', user.timezone);
		
		// Returns the current session token
		user.getSessionToken(function(err, token) {
			if(err) console.error(err);
			console.log(token); // prints out this user's token
		});

		// You could also access it in the user's session 
		// without needing to make an additional API call
		console.log(user.session.token); 

		// Adds a new notification email address to the user
		user.addNotificationEmail('bobthebuilder@gmail.com', function(err, result) {
			if(err) console.error(err);
			console.log(result); // This object holds the id necessary to remove the email

			// Removes a notification email address from the user
			user.removeNotificationEmail(result.id, function(err, deleted) {
				if(err) console.error(err);
				console.log(deleted); // This is either true or false
			}); 
		});
		
		// Searchs the API for a camera associated with the public token
		// Returns the camera associated with the public id
		dropcam.search(user, '4fTZwY', function(err, camera) {
			if(err) console.error(err);
			
			// Entire camera (user, properties and settings)
			console.log(camera);

			// Captures a screenshot of this camera
			camera.capture(function(err, screenshot) {
				screenshot.pipe(require('fs').createWriteStream('pub_cam_snapshot.jpeg'));
			});
		});
	
		// Returns an array of demo cameras
		// You can use them as you would any other camera
		dropcam.getDemos(user, function(err, cameras) {
			if(err) console.error(err);
			console.log(cameras);
		}); 
		
		// Query for visible cameras associated with this user
		dropcam.getVisibleCameras(user, function(err, cameras) {
			if(err) console.error(err);
			
			console.log('My Cameras: ' + util.inspect(cameras));

			// Pick the first camera
			var camera = cameras[0]; 
			
			// View camera settings
			console.log('Settings for Camera #1: ' + util.inspect(camera.settings));
			
			// Toggles the camera's visibility (public/private)
			camera.toggle('private', function(err, result) { // DONE
				if(err) console.error(err);
				console.log('Camera is now: ' + result); // returns public or private
			});
			
			// Updates a camera setting for this camera (such as disabling audio)
			camera.update({ key: 'audio.enabled', value: true }, function(err, result) { // DONE
				if(err) console.error(err);
				console.log(result); // This is either true or false, depending on success
			});
			
			// Takes a screenshot 
			camera.capture(function(err, screenshot) { // DONE
				if(err) console.error(err);
				// You can also get the image type. It's usually a jpeg
				console.log(screenshot.type);
				// Writes the screenshot to file
				screenshot.pipe(require('fs').createWriteStream('screenshot.jpeg'));
			});
			
			// Record your camera locally (in seconds)
			// This example shows to record for 10 seconds
			camera.record(10, function(err, stream) { // 0 means don't stop recording
				if(err) throw err;
				// Listen for events
				stream.on('data', function(data) {
					console.log(data);
				});
				stream.on('error', function(error) {
					console.log(error);
				});
				// Writes the stream to file
				stream.pipe(require('fs').createWriteStream('out.flv')); 
			});
			
			// Find devices setup with notifications about this camera
			camera.getDevicesWithNotifications(function(err, results) {
				if(err) console.error(err);
				console.log(util.inspect(results));
			});
			
			// Returns an array of subscriptions the camera has
			camera.getSubscriptions(function(err, results) {
				if(err) console.error(err);
				console.log(util.inspect(results));
			});
			
			// Returns an array of video clips from this camera 
			camera.getClips(function(err, clips) {
				if(err) console.error(err);
				console.log(util.inspect(clips));
			});
		});
	});
})();