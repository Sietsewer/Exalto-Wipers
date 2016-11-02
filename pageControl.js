/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: true, mootools: false, prototypejs: false*/
/*jslint browser: true*/
/*globals limits, baseData*/

var sectionOne = 	function(){return document.getElementById("unitsSettings");};
var sectionTwo  = 	function(){return document.getElementById("windowSettings");};
var	sectionThree = 	function(){return document.getElementById("outputArea");};
var sectionFour   = function(){return document.getElementById("printArea");};
var data;

function getWindowData () {
	var wiperType = (document.getElementById("wiperType") || "").value;
	var height = Number((document.getElementById("windowHeight") || "").value);
	var width = Number((document.getElementById("windowTopWidth") || "").value);
	var centreDistance = Number((document.getElementById("windowCentreDistance") || "").value);
	var eyeLevel = document.getElementById("windowEyeLevel").value;
	
	var marginH  = Number((document.getElementById("marginH")  || "").value);
	var marginVT = Number((document.getElementById("marginVT") || "").value);
	var marginVB = Number((document.getElementById("marginVB") || "").value);
	var marginC  = Number((document.getElementById("marginC")  || "").value);
	var marginEyeLevel = Number((document.getElementById("marginEyeLevel") || "").value);
	
	var units = (document.getElementById("windowBulkheadThickness") || "").value;
	
	var isInches = (units === "inch");
	
	if(isInches){
		height /= 25.4;
		width /= 25.4;
		centreDistance /= 25.4;
		eyeLevel /= 25.4;
	
		marginH /= 25.4;
		marginVT /= 25.4;
		marginVB /= 25.4;
		marginC /= 25.4;
	}
	
	baseData.windowRaw.width = width;
	baseData.windowRaw.height = height
	baseData.windowRaw.centreDistance = centreDistance;
	baseData.windowRaw.marginH = marginH;
	baseData.windowRaw.marginVT = marginVT;
	baseData.windowRaw.marginVB = marginVB;
	baseData.windowRaw.marginC = marginC;
	baseData.windowRaw.wiperType = wiperType;
	baseData.windowRaw.eyeLevel = eyeLevel;
	baseData.windowRaw.eyeLevelMargin = marginEyeLevel;
	
	var aWidth = width - (marginH*2);
	var aHeight = height - marginVB - marginVT;
	var aCentreDistance = centreDistance + marginVT;
	var aMarginC = marginC;
	var isPantograph = wiperType === "pantograph";
	var aEyeLevel = eyeLevel - marginVT;
	
	if (!isFinite(eyeLevel) || (0 === Number(eyeLevel))){
		aEyeLevel = NaN;
	} else {
		if(aEyeLevel > aHeight){
			aEyeLevel = aHeight;
		} else if (aEyeLevel < 0){
			aEyeLevel = 0;
		}
	}
	
	baseData.window.width = aWidth;
	baseData.window.height = aHeight;
	baseData.window.centreDistance = aCentreDistance;
	baseData.window.marginC = aMarginC;
	baseData.window.isPantograph = isPantograph;
	baseData.window.eyeLevel = aEyeLevel;
	baseData.window.eyeLevelMargin = marginEyeLevel;
	
	baseData.meta.isInches = isInches;
}

	var filteredBladesMax = 0;


