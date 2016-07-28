/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
function fillTable (){
	// Calc data
	var data = computeWiperset();
	
	// Fill out data
	document.getElementById("armLength").textContent = data.armLenth;
	document.getElementById("bladeLength").textContent = data.bladeLength;
	document.getElementById("maxWiperAngle").textContent = data.maxWiperAngle;
	document.getElementById("marginHorizontal").textContent = data.marginHorizontal;
	document.getElementById("marginBelow").textContent = data.marginBelow;
	document.getElementById("marginAbove").textContent = data.marginAbove;
	document.getElementById("marginVerticalMovements").textContent = data.marginVerticalMovement;
	
	
	// Filter tables based on data
	var fArms = database.arms.where(function (a) {
		return a.lengthMax >= data.armLenth && a.lengthMin <= data.armLenth && a.bladeLengthMax >= data.bladeLength && a.bladeLengthMin <= data.bladeLength;
	});
	var fBlades = database.blades.where(function (a) {
		return a.length === data.bladeLength;
	});
	var fMotors = database.motors.where(function (a) {
		return a.armMax >= data.armLenth && a.bladeMax >= data.bladeLength;
	});
	
	// Clear table
	document.getElementById("arms").innerHTML = "";
	document.getElementById("blades").innerHTML = "";
	document.getElementById("motors").innerHTML = "";

	// Recreate tables
	buildTable (fArms, ["armType", "lengthMin", "lengthMax", "hoh", "bladeLengthMin", "bladeLengthMax", "bladeType", "applType", "artNr"], ["armType", "lengthMin", "lengthMax", "hoh", "bladeLengthMin", "bladeLengthMax", "bladeType", "applType", "artNr"], "arms");
	
	buildTable (fBlades, ["bladeType", "length", "artNr"], ["bladeType", "length", "artNr"], "blades");
	
	buildTable (fMotors, ["armMax", "bladeMax", "hoh", "armType", "bladeType", "name"], ["armMax", "bladeMax", "hoh", "armType", "bladeType", "name"], "motors");
}

function buildTable (data, headers, labels, tableID) {
	var table;
	if (typeof tableID === "string"){
		table = document.getElementById(tableID);
	} else {
		table = tableID;
	}
	var row = document.createElement("tr");
	for (var k = 0; k < headers.length; k++) { // Iterate over columns
		var label = document.createElement("th");
		label.textContent = labels[k];
		row.appendChild(label);
	}
	table.appendChild(row);
	for (var i = 0; i < data.length; i++){ // Iterate over rows
		row = document.createElement("tr");
		for (var j = 0; j < headers.length; j++) { // Iterate over columns
			var cell = document.createElement("td");
			var dataRow = data[i];
			var header = headers[j];
			cell.textContent = dataRow[header];
			row.appendChild(cell);
		}
		table.appendChild(row);
	}
}