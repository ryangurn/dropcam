module.exports = (function() {
	'use strict';

	function Session(cookies, token) {
		this.cookies = cookies;
		this.token = token;

		Object.defineProperty(this, "token", {
  			enumerable: false,
  			configurable: false,
  			writable: false,
  			value: this.token
		});

		Object.defineProperty(this, "cookies", {
  			enumerable: true,
  			configurable: false,
  			writable: true,
  			value: this.cookies
		});
	}
	return Session;
})();