function fillTable (armLength, bladeLength, wipeAngle){
	
	getWindowData ();
	
	setWindowLimits();
	
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
	
	var myLimits = limits.definiteList();
	
	var fMotors = database.motors.where(function (a) {
		
		var fitType = (baseData.window.isPantograph && a.isPantograph) || (!baseData.window.isPantograph && a.isPendulum);
		
		var fitWindow = ((limits.window.bladeMin < a.bladeMax) &&
			(limits.window.bladeMin < a.bladeMax));
		
		var fitArm = !isFinite(limits.arm.armMin) || !isFinite(limits.arm.bladeMin) ||
			(a.armMax > limits.arm.armMin && a.bladeMax > limits.arm.bladeMin);
		
		var fitArmThickness = baseData.window.isPantograph ? ((limits.arm.hoh === 0) || (limits.arm.hoh === null) || (!isFinite(limits.arm.hoh)) || (limits.arm.hoh === a.hoh)) : true;
			
			
		var fitBlade = !isFinite(limits.blade.bladeLength) || limits.blade.bladeLength <= a.bladeMax;
		
		return fitType && fitWindow && fitArm && fitBlade && fitArmThickness;
		/*
		if(myLimits.bladeLength){
			return a.bladeMax <= myLimits.bladeLength;
		}
		return myLimits.armMin < a.bladeMax;*/
	});
	
	var fBlades = processBlades ();
	
	
	fBlades.forEach(function (e) {
		if (e.length > filteredBladesMax){
			filteredBladesMax = e.length;
		}
	});
	
	var fArms = database.arms.where(function (a) {
		var fitType = baseData.window.isPantograph === a.isPantograph;
		var fitWindow =
			((limits.window.armMax > a.lengthMin) &&
			(limits.window.armMin < a.lengthMax) &&
			(limits.window.bladeMax > a.bladeLengthMin) &&
			(limits.window.bladeMin < a.bladeLengthMax));
		
		var fitMotor =!isFinite(limits.motor.armMax) || !isFinite(limits.motor.bladeMax) || !isFinite(limits.motor.hoh) ||
			(a.lengthMin < limits.motor.armMax && a.bladeLengthMin < limits.motor.bladeMax && a.hoh === limits.motor.hoh);
		
		var fitBlade = !isFinite(limits.blade.bladeLength) || !isFinite(limits.blade.maxArmLength) || !isFinite(limits.blade.minArmLength) || ((a.bladeLengthMin <= limits.blade.bladeLength) && (limits.blade.bladeLength <= a.bladeLengthMax) && (a.lengthMin <= limits.blade.maxArmLength) && a.lengthMax > limits.blade.minArmLength);
		
		return fitWindow && fitMotor && fitBlade && fitType && (filteredBladesMax > a.bladeLengthMin);

	});
	
	
	
	// Filter tables based on data
	/*var fArms = database.arms.where(function (a) {
		return a.lengthMax >= data.armLenth &&
			a.lengthMin <= data.armLenth &&
			a.bladeLengthMax >= data.bladeLength &&
			a.bladeLengthMin <= data.bladeLength &&
			a.applType === (data.inputData.windowData.wiperType === "pendulum" ? "enkel" : "parallel");
	});
	var fBlades = data.blades; //database.blades.where(function (a) {
		//return a.length === data.bladeLength;
	//});
	var fMotors = database.motors.where(function (a) {
		return a.armMax >= data.armLenth && a.bladeMax >= data.bladeLength;
	});*/
	
	// Clear table
	document.getElementById("arms").innerHTML   = "";
	document.getElementById("blades").innerHTML = "";
	document.getElementById("motors").innerHTML = "";

	var onBladesClick = function(cont) {
		if(cont.value === "0"){
			limits.blade.bladeLength = NaN;
			limits.blade.maxArmLength = NaN;
			limits.blade.minArmLength = NaN;
		} else {
			limits.blade.bladeLength = cont.myData.length;
			limits.blade.maxArmLength = maxArmForBlade(cont.myData.length);
			limits.blade.minArmLength = minArmForBlade(cont.myData.length);
			
			var maxArmEL = baseData.window.eyeLevel + (((baseData.window.eyeLevelMargin/100) * cont.myData.length)/2) + baseData.window.centreDistance;
	
			var minArmEL = baseData.window.eyeLevel - (((baseData.window.eyeLevelMargin/100) * cont.myData.length)/2) + baseData.window.centreDistance;
	
			limits.blade.maxArmLength = limits.blade.maxArmLength > maxArmEL ? maxArmEL : limits.blade.maxArmLength;
			limits.blade.minArmLength = limits.blade.minArmLength < minArmEL ? minArmEL : limits.blade.minArmLength;

			
			
		}
		
		//var md = cont.myData;
		//fillTable(md.optimalArmLength, md.length, md.wipeAngle * 57.295780181884765625);
	};
	
	var onArmsClick = function(cont) {
		if(cont.value === "0"){
			limits.arm.armMax = Number.NEGATIVE_INFINITY;
			limits.arm.armMin = Number.POSITIVE_INFINITY;
			limits.arm.bladeMax = Number.NEGATIVE_INFINITY;
			limits.arm.bladeMin = Number.POSITIVE_INFINITY;
			limits.arm.hoh = null;
			limits.arm.centreMounted = null;
		} else {
			limits.arm.armMax = cont.myData.lengthMax;
			limits.arm.armMin = cont.myData.lengthMin;
			limits.arm.bladeMax = cont.myData.bladeLengthMax;
			limits.arm.bladeMin = cont.myData.bladeLengthMin;
			limits.arm.hoh = cont.myData.hoh;
			limits.arm.centreMounted = cont.myData.centreMounted;
		}
	}
	
	var onMotorClick = function(cont) {
		if(cont.value === "0"){
			limits.motor.armMax = Number.NEGATIVE_INFINITY;
			limits.motor.bladeMax = Number.NEGATIVE_INFINITY;
			limits.motor.angleMax = Number.NEGATIVE_INFINITY;
			limits.motor.angleMin = Number.POSITIVE_INFINITY;
			limits.motor.angleStages = null;
			limits.motor.hoh = null;
		} else {
			limits.motor.armMax = cont.myData.armMax;
			limits.motor.bladeMax = cont.myData.bladeMax;
			limits.motor.angleMax = cont.myData.angleMax;
			limits.motor.angleMin = cont.myData.angleMin;
			limits.motor.angleStages = cont.myData.angleStep;
			limits.motor.hoh = cont.myData.hoh;
		}
	}
	
	// Recreate tables
	buildTable (fArms, ["range", "name", "lengthMin", "lengthMax", "bladeLengthMin", "bladeLengthMax", "hoh"], ["Range", "Art. Nr.", "Arm Min.", "Arm Max.", "Blade Min.", "Blade Max.", "Centre Distance"], "arms", null, onArmsClick);
	
	
	buildTable (fBlades, ["range", "artNr", "length", "optimalArmLength", "wipeAngle", "wipePercentage"], ["Range", "Art. Nr.", "Length", "Optimal Arm Length", "Wipe Angle", "Wipe Percentage"], "blades", [null,null,null, function (val) {return SizeNotation(Number(val));}, function(val){return Math.round((Number(Number(val) * 57.295780181884765625)) * 10) / 10 + "°";}, function(val){return (Math.round(Number(val) * 10000) / 100)+"%";}], onBladesClick);

	buildTable (fMotors, ["range", "name", "hoh", "armMax", "bladeMax", "angleMin", "angleMax", "angleStep"], ["Range", "Art. Nr.", "Centre Distance", "Arm Max", "Blade Max", "Min. Angle", "Max. Angle", "Angle Step"], "motors", null, onMotorClick);
	
	resizeCanvas(null);
	drawSheme (data);
	
	inUpdate(function(){
		setPreviewImage(game.canvas.toDataURL());
	});
}

