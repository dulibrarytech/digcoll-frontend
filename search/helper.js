 /**
 * @file 
 *
 * Search module helper functions
 *
 */

'use strict';

var config = require('../config/' + process.env.CONFIGURATION_FILE),
    appHelper = require('../libs/helper');

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getFacetAggregationObject = function(facets) {
  var facetAggregations = {}, field;
    for(var key in facets) {
      field = {};
      field['field'] = facets[key] + ".keyword";
      field['size'] = config.facetLimit;
      facetAggregations[key] = {
        "terms": field
      };
    }
    return facetAggregations;
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.removeSelectedFacets = function(facets, results) {
  for(var facetKey in facets) {
    for(var index in facets[facetKey]) {
      var facetString = facets[facetKey][index],
          bucket = results.aggregations[facetKey].buckets;
      for(let facetIndex in bucket) {
        if(bucket[facetIndex].key == facetString) {
          bucket.splice(facetIndex,1);
        }
      }
    }
  }
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.removeEmptyFacetKeys = function(facets) {
  var buckets;
  for(var facetKey in facets) {
      buckets = facets[facetKey].buckets;
      for(var index in buckets) {
        if(buckets[index].key.length < 2) {
          buckets.splice(index);
        }
      }
  }
  return facets;
}

/**
 * Defunct
 *
 * @param 
 * @return 
 */
exports.getSearchResultDisplayFields = function(searchResult) {
  var fields = {
    title: "",
    description: "",
    creator: ""
  };

  var displayRecord = {};

  try {
    // Get Display Record data
      if(searchResult._source.display_record && typeof searchResult._source.display_record == 'string') {
        displayRecord = JSON.parse(searchResult._source.display_record);
      }
      else if(searchResult._source.display_record && typeof searchResult._source.display_record == 'object') {
        displayRecord = searchResult._source.display_record;
      }

      // Find the title
      if(searchResult._source.title && searchResult._source.title != "") {
        fields.title = searchResult._source.title;
      }
      else if(displayRecord.title &&  displayRecord.title != "") {
        fields.title = displayRecord.title;
      }

      // Find the description
      if(searchResult._source.modsDescription && searchResult._source.modsDescription != "") {
        fields.description = searchResult._source.modsDescription;
      }
      else if(displayRecord.abstract && displayRecord.abstract != "") {
        fields.description = displayRecord.abstract;
      }

      // Find the creator
      if(searchResult._source.creator && searchResult._source.creator != "") {
        fields.creator = searchResult._source.creator;
      }
      else if(displayRecord.creator && displayRecord.creator != "") {
        fields.creator = displayRecord.creator;
      }
  }
  catch(error) {
    console.log("Error: " + error);
  }

    return fields;
}

/**
 * Create the 'results for:' label for search results
 * If there are multiple queries in the array, this is an advanved search.  Use the first query for the results querystring label
 *
 * @param 
 * @return 
 */
exports.getResultsLabel = function(query, facets) {
  let queryData = " ";

  if(query == "" && facets) {
    for(let key in facets) {
      for(let index in facets[key]) {
        queryData += (" " + facets[key][index]);
      }
      queryData += ";";
    }
  }
  else {
    queryData = query == "" ? "*" : query;
  }

  return queryData; 
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getDateRangeQuery = function(daterange) {
  var dateQuery = {
      "bool": {
        "should": []
      }
    },
    beginRange = {}, endRange = {};

    // QI Check if begin date is included in the range
    beginRange[config.beginDateField] = {
      "gte": daterange.from,
      "lte": daterange.to
    };
    dateQuery.bool.should.push({
      "range": beginRange
    });

    // QII Check if end date is included in the range
    endRange[config.endDateField] = {
      "gte": daterange.from,
      "lte": daterange.to
    };
    dateQuery.bool.should.push({
      "range": endRange
    });

    // QIII, QIV Check for object date span that envelops the selected daterange
    var temp = [], beginRange = {}, endRange = {};
    beginRange[config.beginDateField] = {
      "lte": daterange.from
    };
    temp.push({
      "range": beginRange
    });
    endRange[config.endDateField] = {
      "gte": daterange.to
    };
    temp.push({
      "range": endRange
    });
    dateQuery.bool.should.push({
      "bool": {
        "must": temp
      }
  });

  return dateQuery;
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getSearchFields = function(fieldValue) {
  var fields = [];

  // Non-scoped search: Search in all of the fields in the fulltext search
  if(fieldValue.toLowerCase() == 'all') {
    fields = config.fulltextKeywordSearchFields;
  }

  // Scoped search: Use the selected type in the search type dropdown
  else {
    for(var field of config.fulltextKeywordSearchFields) {
      if(field.id.toLowerCase() == fieldValue.toLowerCase()) {
          fields.push(field);
      }
    }
  }

  return fields;
}

/**
 * Build the search query data array (for multiple advanced search queries, or a single search) from individual search url parameters
 *
 * @param 
 * @return 
 */
exports.getSearchQueryDataObject = function(queryArray, fieldArray, typeArray, boolArray) {
  var queryDataArray = [];

  for(var index in queryArray) {
    queryDataArray.push({
      terms: queryArray[index],
      field: fieldArray[index],
      type: typeArray[index],
      bool: boolArray[index]
    });
  }

  return queryDataArray;
}

/**
 * 
 *
 * @param 
 * @return 
 */
exports.sortSearchResults = function(results, sortBy) {
  var sorted = [],
      titles = [];

  // Get config value for sort by

  for(var index in results) {

  }

  return sorted;
}

exports.getQueryType = function(object) {
  var queryType = "match";

  // Determine the elastic "query type" to use in the query
  if(object.type == "isnot") {
    queryType = "must_not";
  }
  else if(object.type == "is") {
    queryType = "match_phrase";
  }
  else if(object.terms.indexOf('*') >= 0) {
    queryType = "wildcard";
  }
  else  {
    queryType = "match";
  }

  return queryType;
}