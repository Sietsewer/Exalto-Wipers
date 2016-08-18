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
	
	drawSheme (data);
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

function calculateSize (paperSize, dpi){
	var paperHeight = 0;
	var paperWidth = 0;
	
	var mm2in = 0.0393701;
	
	paperSize = paperSize.toLowerCase().replace(/[^a-z0-9,.]/g, "");
	// Check if in 12.34x56.78mm format
	if (! /^[0-9]+([\.,][0-9]+)?x[0-9]+([\.,][0-9]+)?mm$/g.test(paperSize)){
		return [800, 600];
	}
	
	paperSize = paperSize.replace(/mm/g,"").split('x');

	paperWidth  = Number(paperSize[1]) * mm2in * dpi;
	paperHeight = Number(paperSize[0]) * mm2in * dpi;
	
	return [paperWidth, paperHeight];
}

function resizeCanvas () {
	var size = calculateSize(document.getElementById("paperSize").value, document.getElementById("paperDpi").value);
	resize(size[0], size[1]);
}