function setWindowLimits () {
	var maxBladeLength;
	if (baseData.window.centreDistance - baseData.window.marginC < 0){
		maxBladeLength = baseData.window.height + (baseData.window.centreDistance - baseData.window.marginC);
	} else {
		maxBladeLength = baseData.window.height;
	}
	
	var minBladeLength = limits.database.bladeMin;
	
	var maxArmLength = baseData.window.height - (minBladeLength/2) + baseData.window.centreDistance;
	
	var minArmLength; 
	if(baseData.window.centreDistance < baseData.window.marginC){
		minArmLength = (minBladeLength/2) + baseData.window.marginC;
	} else {
		minArmLength = (minBladeLength/2) + baseData.window.centreDistance;
	}
	
	// for eyeLevel
	
	var maxArmEL = baseData.window.eyeLevel + (((baseData.window.eyeLevelMargin/100) * limits.database.bladeMax)/2) + baseData.window.centreDistance;
	
	var minArmEL = baseData.window.eyeLevel - (((baseData.window.eyeLevelMargin/100) * limits.database.bladeMax)/2) + baseData.window.centreDistance;
	
	maxArmLength = maxArmLength > maxArmEL ? maxArmEL : maxArmLength;
	minArmLength = minArmLength < minArmEL ? minArmEL : minArmLength;
	
	
	limits.window.armMax = maxArmLength;
	limits.window.armMin = minArmLength;
	limits.window.bladeMax = maxBladeLength;
	limits.window.bladeMin = minBladeLength;
}

function changedChoices () {
	fillTable();
}

function maxArmForBlade(length){
	return baseData.window.height + baseData.window.centreDistance - (length/2);
}

function minArmForBlade (length){
	if(baseData.window.centreDistance - baseData.window.marginC > 0){
		return (length/2) + baseData.window.centreDistance;
	} else {
		return (length/2) + baseData.window.marginC;
	}
}

var selectedRadioInTables = {};

