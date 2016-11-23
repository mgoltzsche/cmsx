/**
 * Browser limitations:
 *   contenteditable:  not in Opera Mini, IE>=8,  FF49, Safari/iOS Safari 10, Chrome 53
 *   input event:      not in Opera Mini, IE>=11, FF49, Safari/iOS Safari 10, Chrome 53
 *   classList:        not in Opera Mini, IE>=11, FF49, Safari/iOS Safari 10, Chrome 53
 *     (IE11: doesn't support multiple args on toggle(), add(), remove(); doesn't work with svg)
 *   addEventListener: IE>=11, FF49, Safari/iOS Safari 10, Chrome 53
 *   JSON:             IE>=11, FF49, Safari/iOS Safari 10, Chrome 53
 *     (in IE 8 only if document is in IE 8 standards mode)
 */

var $ = require('jquery');
require('./cmsx-polyfills.js');
var CmsxManager = require('./cmsx-manager.js');

$(document).ready(function() {
	if (!document.body.addEventListener) {
		alert('Your browser is not supported! Please update or use a different browser.');
		return;
	}
	var cmsx = new CmsxManager();
});