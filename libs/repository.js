'use strict'

/*
 * Repository interface functions
 */

const fedoraPath = "http://librepo01-vlp.du.edu:8080";

// Compose links to Fedora repository
exports.getTNUrl = function(pid) {
	return fedoraPath + "/fedora/objects/" + pid + "/datastreams/TN/content";
};

exports.getMP4Url = function(pid) {
	return fedoraPath + "/fedora/objects/" + pid + "/datastreams/MP4/content";
};