function buildTable (data, headers, labels, tableID, functions, radioButtons) {
	var table;
	if (typeof tableID === "string"){
		table = document.getElementById(tableID);
	} else {
		table = tableID;
	}
	
	var thead = document.createElement("thead");
	
	var row = document.createElement("tr");
	
	if(radioButtons){		
		var radioHead = document.createElement("th");
		var headButton = document.createElement("input");
		headButton.type = "radio";
		headButton.name = tableID;
		headButton.value = "0";
		headButton.myData = null;
		headButton.onclick = function(){
				selectedRadioInTables[this.name] = this.value;
				radioButtons(this);
				changedChoices ();
			};
		
		if(selectedRadioInTables[tableID] === undefined || selectedRadioInTables[tableID] === "0"){
			headButton.checked = true;
			selectedRadioInTables[tableID] = "0";
		}
		
		radioHead.appendChild(headButton);
		row.appendChild(radioHead);
	}
	
	for (var k = 0; k < headers.length; k++) { // Iterate over columns
		var label = document.createElement("th");
		label.textContent = labels[k];
		row.appendChild(label);
	}
	thead.appendChild(row);
	table.appendChild(thead);
	
	var tbody = document.createElement("tbody");

	for (var i = 0; i < data.length; i++){ // Iterate over rows
		
		
		row = document.createElement("tr");
		
		if(radioButtons){
			
			var rc = document.createElement("td");
			var button = document.createElement("input");
			button.type = "radio";
			button.name = tableID;
			button.value = data[i].uid;
			button.myData = data[i];
			button.onclick = function(){
				selectedRadioInTables[this.name] = this.value;
				radioButtons(this);
				changedChoices ();
			};
			if(selectedRadioInTables[tableID] === button.value){
				button.checked = true;
			}
			rc.appendChild(button);
			row.appendChild(rc);
		}
		
		for (var j = 0; j < headers.length; j++) { // Iterate over columns
			var cell = document.createElement("td");
			var dataRow = data[i];
			var header = headers[j];
			cell.textContent = dataRow[header];
			if(functions !== null && functions !== undefined && functions[j] !== null && functions[j] !== undefined){
				cell.textContent = functions[j](cell.textContent);
			}
			row.appendChild(cell);
		}
		tbody.appendChild(row);
	}
	table.appendChild(tbody);
	sorttable.makeSortable(table);

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
		resize(700, 700);
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

		var paperWidth  = Number(paperSize[1] * 2.83465);
		var paperHeight = Number(paperSize[0] * 2.83465);
	
		//var imageData = game.canvas.toDataURL();
		var doc = new jsPDF('l', 'pt', [paperWidth, paperHeight]);
	
		doc.addFont('arial', 'arial', 'normal');
		
		doc.setFont("arial");
		
		doc.addImage(game.canvas, 'JPEG', 0 ,0 ,paperWidth ,paperHeight);
		
		doc.addPage([paperWidth, paperHeight], 'portrait');
		
		var res1 = doc.autoTableHtmlToJson(document.getElementById("arms"));
		
		doc.addImage(logoDataURL, 'PNG', 100, 5, 0, 0);
		
		doc.autoTable (res1.columns, res1.data,
		{
			startY:100,
			styles: {
				font: 'arial',
				pageBreak: 'avoid',
				textColor: [8, 40, 51],
				fillColor: [255,255,255]
			},
			headerStyles: {
				fillColor: [8,40,51],
				textColor: [255,255,255]
			}
		});
		
		var res2 = doc.autoTableHtmlToJson(document.getElementById("blades"));

		doc.autoTable (res2.columns, res2.data,
		{
			startY: doc.autoTableEndPosY() + 30,
			styles: {
				font: 'arial',
				pageBreak: 'avoid',
				textColor: [8, 40, 51],
				fillColor: [255,255,255]
			},
			headerStyles: {
				fillColor: [8,40,51],
				textColor: [255,255,255]
			}
		});
		
		var res3 = doc.autoTableHtmlToJson(document.getElementById("motors"));
		
		doc.autoTable (res3.columns, res3.data,
		{
			startY: doc.autoTableEndPosY() + 30,
			pageBreak: 'avoid',
			styles: {
				font: 'arial',
				textColor: [8, 40, 51],
				fillColor: [255,255,255]
			},
			headerStyles: {
				fillColor: [8,40,51],
				textColor: [255,255,255]
			}
		});
		
		doc.save('wiper.pdf');
	});
}

function showError (element){
	element.style.display = "block";
}

