 'use strict'
 /**
 * @file 
 *
 * Discovery View Controller Functions
 *	
 */

const async = require('async'),
    config = require('../config/' + process.env.CONFIGURATION_FILE),
    Helper = require('./helper.js'),
    AppHelper = require("../libs/helper"),
    Service = require('./service.js'),
    Viewer = require('../libs/viewer'),
    CompoundViewer = require('../libs/compound-viewer'),
    Facets = require('../libs/facets'),
    Paginator = require('../libs/paginator'),
    Metadata = require('../libs/metadata'),
    Search = require('../search/service'),
    Format = require("../libs/format");

/**
 * Renders the front page
 * Retrieves all objects in the root collection
 * 
 * @param {Object} req - Express.js request object
 * @param {Number} req.query.page - Returns this page of results if pagination is in use
 * @param {Object} res - Express.js response object
 *
 * @return {undefined}
 */
exports.renderRootCollection = function(req, res) {
	var data = {
		collections: [],
		searchFields: [],
		facets: {},
		paginator: {},
		typeCount: {},
		error: null,
		root_url: config.rootUrl
	},
	page = req.query.page || 1;

	// Get all root collections
	Service.getTopLevelCollections(page, function(error, response) {

		// Get the view data
		if(error) {
			console.log(error);
			data.error = "Error: could not retrieve collections.";
		}
		else {
			data.collections = response.list;
			data.searchFields = config.searchFields;
		}

		// Get facets for all data
		Service.getFacets(null, function(error, facets) {
			if(error) {
				console.log(error);
			}
			else {
				var facetList = Facets.getFacetList(facets, []);

				// Only show the specified front page display facets, remove others here
				for(var key in facetList) {
					if(config.frontPageFacets.includes(key) === false) {
						delete facetList[key];
					}
				}

				data.facets = Facets.create(facetList, config.rootUrl);
				data.typeCount = Helper.getTypeFacetTotalsObject(facets);
				data.facetThumbnails = config.facetThumbnails;
			}
			
			res.render('collections', data);
		});
	});
}

/**
 * Renders the collection view
 * Retrieves all objects in the requested collection
 * 
 * @param {Object} req - Express.js request object
 * @param {Object} req.query.f - DDU Facet object {"{facet name or ID}": ["{facet value}", "{facet value}", ...]} Currently selected facets
 * @param {Number} req.query.page - If object results for requested collection exceed page limit, show this page of object results
 * @param {Array} req.query.showAll - Array of facet names: If a name is listed, the entire list of facets will be shown in the facet panel. For use if list has been limited
 * @param {Object} res - Express.js response object
 *
 * @return {undefined}
 */
exports.renderCollection = function(req, res) {
	Service.getCollectionHeirarchy(req.params.pid, function(parentCollections) {
		var data = {
			error: null,
			facets: {},
			facet_breadcrumb_trail: null,
			collection_breadcrumb_trail: null,
			current_collection_title: "",
			current_collection: "",
			pagination: {},
			root_url: config.rootUrl,
			searchFields: config.searchFields,
			options: {}
		};
			
		var	pid = req.params.pid || "",
			page = req.query.page || 1,
			path = config.baseUrl + req._parsedOriginalUrl.path,
			reqFacets = req.query.f || null,
			showAll = req.query.showAll || [];

		data.collectionID = pid;
		data.options["expandFacets"] = [];
		data.options["perPageCountOptions"] = config.resultCountOptions;

		// Get all collections in this community
		Service.getObjectsInCollection(pid, page, reqFacets, function(error, response) {
			if(error) {
				console.log(error);
				data.error = "Could not open collection.";
				data.current_collection_title = "Error";
				return res.render('collection', data);
			}
			else {
				data.collections = response.list;
				data.current_collection = pid;
				data.current_collection_title = response.title || "Untitled";

				/* Get the list of facets for this collection, remove the 'Collections' facets (Can re-add this field, if we ever show facets for nested collections: 
				 * ie there will be multiple collections facets present when one collection is open) */
				var facetList = Facets.getFacetList(response.facets, showAll);
				delete facetList.Collections;

				/* This variable should always be null here, as rendering the collection view is separate from a keyword search and no request facets should be present here.  
				 * The below code is to prevent a potential crash of the appication, just in case */
				if(reqFacets) {
					reqFacets = Facets.getSearchFacetObject(reqFacets);
				}

				Format.formatFacetDisplay(facetList, function(error, facetList) {
					
					// Add collections and collection data	
					data.pagination = Paginator.create(response.list, page, config.maxCollectionsPerPage, response.count, path);
					data.facets = Facets.create(facetList, config.rootUrl);
					data.facet_breadcrumb_trail = Facets.getFacetBreadcrumbObject(reqFacets, null, config.rootUrl);
					data.collection_breadcrumb_trail = Helper.getCollectionBreadcrumbObject(parentCollections);

					// If there are no facets to display, set to null so the view does not show the facets section
					if(AppHelper.isObjectEmpty(data.facets)) {
						data.facets = null;
					}

					return res.render('collection', data);
				});
			}
		});
	});
}

