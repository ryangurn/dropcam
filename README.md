# dropcam
Unofficial Dropcam API Client

## Status
There's no public documentation for this API as most of it was reverse engineered from their private API.
There is a beta program available to access official API resources, however they are selective
towards who can use it. Consider this experimental until further notice as it can
break when their private API is updated. Report any bugs if you come across them.

## Features
- Dropcam Scope
	- Search API - Find any camera publically accessable
	- Demos API - Access various demos available
	- Camera API - Access various functions of a camera
		- User Scope
			- User API
				- Notification Email Management - Manage email notifications
		- Camera Scope
			- Settings - Manage and modify various camera settings
			- Visibility - Modify visibility of the camera (public/private)
			- Media Capture - Capture real time screenshots and live video streams (requires RTMPDUMP)
			- Basic implementation of Notifications - See all devices that receive notifications
			- Basic implementation of Clips and Subscriptions - Get available clips and subscriptions

## TODO
- Subscriptions - Manage and modify subscriptions
- Clips - Manage and view existing clips on the cloud
- Notifications - Capture motion/sound events
- Tests

## Live Video Streams
This project depends on the use of rtmpdump to capture live video streams. Since there is no reliable
native functionality to capture RTMP streams at the moment (at least to my knowledge), 
you must download and have rtmpdump on your system PATH. To download, visit: http://rtmpdump.mplayerhq.hu/download
Tested with RTMPDUMP 2.4 on Win 8.1 64bit. 

## Installation
    $ npm install dropcam

## Tests
    $ npm test

## Examples

```javascript
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
				screenshot.pipe(require('fs').createWriteStream('pub_cam_screen.jpeg'));
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
```

## Dropcam API
### .login(username, password, callback)
This function will attempt to login into the private dropcam API 
and returns a user (you) with a valid session if successful. This 
function must be called before accessing any other API functions.
See above for an example.

### .search(user, public_token, callback)
This function will attempt to search the dropcam API using the public 
token to find the camera that's associated with it. The public token is
a string type. The callback returns a camera if successful. Login 
must be called before accessing the full camera API. Note: You will
not be able to modify camera settings (such as visibility) unless 
you own the camera. See above for an example.

### .demos(user, callback)
This function will attempt to search for available demos and return an 
array of cameras. Login must be called before accessing the full camera 
API. Note: You will not be able to modify camera settings (such as 
visibility) unless you own the camera. See above for an example.

### .getVisibleCameras(user, callback)
This function will attempt to return an array of visible cameras associated 
with the user. Login must be called before accessing the full camera API.
See above for an example.  

## User API
You can access several user properties and session details with a user.
For example to get the username of the user, do the following: user.username.
Available properties: id, username, timezone, email and session. See above
for an example.

### .getSessionToken(callback)
This function will returns the current user's session token. Alternatively,
you can access the token by extending the user's session property without
needing to make an API call. See above for an example.

### .addNotificationEmail(email, callback)
This function will attempt to add a new email address for notifications and
return an object containing the new address and id. The id is important to have
in the case you wish to later remove the associated email. See above for an
example. 

### .removeNotificationEmail(email_id, callback)
This function will attempt to remove an associated email address with the id and
return a true/false depending on success. You can only obtain the id when you create
a new notification email using the API, so it's important to save the id if you plan
on removing it later. See above for an example.

## Camera API
Due to wide variety of properties and settings varying per camera, you can access 
all properties by extending the camera's properties, settings and user. You can see an 
example of this in the above example.

### .toggle(visibility, callback)
This function will attempt to toggle the camera's visibility setting and return the resulting
new setting as 'private' or 'public'. You can pass in a string such as 'private' or 'public'
as the visibility parameter. Note: This function will not work on cameras not associated with 
the user. See above for an example.

### .update(keyvalue, callback)
This function will attempt to update a camera setting such as enabling audio, motion
detection, etc and returns a true/false depending on the success. You can see a full list 
of available settings by accessing the settings property on the camera including their values. 
Note: This function will not work on cameras not associated with the user. See above for 
an example.

### .capture(callback)
This function will attempt to capture a live screenshot of the camera and return a screenshot
object. This function should work on both user owned and public cameras. See above for an
example, and see below for object functions.

### .record(seconds, callback)
Important: You MUST have rtmpdump installed and on your PATH to call this function (see above
for a link). This function will attempt to record a live stream by returning you a stream object.
You can pass in a valid number of seconds as the seconds parameter. Use 0 if you don't wish to
stop recording until you terminate the application. Note: This function should work on both user 
owned and public cameras. See above for an example, and see below for object functions.

### .getDevicesWithNotifications(callback)
This function will attempt to get all devices asssociated with this camera and return an array 
of devices that are currently recently notifications. Note: This function will not work on cameras 
not associated with the user. See above for an example.

### .getSubscriptions(callback)
This function will attempt to get any subscriptions associated with this camera and return an
array of subscriptions. Note: This function will not work on cameras not associated with 
the user. See above for an example.

### .getClips(callback)
This function will attempt to get any video clips saved on the cloud and return an array of
clips. See above for an example.

## Screenshot
### .pipe(out)
You can call .pipe on the object and do what you wish with the buffer, such as writing 
to file. See above for an example

## Stream
### .pipe(out)
You can call .pipe on the object and do what you wish with the buffer, such as writing to file.
See above for an example.
### .on(event, callback)
You can listen for events on this stream.
### Event: 'data'
You can listen for incoming standard output on this stream.
### Event: 'error'
You can listen for incoming error output on this stream.

## License
Copyright (c) 2014 OPFL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
