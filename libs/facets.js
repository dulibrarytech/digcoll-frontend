 /**
 * @file 
 *
 * Facets class
 * Create facet objects for the view controllers, and content to display facet data
 *
 */

'use strict';

/**
 * 
 *
 * @param 
 * @return 
 */
exports.create = function(facets, baseUrl) {
    var facetObj = {};
    for(var key in facets) {
        facetObj[key] = createList(key, facets[key], baseUrl);
    }
    return facetObj;
};

/**
 * 
 *
 * @param 
 * @return 
 */
exports.getFacetBreadcrumbObject = function(selectedFacets) {
    var breadcrumbs = [], buckets;

    // Create the object to populate the view elements
    for(var key in selectedFacets) {
        buckets = selectedFacets[key];

        for(var index of buckets) {
            breadcrumbs.push({
                type: key,
                name: index.name,
                facet: index.facet
            });
        }
    }
    return createBreadcrumbTrail(breadcrumbs);
};

/**
 * 
 *
 * @param 
 * @return 
 */
function createList(facet, data, baseUrl) {
    var i;
    var html = '';
    
    if(data.length > 0) {
        html += '<div class="panel facet-panel panel-collapsed"><ul>';
        for (i = 0; i < data.length; i++) {
            if(data[i].key != "") {
                html += '<li><span class="facet-name"><a href="javascript:document.location.href=selectFacet(\'' + facet + '\', \'' + data[i].facet + '\', \'' + baseUrl + '\');">' + data[i].name + '</a></span><span class="facet-count">(' + data[i].doc_count + ')</span></li>';
            }
            else {
                html += "";
            }
        }
        html += '</ul></div>';
    }

    return html;
};

/**
 * 
 *
 * @param 
 * @return 
 */
function createBreadcrumbTrail(data) {
    var i;
    var html = '';
    for (i = 0; i < data.length; i++) {
        html += '<span><a href="javascript:document.location.href=removeFacet(\'' + data[i].type + '\', \'' + data[i].facet + '\');"><strong style="color: red">X</strong></a>&nbsp&nbsp' + data[i].type + '&nbsp&nbsp<strong style="color: green"> > </strong>&nbsp&nbsp' + data[i].name + '</span>';   // good
    }

    return data.length > 0 ? html : null;
};

