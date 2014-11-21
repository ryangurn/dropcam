'use strict';

var inherits = require('inherits'),
	ReadableStream = require('stream').Readable;

function Screenshot(buffer, type) {
	this.buffer = buffer; // should be an array of buffer
	this.type = type;

	// the image is usually a jpeg
	Object.defineProperty(this, "type", {
  		enumerable: false,
  		configurable: false,
  		writable: false,
  		value: this.type
	});
}

inherits(Screenshot, ReadableStream);

Screenshot.prototype.pipe = function(to) {
	var streamify = require('stream-array');
	streamify(this.buffer).pipe(to);
};

module.exports = Screenshot;