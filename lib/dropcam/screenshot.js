module.exports = (function() {
	'use strict';

	var streamify = require('stream-array');

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

	Screenshot.prototype.pipe = function(to) {
		streamify(this.buffer).pipe(to);
	};

	return Screenshot;
})();