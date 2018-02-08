'use strict';

var async = require('async'),
    config = require('../config/config'),
    Helper = require('./helper.js'),
    Service = require('./service.js'),
    Viewer = require('../libs/viewer'),
    Facets = require('../libs/facets');

exports.getFacets = function(req, res) {

    Service.getFacets(function (facets) {
        if(typeof facets == 'string') {
        	console.log("Error");
        }
        res.send(facets);
    });
}

exports.renderCommunitiesView = function(req, res) {
	var data = {};

	// Get all communities
	Service.getTopLevelCollections(function(response) {
		data['base_url'] = config.baseUrl;
		data['error'] = null;

		if(response.status) {
			data['collections'] = response.data;
			data['objectPath'] = "/repository/community";
		}
		else {
			data['collections'] = [];
			data['error'] = "Could not retrieve communities.  Please contact Systems support";
		}
		return res.render('collections', data);
	});
}

exports.renderCommunity = function(req, res) {
	var data = {},
		id = req.params.id;

	// Get all collections in this community
	Service.getCollectionsInCommunity(id, function(response) {
		data['base_url'] = config.baseUrl;
		data['error'] = null;

		if(response.status) {
			data['collections'] = response.data;
			data['objectPath'] = "/repository/collection";
		}
		else {
			data['collections'] = [];
			data['error'] = "Could not retrieve collections.  Please contact Systems support";
		}
		return res.render('collections', data);
	});
}

exports.renderCollection = function(req, res) {
	var data = {},
		pid = req.params.pid;

	// Get all collections in this community
	Service.getObjectsInCollection(pid, function(response) {
		data['base_url'] = config.baseUrl;
		data['error'] = null;
			console.log("RESP", response);
		if(response.status) {
			data['collections'] = response.data;
			data['objectPath'] = "/repository/object";
		}
		else {
			data['collections'] = [];
			data['error'] = "Could not retrieve collections.  Please contact Systems support";
		}
		return res.render('objects', data);
	});
}

exports.search = function(req, res) {

	// Verify / sanitize
	var query = req.query.q;
	var facets = req.query.f || null;
	var typeVal = req.query.type, type;
	var page = req.query.page || 1;

	// "Search field selection": If "search all", build array of types from config settings.  If type search, 'type'is passed into search function as a string.
	if(typeVal == 'All') {
		type = [];
		config.searchFields.forEach(function(field) {	// TODO: Convert to for loop
			for(var key in field) {
				type.push(field[key]);
			}
		});
	}
	else {
		config.searchFields.forEach(function(field) {	// TODO: Convert to for loop
			for(var key in field) {
				if(key == typeVal) {
					type = field[key];
				}
			}
		});
	}

	// TODO: Get page value from search query
	// Update with ES pagination 
		console.log("TEST pre-search: facets:", facets);
	Service.searchIndex(query, type, facets, page, function(response) {
		var data = {
			facets: null,
			facet_breadcrumb_trail: null,
			results: null,
			pageData: null
		};

		// Dummy facets for demo
		var dummyType = [], dummyCreator = [];
		dummyType.push({
			"key": "moving image",
			"doc_count": "4"
		});
		dummyType.push({
			"key": "still image",
			"doc_count": "2"
		});
		var dummyFacets = {
		    "type": {
		        "doc_count_error_upper_bound": 0,
		        "sum_other_doc_count": 0,
		        "buckets": dummyType
		    }
		}

		data['base_url'] = config.baseUrl;
		if(response.status) {

			// Get data for the view
			var pagination = Helper.paginateResults(response.data.results, page);
				console.log("TEST facets from search:", response);
			data['facets'] = Facets.create(response.data.facets);	// PROD
			//data['facets'] = Facets.create(dummyFacets);			// DEV
				console.log("TEST facet object:", data['facets']);
			data['facet_breadcrumb_trail'] = Facets.getFacetBreadcrumbObject(facets);  // Param: the facets from the search request params

			data['results'] = pagination.results;
			data['pageData'] = pagination.data;
			// console.error("Test error!");  createBreadcrumbTrail
		}
		else {
			console.error("Search Error: ", response.message);
			data['results'] = null;
			data['error'] = response.message;
		}

		return res.render('results', data);
	});
};

exports.renderObjectView = function(req, res) {
	var data = {
		viewer: null,
		object: null,
		mods: null
	};

	// Get the object data
	Service.fetchObjectByPid(req.params.pid, function(response) {

		if(response.status) {

			var object;
			if(response.data.pid) {
				object = response.data;
				data['object'] = object;

				// Get viewer
				data['viewer'] = Viewer.getObjectViewer(object);
				data['summary'] = Helper.createSummaryDisplayObject(object);
				data['mods'] = Helper.createMetadataDisplayObject(object);
			}	
			else {
				data['error'] = "Error rendering object, object not found";
			}
		}
		else {
			console.error("Index error: ", response.message);
			data['error'] = "Error rendering object, object not found";
		}
		
		data['base_url'] = config.baseUrl;
		return res.render('object', data);
	});
};