function inputError () {
	// hide all messages
	
	var errHeightSmall = document.getElementById("window-height-error-small");
	var errHeightLarge = document.getElementById("window-height-error-large");
	var errWidthSmall = document.getElementById("window-width-error-small");
	var errWidthLarge = document.getElementById("window-width-error-large");
	var errOffsetSmall = document.getElementById("window-offset-error-small");
	var errOffsetLarge = document.getElementById("window-offset-error-large");
	var errEyelevelSmall = document.getElementById("window-eyelevel-error-small");
	var errEyeLevelLarge = document.getElementById("window-eyelevel-error-large");
	
	errHeightSmall.style.display = "none";
	errHeightLarge.style.display = "none";
	errWidthSmall.style.display = "none";
	errWidthLarge.style.display = "none";
	errOffsetSmall.style.display = "none";
	errOffsetLarge.style.display = "none";
	errEyelevelSmall.style.display = "none";
	errEyeLevelLarge.style.display = "none";
	
	var errored = false;
	
	var isMM = document.getElementById("units").value === "mm" ? true : document.getElementById("units").value === "inch" ? false : null; 
	
	// height
	var wh = isMM ? Number(document.getElementById("windowHeight").value) : Number(document.getElementById("windowHeight").value * 25.4);
	
	if(wh <= 200){
		showError(errHeightSmall);
		errored = true;
	} else if (wh >= 2*(limits.database.armMax + (limits.database.bladeMax/2))) {
		showError(errHeightLarge);
		errored = true;
	}
	
	// width
	var ww = isMM ? Number(document.getElementById("windowTopWidth").value) : Number(document.getElementById("windowTopWidth").value * 25.4);
	
	if(ww >= (wh * 10)){
		showError(errWidthLarge);
		errored = true;
	} else if (ww <= wh/4){
		showError(errWidthSmall);
		errored = true;
	}
	
	// offset
	var wc = isMM ? Number(document.getElementById("windowCentreDistance").value) : Number(document.getElementById("windowCentreDistance").value * 25.4);
	
	if (wc >= wh/2) {
		showError(errOffsetLarge);
		errored = true;
	} else if (wc <= 0 - (wh * 0.75)) {
		showError(errOffsetSmall);
		errored = true;
	}
	
	// eyelevel
	var we = isMM ? Number(document.getElementById("windowEyeLevel").value) : Number(document.getElementById("windowEyeLevel").value * 25.4);
	
	if ((we !== 0) && (we < limits.database.bladeMin)){
		showError(errEyelevelSmall);
		errored = true;
	} else if ((we !== 0) && we > wh - limits.database.bladeMin) {
		showError(errEyeLevelLarge);
		errored = true;
	}
	
	
	return errored;
}

function p1Next () {
	sectionOne().style.display = "none";
	sectionTwo().style.display = "block";
	sectionThree().style.display = "none";
	sectionFour().style.display = "none";
}

function p2Previous (){
	sectionOne().style.display = "block";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "none";
	sectionFour().style.display = "none";
}

function p2Next(){
	if(!inputError()){
		fillTable();
		sectionOne().style.display = "none";
		sectionTwo().style.display = "none";
		sectionThree().style.display = "block";
		sectionFour().style.display = "none";
	}
}

function p3Previous(){
	sectionOne().style.display = "none";
	sectionTwo().style.display = "block";
	sectionThree().style.display = "none";
	sectionFour().style.display = "none";
	resetLimits();
	selectedRadioInTables ={};
	resetLimits();
}

function p3Next(){
	sectionOne().style.display = "none";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "none";
	sectionFour().style.display = "block";
}

function p4Previous(){
	sectionOne().style.display = "none";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "block";
	sectionFour().style.display = "none";
}

function p4Next(){
	sectionOne().style.display = "block";
	sectionTwo().style.display = "none";
	sectionThree().style.display = "none";
	sectionFour().style.display = "none";
	resetLimits();
	selectedRadioInTables ={};
	resetLimits();
}

function setPreviewImage(source){
	var img = document.getElementById("preview-image");
	img.src = source;
}

function tableToJson(table) {
    var data = [];

    // first row needs to be headers
    var headers = [];
	
	var actualHeaders = [];
	
    for (var ii=0; ii<table.rows[0].cells.length; ii++) {
        headers[ii] = table.rows[0].cells[ii].innerHTML.toLowerCase().replace(/ /gi,'');
		actualHeaders[ headers [ii] ] = table.rows[0].cells[ii].innerHTML;
    }
	
	data.push(actualHeaders);
	
    // go through cells
    for (var i=1; i<table.rows.length; i++) {

        var tableRow = table.rows[i];
        var rowData = {};

        for (var j=0; j<tableRow.cells.length; j++) {

            rowData[ headers[j] ] = tableRow.cells[j].innerHTML;

        }

        data.push(rowData);
    }       
    return data;
}

var logoDataURL =  "data:image/png;base64,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";