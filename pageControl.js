
var sectionOne = 	function(){return document.getElementById("unitsSettings");};
var sectionTwo  = 	function(){return document.getElementById("windowSettings");};
var	sectionThree = 	function(){return document.getElementById("outputArea");};

var data;

/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: true, mootools: false, prototypejs: false*/
function fillTable (){
	// Calc data
	data = computeWiperset();
	
	// Fill out data
	document.getElementById("armLength").textContent = SizeNotation(data.armLenth);
	document.getElementById("bladeLength").textContent = SizeNotation(data.bladeLength);
	document.getElementById("maxWiperAngle").textContent = data.maxWiperAngle + "°";
	document.getElementById("marginHorizontal").textContent = SizeNotation(data.marginHorizontal);
	document.getElementById("marginBelow").textContent = SizeNotation(data.marginBelow);
	document.getElementById("marginAbove").textContent = SizeNotation(data.marginAbove);
	document.getElementById("marginVerticalMovements").textContent = SizeNotation(data.marginVerticalMovement);
	
	
	// Filter tables based on data
	var fArms = database.arms.where(function (a) {
		return a.lengthMax >= data.armLenth &&
			a.lengthMin <= data.armLenth &&
			a.bladeLengthMax >= data.bladeLength &&
			a.bladeLengthMin <= data.bladeLength &&
			a.applType === (data.inputData.windowData.wiperType === "pendulum" ? "enkel" : "parallel");
	});
	var fBlades = database.blades.where(function (a) {
		return a.length === data.bladeLength;
	});
	var fMotors = database.motors.where(function (a) {
		return a.armMax >= data.armLenth && a.bladeMax >= data.bladeLength;
	});
	
	// Clear table
	document.getElementById("arms").innerHTML   = "";
	document.getElementById("blades").innerHTML = "";
	document.getElementById("motors").innerHTML = "";

	// Recreate tables
	buildTable (fArms,
				["armType", 	"lengthMin", 		"lengthMax", 	"bladeLengthMin", 	"bladeLengthMax", 	"bladeType",	"artNr"],
				["Arm Type", 	"Arm Length Min", 	"Max", 			"Blade Length Min", "Max", 				"Blade Type", 	"Art. Nr."], "arms");
	
	buildTable (fBlades, ["bladeType", "length", "artNr"], ["Blade Type", "Length", "Art. Nr."], "blades");
	
	buildTable (fMotors, ["armMax", "bladeMax", "armType", "bladeType", "name"], ["Arm Max", "Blade Max", "Arm Type", "Blade Type", "Name"], "motors");
	
	resizeCanvas(null);
	drawSheme (data);
	
	inUpdate(function(){
		setPreviewImage(game.canvas.toDataURL());
	});
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

function resizeCanvas (data) {
	if(data !== null){
		var size = calculateSize(document.getElementById("paperSize").value, document.getElementById("paperDpi").value);
		resize(size[0], size[1], data);
	} else {
		resize(500, 500);
	}
}

function makePDF () {
	resizeCanvas(data);
	
	drawSheme (data);
	
	
	var paperSize = document.getElementById("paperSize").value;
	
	if (! /^[0-9]+([\.,][0-9]+)?x[0-9]+([\.,][0-9]+)?mm$/g.test(paperSize)){
		return;
	}
	
	inUpdate(function(){
	
		paperSize = paperSize.replace(/mm/g,"").split('x');

		var paperWidth  = Number(paperSize[1]);
		var paperHeight = Number(paperSize[0]);
	
		//var imageData = game.canvas.toDataURL();
		var doc = new jsPDF('l', 'mm', [paperWidth, paperHeight]);
	
		doc.addImage(game.canvas, 'JPEG', 0 ,0 ,paperWidth ,paperHeight);
		
		//var element1 = document.getElementById("pdfAble");
		
		/*html2canvas(element1, {
			onrendered: function(canvas) {
				doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, paperWidth, paperHeight);
			}
		});*/
		
		doc.addPage([paperWidth, paperHeight], 'portrait');
		/*doc.addHTML(document.body, function () {
			doc.save('wiper.pdf');
		});*/
		
		doc.setFont("helvetica");
		doc.setFontType("bold");
		doc.setFontSize(9);

		
        var source = $('#pdfAble')[0];

        // we support special element handlers. Register them with jQuery-style 
        // ID selector for either ID or node name. ("#iAmID", "div", "span" etc.)
        // There is no support for any other type of selectors 
        // (class, of compound) at this time.
        var specialElementHandlers = {
            // element with id of "bypass" - jQuery style selector
            '#bypassme': function (element, renderer) {
                // true = "handled elsewhere, bypass text extraction"
                return true;
            }
        };
		
        var margins = {
            top: 80,
            bottom: 60,
            left: 40,
            width: 522
        };
        // all coords and widths are in jsPDF instance's declared units
		
		/*
        doc.fromHTML(
            source, // HTML string or DOM elem ref.
            margins.left, // x coord
            margins.top, { // y coord
                'width': margins.width, // max width of content on PDF
                'elementHandlers': specialElementHandlers
            },

            function (dispose) {
                // dispose: object with X, Y of the last line add to the PDF 
                //          this allow the insertion of new lines after html
                doc.save('wiper.pdf');
            }, margins
        );*/
		
		
		doc.addHTML( $('#pdfAble')[0] , function() {
    		doc.save('filename.pdf');
		});
		
	});
}

function p1Next () {
	sectionOne().style.display = "none";
	sectionTwo().style.display = "block";
	sectionThree().style.display = "none";
}

function p2Previous (){
	sectionOne().style.display = "block";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "none";
}

function p2Next(){
	fillTable();
	sectionOne().style.display = "none";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "block";
}

function p3Previous(){
	sectionOne().style.display = "none";
	sectionTwo().style.display = "block";
	sectionThree().style.display = "none";
}

function p3Next(){
	sectionOne().style.display = "block";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "none";
}

function setPreviewImage(source){
	var img = document.getElementById("preview-image");
	img.src = source;
}