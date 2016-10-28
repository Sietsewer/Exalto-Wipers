/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
var database;
var databaseIsLoaded = false;

init();

function loadJSON(callback) {
    "use strict";
    
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/JSON");
    xobj.open('GET', 'componentsDatabase.json', true);
    xobj.onreadystatechange = function () {
        if (this.status >= 200 && this.status < 400) {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns 
            callback(xobj.responseText);
        } else {
			console.error("Couldn't reach JSON file, status: " + xobj.status + "\ndata: " + xobj.responseText);
		}
    };
    xobj.send(null);
}

function init() {
    "use strict";
    
	console.log("INIT!");
	
    loadJSON(function (response) {
		console.log(response);

		
        // Parse JSON string into object
		database = JSON.parse(response);
		databaseIsLoaded = true;
		databaseLoaded();
    });
}

function databaseLoaded(){
	
}

function getWithinColumns(collection, lableMin, lableMax, value) {
	"use strict";
	var returnValues = [];
	
    for (var i = 0; i < collection.length; ++i) {
		var row = collection[i];
		
		if (value !== null && value >= row[lableMin] && value <= row[lableMax]){
			returnValues.push(value);
		}
	}
	
	return returnValues;
}

function getWithinRange(collection, lable, min, max) {
    "use strict";
	var returnValues = [];
	
    for (var i = 0; i < collection.length; ++i) {
        var row = collection[i];
		var value = row[lable];
		if (value !== null && value >= min && value <= max){
			returnValues.push(value);
		}
	}
	
	return returnValues;
}

Array.prototype.where = function(condition){
	"use strict";
	var returnValues = [];
	
	for (var i = 0; i < this.length; ++i) {
		var element = this[i];
		if(condition(element)){
			returnValues.push(element);
		}
	}
	return returnValues;
};

Array.prototype.firstWhere = function(condition){
	"use strict";
	for (var i = 0; i < this.length; ++i) {
		var element = this[i];
		if(condition(element)){
			return element;
		}
	}	
};