/**
 * Renders the object view
 * Retrieves object data for requested object
 * 
 * @param {Object} req - Express.js request object
 * @param {String} req.params.pid - PID of the object to be rendered
 * @param {Object} res - Express.js response object
 *
 * @return {undefined}
 */
exports.renderObjectView = function(req, res) {
	var data = {
		viewer: null,
		object: null,
		summary: null,
		mods: {},
		error: null,
		root_url: config.rootUrl
	};

	Service.fetchObjectByPid(config.elasticsearchPublicIndex, req.params.pid, function(error, response) {
		if(error) {
			data.error = error;
			res.render('object', data);
		}
		else if(response == null) {
			data.error = "Object not found: " + req.params.pid;
			res.render('object', data);
		}
		else {
			var object = response,
				part = req.params.index && isNaN(parseInt(req.params.index)) === false ? req.params.index : 0;

			// Render a parent object with child objects
			if(AppHelper.isParentObject(object)) {
				data.viewer = CompoundViewer.getCompoundObjectViewer(object, part);
			}

			// Render singular object
			else {
				// Can't lookup part of a non-parent object
				if(part > 0) {
					data.error = "Object not found";
					res.render('object', data);
				}
				else {
	
					// Get viewer
					data.viewer = Viewer.getObjectViewer(object);
					if(data.viewer == "") {
						data.error = "Viewer is unavailable for this object.";
					}
				}
			}

			// Get array of parent collections for the parent collection breadcrumb list
			Service.getCollectionHeirarchy(object.is_member_of_collection, function(collectionTitles) {

				// Get metadata displays and render the view
				data.summary = Metadata.createSummaryDisplayObject(object);
				data.mods = Object.assign(data.mods, Metadata.createMetadataDisplayObject(object, collectionTitles));
				res.render('object', data);
			});
		}
	});
};

/**
 * Pipes an object datastream to the client
 * 
 * @param {Object} req - Express.js request object
 * @param {String} req.params.datastream - Datastream ID (defined in configuration)
 * @param {String} req.params.pid - Object PID
 * @param {String} req.params.part - If a compound object, fetch datastream for this part index (first part = index 1)
 * @param {Object} res - Express.js response object
 *
 * @return {undefined}
 */
exports.getDatastream = function(req, res) {
	var ds = req.params.datastream.toLowerCase() || "",
		pid = req.params.pid || "",
		part = req.params.part || null,
		index = config.elasticsearchPublicIndex;

	// Detect part index appended to a compound object pid.  This is to allow IIIF url resolver to convey part index data by modifying the pid value
	let pidElements;
	if(part == null && pid.indexOf(config.compoundObjectPartID) > 0) {
		part = pid.substring(pid.indexOf(config.compoundObjectPartID)+1, pid.length);	
		pid = pid.split(config.compoundObjectPartID,1)[0];

		// pidElements = pid.split(config.compoundObjectPartID);
		// part = pidElements[pidElements.length-1];
		// pid = pid.substring(0,pid.length-(part.length+1));
	}
		
	// If a valid api key is passed in with the request, get data from the the private index
	if(req.headers["x-api-key"] && req.headers["x-api-key"] == config.apiKey) {
		index = config.elasticsearchPrivateIndex;
	}

	// Get the datastream and pipe it
	Service.getDatastream(index, pid, ds, part, function(error, stream) {
		if(error) {
			console.log(error);
			res.sendStatus(404);
		}
		else {
			res.set('Accept-Ranges', 'bytes');
			stream.pipe(res);
		}
	});
}

/**
 * Gets a IIIF manifest for an object
 * 
 * @param {Object} req - Express.js request object
 * @param {String} req.params.pid - Object PID
 * @param {Object} res - Express.js response object
 *
 * @return {undefined}
 */
exports.getIIIFManifest = function(req, res) {
	let pid = req.params.pid || "";
	Service.getManifestObject(pid, function(error, manifest) {
		if(error) {
			console.log(error);
			res.sendStatus(500);
		}
		else if(manifest){
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.send(JSON.stringify(manifest));
		}
		else {
			res.send("Item not found");
		}
	});
}

/**
 * Gets a Kaltura embedded iframe viewer for an object
 * 
 * @param {Object} req - Express.js request object
 * @param {String} req.params.pid - Object PID
 * @param {String} req.params.part - If a compound object, get viewer for this part index (first part = index 1)
 * @param {Object} res - Express.js response object
 *
 * @return {undefined}
 */
exports.getKalturaViewer = function(req, res) {
	let pid = req.params.pid || "",
		part = parseInt(req.params.part) || 1;

	// Get the object data
	Service.fetchObjectByPid(config.elasticsearchPublicIndex, pid, function(error, object) {
		if(error) {
			console.log(error, pid);
			res.send("<h4>Error loading viewer");
		}
		else if(object == null) {
			console.log("Object not found", pid);
			res.send("<h4>Error loading viewer, object not found");
		}
		else {
			// If the object is found, check if it is a compound object.  If it is, and a part has been requested, get the part object
			if(AppHelper.isParentObject(object) && part) {
				object = AppHelper.getCompoundObjectPart(object, part);
			}

			// Get the iframe html for the object and return it to the client
			res.send(Viewer.getKalturaViewer(object));
		}
	});
}