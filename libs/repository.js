 /**
 * @file 
 *
 * Fedora Repository Interface 
 * 
 */

'use strict';

const config = require('../config/config'),
	  request = require('request');

const host = config.repositoryUrl;

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getFedoraDatastreamUrl = function(datastream, pid) {
	var dsID = "";
	datastream = datastream.toLowerCase();

	switch(datastream) {
		case "tn":
			dsID = "TN";
			break;
		case "small_image":
		case "jpg":
			dsID = "OBJ";
			break;
		case "large_image":
		case "tiff":
			dsID = "OBJ";
			break;
		case "audio":
		case "mp3":
			dsID = "PROXY_MP3";
			break;
		case "video":
		case "mp4":
			dsID = "MP4";
			break;
		case "mov":
			dsID = "MOV";
			break;
		case "pdf":
			dsID = "OBJ";
			break;
		default: 
			dsID = "OBJ";
			break;
	}

	return host + "/fedora/objects/" + pid + "/datastreams/" + dsID + "/content";
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getDatastreamUrl = function(datastream, pid) {
	return this.getFedoraDatastreamUrl(datastream, pid);
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getRootCollections = function() {
	return new Promise(function(fulfill, reject) {
		fulfill([]);
	});
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getCollectionObjects = function(collectionID) {
	return new Promise(function(fulfill, reject) {
		fulfill([]);
	});
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.streamData = function(pid, dsid, callback) {

	// Fedora
	var url = this.getFedoraDatastreamUrl(dsid, pid);

	// Get the stream 
	var rs = require('request-stream');
	rs(url, {}, function(err, res) {
		if(err) {
			callback("Could not open datastream. " + err + " Check connection to repository", null);
		}
		else {
			callback(null, res);
		}
	});
}




