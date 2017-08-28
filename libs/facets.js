'use strict';

exports.create = function (facets) {

    var facetObj = {};
    for(var key in facets) {
        facetObj[key] = createList(key, facets[key].buckets);
    }

    return facetObj;
};

exports.getFacetBreadcrumbObject = function(selectedFacets) {

    var breadcrumbs = [];
    for(var key in selectedFacets) {

        for(var index of selectedFacets[key]) {
            breadcrumbs.push({
                type: key,
                name: index
            });
        }
    }

    return createBreadcrumbTrail(breadcrumbs);
};

function createList(facet, data) {

    var i;
    var html = '';
    for (i = 0; i < data.length; i++) {

        html += '<span><a  href="javascript:document.location.href=selectFacet(\'' + facet + '\', \'' + data[i].key + '\');">' + data[i].key + '</a>&nbsp;&nbsp;(' + data[i].doc_count + ')</span><br>';   // good
        //html += '<span><a  onclick="selectFacet(\'' + facet + '\', \'' + data[i].key + '\');">' + data[i].key + '</a>&nbsp;&nbsp;(' + data[i].doc_count + ')</span><br>';   // test
    }

    return html;
};

function createBreadcrumbTrail(data) {
    var i;
    var html = '';
    for (i = 0; i < data.length; i++) {

        html += '<span><a  href="javascript:document.location.href=removeFacet(\'' + data[i].type + '\', \'' + data[i].name + '\');"><strong id="facet-breadcrumb-remove-link">X</strong></a>' + data[i].type + '&nbsp&nbsp<strong id="facet-breadcrumb-sidearrow"> > </strong>&nbsp&nbsp' + data[i].name + '</span>';   // good
        //html += '<span><a  onclick="removeFacet(\'' + data[i].type + '\', \'' + data[i].name + '\');"><strong id="facet-breadcrumb-remove-link">X</strong></a>' + data[i].type + '&nbsp&nbsp<strong id="facet-breadcrumb-sidearrow"> > </strong>&nbsp&nbsp' + data[i].name + '</span>';   // test

    }

    return html;
};

