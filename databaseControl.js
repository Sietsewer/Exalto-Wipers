/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
/*globals limits*/
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
	
	var motorArmMax = Number.NEGATIVE_INFINITY;
	var motorBladeMax = Number.NEGATIVE_INFINITY;
	database.motors.forEach(function(element){
		if(motorArmMax <= element.armMax){
			motorArmMax = element.armMax;
		}
		if(motorBladeMax <= element.bladeMax){
			motorBladeMax = element.bladeMax;
		}
		// Implement angle min max
	});
	
	var armBladeMin = Number.POSITIVE_INFINITY;
	var armBladeMax = Number.NEGATIVE_INFINITY;
	database.arms.forEach(function(element){
		if(limits.database.armMin >= element.lengthMin){
			limits.database.armMin = element.lengthMin;
		}
		if(limits.database.armMax <= element.lengthMax){
			limits.database.armMax = element.lengthMax;
		}
		
		if(armBladeMin >= element.bladeLengthMin){
			armBladeMin = element.bladeLengthMin;
		}
		if(armBladeMax <= element.bladeLengthMax){
			armBladeMax = element.bladeLengthMax;
		}
		
	});
	
	
	database.blades.forEach(function(element){
		if(limits.database.bladeMin >= element.length){
			limits.database.bladeMin = element.length;
		}
		if(limits.database.bladeMax <= element.length){
			limits.database.bladeMax = element.length;
		}
	});
	
	if(motorArmMax < limits.database.armMax){
		limits.database.armMax = motorArmMax;
	}
	
	if(motorBladeMax < limits.database.bladeMax){
		limits.database.bladeMax = motorBladeMax;
	}
	
	if(armBladeMin > limits.database.bladeMin){
		limits.database.bladeMin = armBladeMin;
	}
	if(armBladeMax < limits.database.bladeMax){
		limits.database.bladeMax = armBladeMax;
	}
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

