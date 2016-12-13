/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: true, mootools: false, prototypejs: false*/
/*jslint browser: true*/
/*globals limits, baseData, database, resetLimits, SizeNotation, databaseLoaded, computeWiperset,calcCombo, processBlades,drawSheme, inUpdate, game, sorttable, resize, jsPDF*/

var sectionOne = 	function(){return document.getElementById("unitsSettings");};
var sectionTwo  = 	function(){return document.getElementById("windowSettings");};
var	sectionThree = 	function(){return document.getElementById("outputArea");};
var sectionFour   = function(){return document.getElementById("printArea");};
var data;

var selectedParts = {arm:null, blade:null, motor:null};

var allowLDParts = false;//document.getElementById("allowLDParts").checked;
						
function onAllowLDPartsChanged () {
	allowLDParts = document.getElementById("allowLDParts").checked;
	databaseLoaded(); // reload database to filter out LD
}


var showAllParts = false; //document.getElementById("outputAllParts").checked;
						
function onShowAllPartsChanged () {
	showAllParts = document.getElementById("outputAllParts").checked;
	resetLimits();
	selectedRadioInTables ={};
	resetLimits();
	fillTable();
	if (!showAllParts){
	selectAllFirst();
	}
}


function locationChanged () {
	var e = document.getElementById("location");
	
								
	var t = document.getElementById("labelVMarginTop"); // Vertical Margin Top
	var b = document.getElementById("labelVMarginBottom"); // Vertical Margin Bottom
	
	if(e.value === "top"){
		t.innerHTML = "Vertical Margin Top";
		b.innerHTML = "Vertical Margin Bottom";
	} else {
		t.innerHTML = "Vertical Margin Bottom";
		b.innerHTML = "Vertical Margin Top  ";
	}
}











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
	
	var units = (document.getElementById("units") || "").value;
	
	var isInches = (units === "inch");
	
	if(isInches){
		height *= 25.4;
		width *= 25.4;
		centreDistance *= 25.4;
		eyeLevel *= 25.4;
	
		marginH *= 25.4;
		marginVT *= 25.4;
		marginVB *= 25.4;
		marginC *= 25.4;
	}
	
	baseData.windowRaw.width = width;
	baseData.windowRaw.height = height;
	baseData.windowRaw.centreDistance = centreDistance;
	baseData.windowRaw.marginH = marginH;
	baseData.windowRaw.marginVT = marginVT;
	baseData.windowRaw.marginVB = marginVB;
	baseData.windowRaw.marginC = marginC;
	baseData.windowRaw.wiperType = wiperType;
	baseData.windowRaw.eyeLevel = eyeLevel;
	baseData.windowRaw.eyeLevelMargin = marginEyeLevel;
	
	if ((document.getElementById("location").value === "bottom") && !((baseData.windowRaw.eyeLevel === 0) || (baseData.windowRaw.eyeLevel === "0") || (baseData.windowRaw.eyeLevel === "")|| (baseData.windowRaw.eyeLevel !== null))) {
		baseData.windowRaw.eyeLevel = baseData.windowRaw.height - baseData.windowRaw.eyeLevel;
		eyeLevel = baseData.windowRaw.eyeLevel;
	}
	
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
	
	var combinations = [];
	var maxPercentile = [];
	var maxComboPercentage = 0;
	if(!showAllParts){
		var arms = database.arms.where(
			function (a){
				return ((limits.window.armMax > a.lengthMin) &&
			(limits.window.armMin < a.lengthMax) &&
			(limits.window.bladeMax > a.bladeLengthMin) &&
			(limits.window.bladeMin < a.bladeLengthMax)) && (a.isPantograph === baseData.window.isPantograph);
			});
		var blades = database.blades.where(
			function (e) {
				return (e.length >= limits.window.bladeMin) && (e.length <= limits.window.bladeMax); 
			}
		);
		var motors = database.motors.where(
			function (a){
				return ((limits.window.bladeMin < a.bladeMax) &&
			(limits.window.bladeMin < a.bladeMax)) && ((a.isPendulum && !baseData.window.isPantograph) || (a.isPantograph && baseData.window.isPantograph));
			}
		);
		for(var a = 0; a < arms.length; a++){
			for (var b = 0; b < blades.length; b++){
				for (var m = 0; m < motors.length; m++){
					var arm = arms[a];
					var blade = blades[b];
					var motor = motors[m];
					var enter = true;
					
					var fitHoh = (!baseData.window.isPantograph ||( motor.hoh === arm.hoh));
					
					var fitWindowMax = (arm.lengthMin + (blade.length/2)) <= baseData.window.height + baseData.window.centreDistance;
					if(!fitWindowMax || !fitHoh){
						enter = false;
					}
					
					var mL = (blade.length / 2) - arm.bladeLengthMax;
					
					if(mL > -baseData.window.marginC){
						enter = false;
					}
					
					if (mL > -baseData.window.centreDistance){
						enter = false;
					}
					
					if ((blade.length > arm.bladeLengthMax) || (blade.length < arm.bladeLengthMin)){
						enter = false;
					}
					
					if (arm.lengthMin > motor.armMax) {
						enter = false;
					}
					
					var maxArmEL = baseData.window.eyeLevel + (((baseData.window.eyeLevelMargin/100) * blade.length)/2) + baseData.window.centreDistance;
	
					var minArmEL = baseData.window.eyeLevel - (((baseData.window.eyeLevelMargin/100) * blade.length)/2) + baseData.window.centreDistance;
					
					if ((minArmEL + (blade.length/2)) > baseData.window.height + baseData.window.centreDistance ){
						enter = false;
					}
					
					if ((arm.lengthMin > maxArmEL) || (arm.lengthMax < minArmEL)){
						enter = false;
					}
					
					if (blade.length > motor.bladeMax) {
						enter = false;
					}
					
					if (enter){
						var out = {};
						out.arm = arm;
						out.blade = blade;
						out.motor = motor;
						combinations.push(out);
					}
				}
			}
		}
		
		for (var i = 0; i < combinations.length; i++){
		combinations[i] = calcCombo(combinations[i]);
		if (combinations[i].wipePercentage > maxComboPercentage){
			maxComboPercentage = combinations[i].wipePercentage;
			maxPercentile = [];
		}
		if (combinations[i].wipePercentage === maxComboPercentage){
			maxPercentile.push(combinations[i]);
		}
	}
	}
	
	
	
	

	
	
	var fBlades = processBlades ();
	
	var avgCount = 0;
	var maxPercentage = 0;
	
	fBlades.forEach(function (e) {
		if (e.length > filteredBladesMax){
			filteredBladesMax = e.length;
		}
		if(e.wipePercentage > maxPercentage){
			maxPercentage = e.wipePercentage;
		}
		avgCount += e.wipePercentage;
		
	});
	
	if (!showAllParts){
	fBlades = database.blades.where(function (e) {
		//return e.wipePercentage === maxPercentage;
		
		for(var i = 0; i < maxPercentile.length; i++){
			if(e.uid === maxPercentile[i].blade.uid){
				return true;
			}
		}
		
		return false;
	});
	}
	
	var avgPercentage = avgCount / fBlades.length;

	var fArms;
	if (showAllParts){

	fArms = database.arms.where(function (a) {
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
	} else { 
		fArms = database.arms.where(function (e) {
		 for(var i = 0; i < maxPercentile.length; i++){
			if(e.uid === maxPercentile[i].arm.uid){
				return true;
			}
		}
		
		return false;
	});
	}
	
	var fMotors;
	
	if (showAllParts){
	
	fMotors = database.motors.where(function (a) {
		
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
	
	} else {
		
		fMotors = database.motors.where(function (a) {

		for(var i = 0; i < maxPercentile.length; i++){
			if(a.uid === maxPercentile[i].motor.uid){
				return true;
			}
		}
		
		return false;
		});
	}
	
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
			selectedParts.blade = null;
			limits.blade.bladeLength = NaN;
			limits.blade.maxArmLength = NaN;
			limits.blade.minArmLength = NaN;
		} else {
			selectedParts.blade = cont.myData;
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
			selectedParts.arm = null;
			limits.arm.armMax = Number.NEGATIVE_INFINITY;
			limits.arm.armMin = Number.POSITIVE_INFINITY;
			limits.arm.bladeMax = Number.NEGATIVE_INFINITY;
			limits.arm.bladeMin = Number.POSITIVE_INFINITY;
			limits.arm.hoh = null;
			limits.arm.centreMounted = null;
		} else {
			selectedParts.arm = cont.myData;
			limits.arm.armMax = cont.myData.lengthMax;
			limits.arm.armMin = cont.myData.lengthMin;
			limits.arm.bladeMax = cont.myData.bladeLengthMax;
			limits.arm.bladeMin = cont.myData.bladeLengthMin;
			limits.arm.hoh = cont.myData.hoh;
			limits.arm.centreMounted = cont.myData.centreMounted;
		}
	};
	
	var onMotorClick = function(cont) {
		if(cont.value === "0"){
			selectedParts.motor = null;
			limits.motor.armMax = Number.NEGATIVE_INFINITY;
			limits.motor.bladeMax = Number.NEGATIVE_INFINITY;
			limits.motor.angleMax = Number.NEGATIVE_INFINITY;
			limits.motor.angleMin = Number.POSITIVE_INFINITY;
			limits.motor.angleStages = null;
			limits.motor.hoh = null;
		} else {
			selectedParts.motor = cont.myData;
			limits.motor.armMax = cont.myData.armMax;
			limits.motor.bladeMax = cont.myData.bladeMax;
			limits.motor.angleMax = cont.myData.angleMax;
			limits.motor.angleMin = cont.myData.angleMin;
			limits.motor.angleStages = cont.myData.angleStep;
			limits.motor.hoh = cont.myData.hoh;
		}
	};
	
	// Recreate tables
	buildTable (fArms, ["range", "name", "lengthMin", "lengthMax", "bladeLengthMin", "bladeLengthMax", "hoh"], ["Range", "Art. Nr.", "Arm Min.", "Arm Max.", "Blade Min.", "Blade Max.", "Centre Distance"], "arms",
	[null,
	null,
	function (val) {return SizeNotation(Number(val));},
	function (val) {return SizeNotation(Number(val));},
	function (val) {return SizeNotation(Number(val));},
	function (val) {return SizeNotation(Number(val));},
	function (val) {return SizeNotation(Number(val), true);}], onArmsClick);
	
	
	buildTable (fBlades, ["range", "artNr", "length", "optimalArmLength", "wipeAngle", "wipePercentage"], ["Range", "Art. Nr.", "Length", "Optimal Arm Length", "Wipe Angle", "Wipe Percentage"], "blades", [null,
	null,
	function (val) {
		return SizeNotation(Number(val));
	}, function (val) {
		return SizeNotation(Number(val));
	}, function(val){
		return Math.round((Number(Number(val) * 57.295780181884765625)) * 10) / 10 + "°";
	}, function(val){
		var content = (Math.round(Number(val) * 10000) / 100)+"%";
		if(val < avgPercentage){
			return content;
		}var deviation = 0;
		if (maxPercentage > 0.15){
			deviation = 0.1;
		}
		var element = "";
		if (val >(maxPercentage - deviation)){
			element = document.createElement("b");
			element.textContent = content;
		} else {element = document.createElement("i");
				element.textContent = content;
			   }return element;
	}], onBladesClick);

	buildTable (fMotors, ["range", "name", "hoh", "armMax", "bladeMax", "angleMin", "angleMax", "angleStep"], ["Range", "Art. Nr.", "Centre Distance", "Arm Max", "Blade Max", "Min. Angle", "Max. Angle", "Angle Step"], "motors", [null,null,function (val) {return SizeNotation(Number(val), true);}, function (val) {return SizeNotation(Number(val));},function (val) {return SizeNotation(Number(val));},function(val){
		return val + "°";
	},function(val){
		return val + "°";
	},function(val){
		return val + "°";
	}], onMotorClick);
	
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

var tables = {};

function buildTable (data, headers, labels, tableID, functions, radioButtons) {
	var table;
	tables[tableID] = [];
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

	var func = function(){
				selectedRadioInTables[this.name] = this.value;
				radioButtons(this);
				changedChoices ();
			};
	
	for (var i = 0; i < data.length; i++){ // Iterate over rows
		
		
		row = document.createElement("tr");
		
		if(radioButtons){
			
			var rc = document.createElement("td");
			var button = document.createElement("input");
			button.type = "radio";
			button.name = tableID;
			button.value = data[i].uid;
			button.myData = data[i];
			button.id = data[i].uid;
			tables[tableID].push(button.id);
			button.onclick = func;
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
				var content = functions[j](cell.textContent);
				if((typeof content === "string") || (typeof content === "number")){
					cell.textContent = functions[j](cell.textContent);
				} else {
					cell.textContent = "";
					cell.appendChild(content);
				}
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
		resize(600, 600);
	}
}

function filterTable (table, part, index){
	var theOne1;
	for (var i1 = 0; i1 < table.data.length; i1++){
		if(table.data[i1][index] === String(part)){
			theOne1 = table.data[i1];
		}
	}
	table.data = [];
	table.rows = [];
	table.data.push(theOne1);
	table.rows.push(theOne1);
	return table;
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
		
		if(document.getElementById('pdf-include-table').checked){
		doc.addPage([paperWidth, paperHeight], 'portrait');
		
		var res1 = doc.autoTableHtmlToJson(document.getElementById("arms"));
			
		res1 = filterTable(res1, selectedParts.arm.name, 2);
			
		doc.addImage(logoDataURL, 'JPG', 100, 20, 171, 68.5);
		
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

		res2 = filterTable(res2, selectedParts.blade.artNr, 2);
			
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
			
		res3 = filterTable(res3, selectedParts.motor.name, 2);
			
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
		}
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
	
	var isMM = (document.getElementById("units") || "").value === "mm" ? true : (document.getElementById("units").value === "inch" ? false : null); 
	
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

function selectAllFirst(){
	if (showAllParts){
		return;
	}
	
	document.getElementById(tables.blades[0]).onclick();
	document.getElementById(tables.arms[0]).onclick();
	document.getElementById(tables.motors[0]).onclick();

			
		// here
		
		// Have every first element of the tables selected, sequentially.
		
		
		
		
}

function p2Next(){
	if(!inputError()){
		resetLimits();
		fillTable();

		selectAllFirst();
		
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

var LastUnits = "mm";

function unitsChange(){
    if (document.getElementById("units").value !== LastUnits){
    if((document.getElementById("units") || "").value === "mm"){
        
        document.getElementById("marginH").value  = Number((document.getElementById("marginH")  || "").value) * 25.4;
        document.getElementById("marginVT").value = Number((document.getElementById("marginVT") || "").value) * 25.4;
        document.getElementById("marginVB").value = Number((document.getElementById("marginVB") || "").value) * 25.4;
        document.getElementById("marginC").value  = Number((document.getElementById("marginC")  || "").value) * 25.4;
        document.getElementById("windowHeight").value  = Number((document.getElementById("windowHeight")  || "").value) * 25.4;
        document.getElementById("windowTopWidth").value  = Number((document.getElementById("windowTopWidth")  || "").value) * 25.4;
        document.getElementById("windowCentreDistance").value  = Number((document.getElementById("windowCentreDistance")  || "").value) * 25.4;
        document.getElementById("windowEyeLevel").value  = Number((document.getElementById("windowEyeLevel")  || "").value) * 25.4;

    } else {
        document.getElementById("marginH").value  = Number((document.getElementById("marginH")  || "").value) / 25.4;
        document.getElementById("marginVT").value = Number((document.getElementById("marginVT") || "").value) / 25.4;
        document.getElementById("marginVB").value = Number((document.getElementById("marginVB") || "").value) / 25.4;
        document.getElementById("marginC").value  = Number((document.getElementById("marginC")  || "").value) / 25.4;
        document.getElementById("windowHeight").value  = Number((document.getElementById("windowHeight")  || "").value) / 25.4;
        document.getElementById("windowTopWidth").value  = Number((document.getElementById("windowTopWidth")  || "").value) / 25.4;
        document.getElementById("windowCentreDistance").value  = Number((document.getElementById("windowCentreDistance")  || "").value) / 25.4;
        document.getElementById("windowEyeLevel").value  = Number((document.getElementById("windowEyeLevel")  || "").value) / 25.4;

    }
        LastUnits = document.getElementById("units").value;
    }
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

var logoDataURL =  "data:image/jpeg;base64,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AAMAAAAAUmQgIGRvdWJAb+AAAAAAAAAAAABHcm4gZG91YkBv4AAAAAAAAAAAAEJsICBkb3ViQG/gAAAAAAAAAAAAQnJkVFVudEYjUmx0AAAAAAAAAAAAAAAAQmxkIFVudEYjUmx0AAAAAAAAAAAAAAAAUnNsdFVudEYjUHhsQFIAAAAAAAAAAAAKdmVjdG9yRGF0YWJvb2wBAAAAAFBnUHNlbnVtAAAAAFBnUHMAAAAAUGdQQwAAAABMZWZ0VW50RiNSbHQAAAAAAAAAAAAAAABUb3AgVW50RiNSbHQAAAAAAAAAAAAAAABTY2wgVW50RiNQcmNAWQAAAAAAAAAAABBjcm9wV2hlblByaW50aW5nYm9vbAAAAAAOY3JvcFJlY3RCb3R0b21sb25nAAAAAAAAAAxjcm9wUmVjdExlZnRsb25nAAAAAAAAAA1jcm9wUmVjdFJpZ2h0bG9uZwAAAAAAAAALY3JvcFJlY3RUb3Bsb25nAAAAAAA4QklNA+0AAAAAABAASAAAAAEAAgBIAAAAAQACOEJJTQQmAAAAAAAOAAAAAAAAAAAAAD+AAAA4QklNBA0AAAAAAAQAAAAeOEJJTQQZAAAAAAAEAAAAHjhCSU0D8wAAAAAACQAAAAAAAAAAAQA4QklNJxAAAAAAAAoAAQAAAAAAAAACOEJJTQP1AAAAAABIAC9mZgABAGxmZgAGAAAAAAABAC9mZgABAKGZmgAGAAAAAAABADIAAAABAFoAAAAGAAAAAAABADUAAAABAC0AAAAGAAAAAAABOEJJTQP4AAAAAABwAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAADhCSU0EAAAAAAAAAgAAOEJJTQQCAAAAAAACAAA4QklNBDAAAAAAAAEBADhCSU0ELQAAAAAABgABAAAAAjhCSU0ECAAAAAAAEAAAAAEAAAJAAAACQAAAAAA4QklNBB4AAAAAAAQAAAAAOEJJTQQaAAAAAANjAAAABgAAAAAAAAAAAAAAiQAAAVYAAAAXAGwAbwBnAG8AXwB3AGkAcABlAHIAXwB0AGUAYwBoAG4AbwBsAG8AZwBpAGUA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zRkY/wBVsmjJueA/IGMGO95h732Nr3fnbrEtVP8A/9kAOEJJTQQhAAAAAABdAAAAAQEAAAAPAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwAAAAFwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAgAEMAQwAgADIAMAAxADUAAAABADhCSU0EBgAAAAAABwAIAAAAAQEA/+EQ4Wh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMwNjcgNzkuMTU3NzQ3LCAyMDE1LzAzLzMwLTIzOjQwOjQyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0idXVpZDo4MEYyNjU2RTZCMkFERTExOTlEMkQ3RDk0QTE4Qzk2QSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk5OTljMjc2LWE1YmEtMTFlNi04OTFhLWQ3MmUzZTA1YWI1YSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0YmI2MDY5YS0xOWQ3LWVhNDgtYWJjMC04NmFiYWQzMGE1NDAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxNi0xMS0wOFQxMzozMDozOCswMTowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTYtMTEtMDhUMTQ6NTI6NDErMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTYtMTEtMDhUMTQ6NTI6NDErMDE6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjY3ZjdhMWZjLWE2ODgtMmE0Yi1hMjJjLTRmNjI1NmJhZWQyOCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFNDE3NTg5RjdBNDQxMUU2QTM5MERBMzI2RTdBNjU5MSIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ1dWlkOjgwRjI2NTZFNkIyQURFMTE5OUQyRDdEOTRBMThDOTZBIi8+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmIxNDllNTIxLTViZTctMDk0OS1hMTZhLWViN2Q4MDhlOTBmZCIgc3RFdnQ6d2hlbj0iMjAxNi0xMS0wOFQxMzozMToyNSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2N2Y3YTFmYy1hNjg4LTJhNGItYTIyYy00ZjYyNTZiYWVkMjgiIHN0RXZ0OndoZW49IjIwMTYtMTEtMDhUMTQ6NTI6NDErMDE6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGltYWdlL3BuZyB0byBpbWFnZS9qcGVnIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBpbWFnZS9wbmcgdG8gaW1hZ2UvanBlZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NGJiNjA2OWEtMTlkNy1lYTQ4LWFiYzAtODZhYmFkMzBhNTQwIiBzdEV2dDp3aGVuPSIyMDE2LTExLTA4VDE0OjUyOjQxKzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxkYzp0aXRsZT4gPHJkZjpBbHQ+IDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+RXhhbHRvX2xvZ29fY215a196b25kZXJwYXlvZmY8L3JkZjpsaT4gPC9yZGY6QWx0PiA8L2RjOnRpdGxlPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4ADkFkb2JlAGRAAAAAAf/b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";