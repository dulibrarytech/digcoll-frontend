var rs = require('request-stream'),
    fs = require('fs');

exports.testObject = function(object) {
	return (object && typeof object != "undefined");
}

exports.isParentObject = function(object) {
  return (object && object.object_type == "compound");
}

exports.isObjectEmpty = function(object) {
	for(var key in object) {
        if(object.hasOwnProperty(key))
            return false;
    }
    return true;
}

exports.getFileStream = function(path, callback) {
  callback(null, fs.createReadStream(path));
}

exports.streamRemoteData = function(url, callback) {
	rs(url, {}, function(err, res) {
		if(err) {
			callback("Could not open datastream. " + err + " Check connection to repository", null, null);
		}
		else {
			callback(null, res.statusCode, res);
		}
	});
}

/*
 * The "Dial In"
 */
var extractValues = function(pathArray, object, matchField, matchValue, condition, bucket) {
	var nextKey,
		nextObject,
		nextArray;

	// We have drilled into the specified field.  Locate the value
	if(pathArray.length == 1) {
		if(matchField) {
			if(object[pathArray] && 
				condition == "true" && 
				object[matchField] == matchValue) {

				bucket.push(object[pathArray]);
			}
			else if(object[pathArray] && 
					condition == "false" && 
					object[matchField] != matchValue) {

				bucket.push(object[pathArray]);
			}
		}
		else if(object[pathArray]) {
			bucket.push(object[pathArray]);
		}
	}

	// Keep digging
	else {
		nextArray = pathArray.slice();
		nextKey = nextArray.shift();
		nextObject = object[nextKey];

		if(!nextObject) {
			return 0;
		}
		else if(nextObject.length) {
			for(var index in nextObject) {
				extractValues(nextArray, nextObject[index], matchField, matchValue, condition, bucket);
			}
		}
		else {
			extractValues(nextArray, nextObject, matchField, matchValue, condition, bucket);
		}
	}
}
exports.extractValues = extractValues;