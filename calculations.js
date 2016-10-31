/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
var formData;

var baseData = {
	"windowRaw":{
		"width":null,
		"height":null,
		"centreDistance":null,
		"marginH":null,
		"marginVT":null,
		"marginVB":null,
		"marginC":null,
		"wiperType":null,
		"eyeLevel":null
	},
	"window":{
		"width":null,
		"height":null,
		"centreDistance":null,
		"marginC":null,
		"isPantograph":null,
		"eyeLevel":null
	},
	"meta":{
		"isInches":null
	}
};

// GLOBAL LIMITS REGISTER //
var limits = {
	"window":{
		"bladeMin":Number.POSITIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"armMin":Number.POSITIVE_INFINITY,
		"armMax":Number.NEGATIVE_INFINITY
	},
	"arm":{
		"bladeMin":Number.POSITIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"armMin":Number.POSITIVE_INFINITY,
		"armMax":Number.NEGATIVE_INFINITY,
		"hoh":null,
		"centreMounted":null
	},
	"blade":{
		"bladeLength":NaN,
		"maxArmLength":NaN,
		"minArmLength":NaN
	},
	"motor":{
		"angleMin":Number.POSITIVE_INFINITY,
		"angleMax":Number.NEGATIVE_INFINITY,
		"angleStages":null,
		"armMax":Number.NEGATIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"hoh":null
	},
	"database":{
		"bladeMin":Number.POSITIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"armMin":Number.POSITIVE_INFINITY,
		"armMax":Number.NEGATIVE_INFINITY,
		"angleMin":Number.POSITIVE_INFINITY,
		"angleMax":Number.NEGATIVE_INFINITY
	},
	"definiteList":function(){
		var retVar = {};

		// BLADE
		// min
		retVar.bladeMin = this.database.bladeMin;
		if(retVar.bladeMin <= this.window.bladeMin && isFinite(this.window.armMin)){
			retVar.bladeMin = this.window.bladeMin;
		}
		if(retVar.bladeMin < this.arm.bladeMin && isFinite(this.arm.bladeMin)){
			retVar.bladeMin = this.arm.bladeMin;
		}
		
		// max
		retVar.bladeMax = this.database.bladeMax;
		if(retVar.bladeMax >= this.window.bladeMax && isFinite(this.window.bladeMax)){
			retVar.bladeMax = this.window.bladeMax;
		}
		if(retVar.bladeMax >= this.arm.bladeMax && isFinite(this.arm.bladeMax)){
			retVar.bladeMax = this.arm.bladeMax;
		}
		if(retVar.bladeMax >= this.motor.bladeMax && isFinite(this.motor.bladeMax)){
			retVar.bladeMax = this.motor.bladeMax;
		}
		
		// length
		retVar.bladeLength = this.motor.bladeLength;
		
		
		// ARM
		// min
		retVar.armMin = this.database.armMin;
		if(retVar.armMin <= this.window.armMin && isFinite(this.window.armMin)){
			retVar.armMin = this.window.armMin;
		}
		if(retVar.armMin <= this.arm.armMin && isFinite(this.arm.armMin)){
			retVar.armMin = this.arm.armMin;
		}
		
		// max
		retVar.armMax = this.database.armMax;
		if(retVar.armMax >= this.window.armMax && isFinite(this.window.armMax)){
			retVar.armMax = this.window.armMax;
		}
		if(retVar.armMax >= this.arm.armMax && isFinite(this.arm.armMax)){
			retVar.armMax = this.arm.armMax;
		}
		if(retVar.armMax >= this.motor.armMax && isFinite(this.motor.armMax)){
			retVar.armMax = this.motor.armMax;
		}
		
		// ANGLE
		// min
		retVar.angleMin = this.database.angleMin;
		if(retVar.angleMin <= this.motor.angleMin && isFinite(this.motor.angleMin)){
			retVar.angleMin = this.motor.angleMin;
		}
		
		// max
		retVar.angleMax = this.database.angleMax;
		if(retVar.angleMax >= this.motor.angleMax && isFinite(this.motor.angleMax)){
			retVar.angleMax = this.motor.angleMax;
		}
		
		// stages
		retVar.angleStages = this.motor.angleStages;
		
		return retVar;
	}
};

function resetLimits () {
	limits.window = {
		"bladeMin":Number.POSITIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"armMin":Number.POSITIVE_INFINITY,
		"armMax":Number.NEGATIVE_INFINITY
	};
	limits.arm = {
		"bladeMin":Number.POSITIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"armMin":Number.POSITIVE_INFINITY,
		"armMax":Number.NEGATIVE_INFINITY,
		"hoh":null,
		"centreMounted":null
	}
	limits.blade = {
		"bladeLength":NaN,
		"maxArmLength":NaN,
		"minArmLength":NaN
	};
	limits.motor={
		"angleMin":Number.POSITIVE_INFINITY,
		"angleMax":Number.NEGATIVE_INFINITY,
		"angleStages":null,
		"armMax":Number.NEGATIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"hoh":null
	};
	limits.database={
		"bladeMin":Number.POSITIVE_INFINITY,
		"bladeMax":Number.NEGATIVE_INFINITY,
		"armMin":Number.POSITIVE_INFINITY,
		"armMax":Number.NEGATIVE_INFINITY,
		"angleMin":Number.POSITIVE_INFINITY,
		"angleMax":Number.NEGATIVE_INFINITY
	};
}
function gatherData () {
	var data = new DataSet (
		new Contact (
			(document.getElementById("contactName") || "").value,
			(document.getElementById("contactCompany") || "").value,
			(document.getElementById("contactAddress") || "").value,
			(document.getElementById("contactZIP") || "").value,
			(document.getElementById("contactPlace") || "").value,
			(document.getElementById("contactCountry") || "").value,
			(document.getElementById("contactTel") || "").value,
			(document.getElementById("contactFax") || "").value,
			(document.getElementById("contactEmail") || "").value
		),
		new Motor (
			(document.getElementById("motor12V") || "").checked,
			(document.getElementById("motor24V") || "").checked,
			(document.getElementById("motorBelow") || "").checked,
			(document.getElementById("motorAbove") || "").checked
		),
		new Switchgear (
			(document.getElementById("motorAbove") || "").value
		),
		new Washing (
			(document.getElementById("motorAbove") || "").value
		),
		new Window (
			(document.getElementById("windowType") || "").value,
			(document.getElementById("wiperType") || "").value,
			(document.getElementById("windowHeight") || "").value,
			(document.getElementById("windowTopWidth") || "").value,
			(document.getElementById("windowBottomWidth") || "").value,
			(document.getElementById("windowCentreDistance") || "").value,
			(document.getElementById("windowEyeLevel") || "").value,
			(document.getElementById("windowBulkheadThickness") || "").value
		),
		new Meta (
			document.getElementById("units").value
		)
	);
	
	if(data.meta.isInches){
		data = convertToMM (data);
	}
	
	formData = data;
	return data;
}



function convertToMM (data) {
	data.windowData.height = inchToMM(data.windowData.height);
	data.windowData.topWidth = inchToMM(data.windowData.topWidth);
	data.windowData.bottomWidth = inchToMM(data.windowData.bottomWidth);
	data.windowData.centreDistance = inchToMM(data.windowData.centreDistance);
	data.windowData.eyeLevel = inchToMM(data.windowData.eyeLevel);
	data.windowData.bulkheadThickness = inchToMM(data.windowData.bulkheadThickness);
	return data;
}

function inchToMM (num){
	return Number(num) * 25.4;
}

function mmToInch (num) {
	return Number(num) / 25.4;
}



function computeWiperset () {
	var dataSet = gatherData();
	var results;
	if (dataSet !== null){
		
		var armLength, bladeLength, maxWipeAngle, Marginhorizontal, MarginverticalBelow, MarginverticalAbove, MarginverticalMovement;
		
		if (dataSet.windowData.wiperType === "pantograph"){
			// Parameters
			var pEyeLevel = Number(dataSet.windowData.eyeLevel);
			var pCentreHeight = Number(dataSet.windowData.centreDistance);
			var pHeight = Number(dataSet.windowData.height);
			var pWidth = Number(dataSet.windowData.topWidth);
			
			// Represents the cells on the Excel sheet used for calculations.
			var pArmLength, pBladeLength, pBladeLengthCorrected, pSineAngleAlpha, pHalfSineAngleAlpha, pWipeAngle, pF19, pWipeAngleCorrected,
				pMarginHorizontal, pMarginHorizontalCorrected, pMarginVerticalUnder, pMarginVerticalAbove, pMaxWipeAngle, pAh, pAhCorrected, pMv2Corrected, pMv1Corrected, pVerticalMovement, pVerticalMovementCorrected;
			
			// Calculations
			pArmLength = PantographArmLength(pEyeLevel, pCentreHeight, pHeight);
			
			pBladeLength = PantographBladeLength (pCentreHeight, pHeight, pArmLength);
			
			pMarginVerticalUnder = PantographMarginVerticalUnder (pHeight, pCentreHeight, pArmLength, pBladeLength);
			
			pSineAngleAlpha = PantographSineAngleAlpha (pWidth, pArmLength);
			
			pHalfSineAngleAlpha = PantographHalfSineAngleAlpha (pSineAngleAlpha);
						
			pWipeAngle = PantographWipeAngle(pWidth, pArmLength, pHalfSineAngleAlpha);
			
			pVerticalMovement = PantographVerticalMovement (pArmLength, pWipeAngle);
			
			pAh = PantographAh (pWipeAngle, pArmLength);
			pMaxWipeAngle = PanthogaphMaxWipeAngle (pHalfSineAngleAlpha);
			
			pMarginVerticalAbove = PantographMarginVerticalAbove (pArmLength, pAh, pBladeLength, pCentreHeight);
			
			pBladeLengthCorrected = PantographBladeLengthCorrected (pMarginVerticalUnder, pMarginVerticalAbove, pBladeLength);
			
			pMarginHorizontal = PantographMarginHorizontal (pWidth, pArmLength, pWipeAngle);
			
			pF19 = PantographF19(pArmLength, pAh, pBladeLengthCorrected, pCentreHeight);

			pWipeAngleCorrected = PantographWipeAngleCorrected(pHalfSineAngleAlpha, pF19, pBladeLengthCorrected, pCentreHeight, pArmLength, pWipeAngle);
			
			pVerticalMovementCorrected = PantographVerticalMovementCorrected (pArmLength, pWipeAngleCorrected);
			
			pAhCorrected = PantographAhCorrected (pWipeAngleCorrected, pArmLength);
			
			pMarginHorizontalCorrected = PantographMarginHorizontalCorrected (pWidth, pWipeAngleCorrected, pArmLength);
			
			pMv2Corrected = PantographMv2Corrected (pHeight, pCentreHeight, pArmLength, pBladeLengthCorrected);
			
			pMv1Corrected = PantographMv1Corrected (pArmLength, pAhCorrected, pBladeLengthCorrected, pCentreHeight);
			
			// Fill out final results
			armLength = pArmLength;
			bladeLength = pBladeLengthCorrected;
			maxWipeAngle = pWipeAngleCorrected;
			Marginhorizontal = pMarginHorizontalCorrected;
			MarginverticalBelow = pMv2Corrected;
			MarginverticalAbove = pMv1Corrected;
			MarginverticalMovement = pVerticalMovementCorrected;
			
		} else { // pendulum (probably)
			// Parameters
			var eEyeLevel = Number(dataSet.windowData.eyeLevel);
			var eCentreHeight = Number(dataSet.windowData.centreDistance);
			var eHeight = Number(dataSet.windowData.height);
			var eWidth = Number(dataSet.windowData.topWidth);
			
			// Represents the cells on the Excel sheet used for calculations.
			var eArmLength, eBladeLength, eWipeAngle, eSineAngleAlpha, eHalfAngleAlpha, eMaxWipeAngle, eHorizontalMargin, eVerticalMarginUnder, eVerticalMarginAbove;
			
			// Calculations
			eArmLength = PendulumArmLength (eEyeLevel, eCentreHeight, eHeight);
			
			eBladeLength = PendulumBladeLength (eHeight, eCentreHeight, eArmLength);
			
			eSineAngleAlpha = PendulumSineAngleAlpha (eWidth, eArmLength, eBladeLength);
			
			eHalfAngleAlpha = PendulumHalfAngleAlpha (eSineAngleAlpha);
			
			eWipeAngle = PendulumWipeAngle (eHalfAngleAlpha);
			
			eMaxWipeAngle = PendulumMaxWipeAngle (eHalfAngleAlpha);
			
			eHorizontalMargin = PendulumHorizontalMargin (eWidth, eWipeAngle, eArmLength, eBladeLength);
			
			eVerticalMarginUnder = PendulumVerticalMarginUnder (eHeight, eCentreHeight, eArmLength, eBladeLength);
			
			eVerticalMarginAbove = PendulumVerticalMarginAbove (eArmLength, eBladeLength, eWipeAngle, eCentreHeight);
			
			// Fill out final results
			armLength = eArmLength;
			bladeLength = eBladeLength;
			maxWipeAngle = eWipeAngle;
			Marginhorizontal = eHorizontalMargin;
			MarginverticalBelow = eVerticalMarginUnder;
			MarginverticalAbove = eVerticalMarginAbove;
			MarginverticalMovement = null;
		}
		
		results = new Results (armLength, bladeLength, maxWipeAngle, Marginhorizontal, MarginverticalBelow, MarginverticalAbove, MarginverticalMovement, dataSet);
		
		results.blades = processBlades ();
		
		// ToDo: fix margins
		/*results.blades = processBlades (Number(dataSet.windowData.topWidth),
			Number(dataSet.windowData.height),
			Number(dataSet.windowData.centreDistance),
			//Marginhorizontal, MarginverticalAbove, MarginverticalBelow,
			30,30,30,
			Number(dataSet.windowData.eyeLevel),
			dataSet.windowData.wiperType === "pantograph");*/
	} else {
		console.error ("Something went terribly wrong.");
	}
	
	return results;
}

function Results (armLength, bladeLength, maxWiperAngle, marginHorizontal, marginBelow, marginAbove, marginVerticalMovement, inputData) {
	this.armLenth = armLength;
	this.bladeLength = bladeLength;
	this.maxWiperAngle = maxWiperAngle;
	this.marginHorizontal = marginHorizontal;
	this.marginBelow = marginBelow;
	this.marginAbove = marginAbove;
	this.marginVerticalMovements = marginVerticalMovement;
	this.inputData = inputData;
}

// 
// Pantograph
// 

function PantographArmLength (eyeLevel, centreHeight, height) {
	var num = 0;
	if (eyeLevel > 0) {
		num = eyeLevel + centreHeight;
	} else {
		num = ((height + centreHeight) * 0.6325) - 10;
	}
	return Math.ceil(num / 5) * 5;
}

// Check for eyelevel, smallest distance = blade length/2, marge!
function PantographBladeLength (centreHeight, height, armLength){
	return Math.floor(((height + centreHeight - armLength - 20) * 2) / 50) * 50;
}

function PantographBladeLengthCorrected (marginVertUnder, marginVertAbove, bladeLength) {
	if (marginVertUnder * marginVertAbove <= 0) {
		return bladeLength-50;
	}
	return bladeLength;
}

function PantographSineAngleAlpha (width, armLength) {
	var a = width * 0.5 / armLength;
	if (a >= 1){
		return 1;
	}
	return a;
}

function PantographHalfSineAngleAlpha (sineAngleAlpha) {
	return Math.asin(sineAngleAlpha) * 180 / Math.PI;
}

function PantographWipeAngle (width, armLegth, sineAngleAlpha) {
	//var a = PantographHalfSineAngleAlpha(PantographSineAngleAlpha(width, armLegth));
	
	var angle = Math.round (((2 * sineAngleAlpha) - 15) / 5) * 5;
	if (angle >= 90){
		return 90;
	} else {
		return angle;
	}
}

function PantographF19 (armLength, ah, bladeLengthCorrected, centreHeight) {
	return Math.sqrt(Math.pow(armLength, 2) - Math.pow(ah, 2)) - ((0.5 * bladeLengthCorrected) + centreHeight);
}

function PantographWipeAngleCorrected (halfAngleAlpha, f19, bladeLengthCorrected, centreHeight, armLength, wipeAngle) {
	if (Math.round(((2 * halfAngleAlpha) - 15) / 5) * 5 >= 90) {
		if (f19 <= 35){
			return Math.round(((Math.acos((0.5 * bladeLengthCorrected+centreHeight+35)/armLength)*180/Math.PI) * 2) / 5) * 5;
		} else {
			return wipeAngle;
		}
	}
	return wipeAngle;
}

function PantographMarginHorizontal (width, armLength, wipeAngle){
	return (width / 2) - (Math.sin((wipeAngle * 0.5) / 180 * Math.PI) * armLength);
}

function PantographMarginHorizontalCorrected (width, wipeAngleCorrected, armLength) {
	return (width / 2) - (Math.sin((wipeAngleCorrected * 0.5) / 180 * Math.PI) * armLength);
}

function PantographMarginVerticalUnder(height, centreHeight, armLength, bladeLength){
	return height + centreHeight - armLength - (bladeLength / 2);
}

function PantographMarginVerticalAbove(armLength, ah, bladeLength, centreHeight){
	return Math.sqrt(Math.pow(armLength, 2) - Math.pow(ah, 2)) - ((0.5 * bladeLength) + centreHeight);
}

function PanthogaphMaxWipeAngle (halfAngleAlpha) {
	return halfAngleAlpha + halfAngleAlpha;
}

function PantographAh (wipeAngle, armLength) {
	return Math.sin((wipeAngle * 0.5) / 180 * Math.PI) * armLength;
}

function PantographAhCorrected (wipeAngleCorrected, armLength) {
	return Math.sin((wipeAngleCorrected / 2) / 180 * Math.PI) * armLength;
}

function PantographMv2Corrected (height, centreHeight, armLength, bladeLengthCorrected){
	return (height + centreHeight - armLength - (bladeLengthCorrected / 2));
}

function PantographMv1Corrected (armLength, ahCorrected, bladeLengthCorrected, centreHeight){
	return Math.sqrt(Math.pow(armLength, 2) - Math.pow(ahCorrected, 2))-((0.5 * bladeLengthCorrected) + centreHeight);
}

function PantographVerticalMovement (armLength, wipeAngle) {
	return armLength - Math.cos((wipeAngle * 0.5) / 180 * Math.PI) * armLength;
}

function PantographVerticalMovementCorrected (armLength, wipeAngleCorrected) {
	return armLength - Math.cos((wipeAngleCorrected * 0.5) / 180 * Math.PI) * armLength;
}

//
// Pendulum
//

function PendulumArmLength (eyeLevel, centreHeight, height) {
	var a;
	if (eyeLevel < 0){
		a = eyeLevel + centreHeight;
	} else {
		a = ((height + centreHeight)  *0.6325) - 10;
	}
	
	return Math.ceil(a / 5) * 5;
}

function PendulumBladeLength (height, centreHeight, armLength) {
	return Math.floor((((height + centreHeight - armLength) - 20) * 2) / 50) * 50;
}

function PendulumWipeAngle (halfAngleAlpha) {
	return Math.round(((2 * halfAngleAlpha) - 15) / 5) * 5;
}

function PendulumHorizontalMargin (width, wipeAngle, armLength, bladeLength) {
	return (width / 2) - (Math.sin((wipeAngle * 0.5) / 180 * Math.PI) * (armLength + 0.5 * bladeLength)); 
}

function PendulumVerticalMarginUnder (height, centreHeight, armLength, bladeLength) {
	return (height + centreHeight - armLength - (bladeLength / 2));
}

function PendulumVerticalMarginAbove (armLength, bladeLength, wipeAngle, centreHeight) {
	return (armLength - (0.5 * bladeLength)) * Math.cos((wipeAngle / 2) / 180 * Math.PI) - centreHeight;
}

function PendulumSineAngleAlpha (width, armLength, bladeLength) {
	return width * 0.5 / (armLength + 0.5 * bladeLength);
}

function PendulumHalfAngleAlpha (sinAngleAplha) {
	return Math.asin(sinAngleAplha) * 180 / Math.PI;
}

function PendulumMaxWipeAngle (halfAngleAlpha) {
	return halfAngleAlpha + halfAngleAlpha;
}


// ---

function DataSet (contactData, motorData, switchgearData, washingData, windowData, meta){
	this.contactData = contactData;
	this.motorData = motorData;
	this.switchgearData = switchgearData;
	this.washing = washingData;
	this.windowData = windowData;
	this.meta = meta;
}

function Contact (name, company, address, zip, place, country, tel, fax, email){
	this.name = name;
	this.company = company;
	this.address = address;
	this.zip = zip;
	this.place = place;
	this.country = country;
	this.tel = tel;
	this.fax = fax;
	this.email = email;
}

function Switchgear (type){
	this.type = type;
}

function Washing (type) {
	this.type = type;
}

function Motor (twelvevolt, twentyfourvolt, below, above){
	this.twelvevolt = twelvevolt;
	this.twentyfourvolt = twentyfourvolt;
	this.below = below;
	this.above = above;
}

function Window (type, wiperType, height, topWidth, bottomWidth, centreDistance, eyeLevel, bulkheadThickness){
	this.type = type;
	this.wiperType = wiperType;
	this.height = height;
	this.topWidth = topWidth;
	this.bottomWidth = bottomWidth;
	this.centreDistance = centreDistance;
	this.eyeLevel = eyeLevel;
	this.bulkheadThickness = bulkheadThickness;
}

function Meta (units) {
	this.isInches = units === "inch" ? true : units === "mm" ? false : null; 
}

// size must be MM to work correctly.
function SizeNotation (size) {
	var dat = document.getElementById("units").value;
	var isInch = dat === "inch";
	if (isInch){ // inch
		return (Number(size) / 25.4).toFixed(3) + " in";
	} else { // mm
		return (Number(size).toFixed(2) + " mm");
	}
}

//

//

//

// --- //                                       // --- //

// --- // NO EXCEL TRANSLATIONS PAST THIS POINT // --- //

// --- //                                       // --- //

//

//

//


var maxDegreesPantograph = 120 * (Math.PI/180);


// Get maximum blade length for given window and or eye level. 
function getMaxBladeLength (width, height, eyeLevel){
	height		= Number(height);
	width		= Number(width);
	eyeLevel 	= Number(eyeLevel);
	
	if(eyeLevel !== 0) {
		return height - eyeLevel > eyeLevel ? eyeLevel : height - eyeLevel;
	} else {
		return height;
	}
}

// vOffset must be margin adjusted!
function getWipeAngle (isPantograph, width, height, armLength, bladeLength, vOffset) {
	var retVar = Number.POSITIVE_INFINITY;
	if (isPantograph) {
		// Horizontal check
		var hLimit = Number.POSITIVE_INFINITY;
		
		// Prevent incorrect calculations, zero divisions etc.
		if (armLength > (width / 2)) {
			hLimit = Math.asin((width/2) / armLength);
			//hLimit = ((Math.PI/2) - hLimit) * 2;
			hLimit = hLimit + hLimit;
			if(isNaN(hLimit)){
				console.error("h-nan");
			}
		}
		
		// Vertical check
		var vLimit = Number.POSITIVE_INFINITY;
		
		if (/*-(bladeLength / 2) <= vOffset &&*/ (bladeLength/2) + vOffset <= armLength) {
			vLimit = Math.acos(((bladeLength/2) + vOffset) / armLength);
			//vLimit = ((Math.PI/2) - vLimit) * 2;
			vLimit = vLimit + vLimit;
			if(isNaN(vLimit)){
				console.error("v-nan");
			}
		}
		
		// Returns
		if (hLimit < retVar && hLimit < maxDegreesPantograph){
			retVar = hLimit;
		}
		if (vLimit < retVar && vLimit < maxDegreesPantograph){
			retVar = vLimit;
		}
		
		if(!isFinite(retVar)){
			return 0;
		}
		
		if(isFinite(processLimits.angleMax) && isFinite(processLimits.angleMin)){
			if(retVar > (processLimits.angleMax * (Math.PI/180))){
				return processLimits.angleMax * (Math.PI/180);
			}else if (retVar < (processLimits.angleMin * (Math.PI/180))){
				return 0;
			}
			
			if(isFinite(processLimits.angleStages) && (processLimits.angleStages > 0)){
				
				retVar *= 180/Math.PI;								
				var stage = processLimits.angleStages;
				var min = processLimits.angleMin;
				var max = processLimits.angleMax;
				retVar -= min;
				retVar /= stage;
				retVar = Math.round(retVar);
				retVar *= stage;
				retVar += min;
				retVar *= Math.PI/180;
			}
		}
		
		
		
		return retVar;
		
	} else {
				// Horizontal check
		var hLimit = Number.POSITIVE_INFINITY;
		
		// Prevent incorrect calculations, zero divisions etc.
		if (armLength + (bladeLength/2) > (width / 2)) {
			hLimit = Math.asin((width/2) / (armLength + (bladeLength/2)));
			hLimit = hLimit + hLimit;
		}
		
		// Vertical check
		var vLimit = Number.POSITIVE_INFINITY;
		
		if (vOffset < (armLength - (bladeLength/2))) {
			vLimit = Math.acos(vOffset / (armLength - (bladeLength/2)));
			vLimit = vLimit + vLimit;
		}
		
		// Returns
		if (hLimit < retVar && hLimit < maxDegreesPantograph){
			retVar = hLimit;
		}
		if (vLimit < retVar && vLimit < maxDegreesPantograph){
			retVar = vLimit;
		}
		
		if(!isFinite(retVar)){
			return 0;
		}
		
		if(isFinite(processLimits.angleMax) && isFinite(processLimits.angleMin)){
			if(retVar > (processLimits.angleMax * (Math.PI/180))){
				return processLimits.angleMax * (Math.PI/180);
			}else if (retVar < (processLimits.angleMin * (Math.PI/180))){
				return 0;
			}
			
			if(isFinite(processLimits.angleStages) && (processLimits.angleStages > 0)){
				
				retVar *= 180/Math.PI;								
				var stage = processLimits.angleStages;
				var min = processLimits.angleMin;
				var max = processLimits.angleMax;
				retVar -= min;
				retVar /= stage;
				retVar = Math.round(retVar);
				retVar *= stage;
				retVar += min;
				retVar *= Math.PI/180;
			}
		}
		
		
		
		return retVar;
	}
}

var pollOffset = 0.25; // Amount of millimiters offset is used when determining wether results are descending or ascending. Keep it under 1mm.
var pollCount = 50; // Amount of polls per sweep. More takes longer, but finishes in less sweeps.

// Use searching algorithm to find optimal arm length. Dependend on pollCount and pollOffset.
function getOptimalArmLength (isPantograph, bladeLength, angleLimit, width, height, vOffset) {
	var maxArmLength = height - (bladeLength / 2) + vOffset;
	var minArmLength = (bladeLength / 2) + (vOffset > 0 ? vOffset : 0);
	
	if (processLimits.armMax < maxArmLength){
		maxArmLength = processLimits.armMax;
	}
	
	if (processLimits.armMin > minArmLength){
		minArmLength = processLimits.armMin;
	}
	
	//var processLimits = limits.definiteList;
	//var maxArmLength = processLimits.armMax;
	//var minArmLength = processLimits.armMin;
	
	var results = [];
	
	var samples = Math.floor(maxArmLength) - Math.ceil(minArmLength);
	
	var maxPerc = 0;
	var maxVal = minArmLength;
	
	for(var i = 0; i < samples; i++){
		var p = {};
		var val = i + minArmLength;
		p.value = val;
		
		var wa = getWipeAngle (isPantograph, width, height, val, bladeLength, vOffset);
		p.perc = getWipePercentage(isPantograph, val, bladeLength, wa, width, height, vOffset);
		
		if (p.perc > maxPerc){
			maxPerc = p.perc;
			maxVal = p.value;
		}
		
		results.push(p);
	}
	return maxVal;
	
}

function fLerp (min, max, f) {
	return ((max - min) * f) + min;
}

function getBladeLengths (max, min) {
	return database.blades.where(function (a) {
		var maxArmLength = baseData.window.height - (a.length / 2) + baseData.window.centreDistance;
		var minArmLength = (a.length / 2) + (baseData.window.centreDistance > 0 ? baseData.window.centreDistance : 0);
		
		if (processLimits.armMax < maxArmLength){
			maxArmLength = processLimits.armMax;
		}
	
		if (processLimits.armMin > minArmLength){
			minArmLength = processLimits.armMin;
		}
		
		return a.length >= min && a.length <= max && (maxArmLength >= minArmLength);
	});
}

var processLimits;

//function processBlades (rWidth, rHeight, rCentreDistance, rHMargin, rVMarginT, rVMarginB, eyeLevel, isPantograph){
	
	//var width = rWidth - rHMargin;
	//var height = rHeight - rVMarginB - rVMarginT;
	//var vOffset = rCentreDistance + rVMarginT;
	
function processBlades (){
	processLimits = limits.definiteList();
	var width = baseData.window.width;
	var height = baseData.window.height
	var vOffset = baseData.window.centreDistance;
	var bl = getBladeLengths(processLimits.bladeMax, processLimits.bladeMin);
	
	var out = [];
	
	for(var i = 0; i < bl.length; i++){
		bl[i].optimalArmLength = getOptimalArmLength (baseData.window.isPantograph, bl[i].length, Math.PI, width, height, vOffset);
		bl[i].wipeAngle = getWipeAngle (baseData.window.isPantograph, width, height, bl[i].optimalArmLength, bl[i].length, vOffset);
		bl[i].wipePercentage = getWipePercentage (baseData.window.isPantograph, bl[i].optimalArmLength, bl[i].length, bl[i].wipeAngle, width, height, vOffset);
		
		if((bl[i].wipePercentage > 0.001) && (bl[i].wipeAngle > 0.001)){
			out.push(bl[i]);
		}
	}
	
	console.log("Done!");
	return bl;
}

function calcFinal (){
	if (isFinite(limits.blade.bladeLength) && limits.blade.bladeLength > 0){
		processLimits = limits.definiteList();
		var width = baseData.window.width;
		var height = baseData.window.height
		var vOffset = baseData.window.centreDistance;
		var bl = {"length":limits.blade.bladeLength};
		bl.optimalArmLength = getOptimalArmLength (baseData.window.isPantograph, bl.length, Math.PI, width, height, vOffset);
		bl.wipeAngle = getWipeAngle (baseData.window.isPantograph, width, height, bl.optimalArmLength, bl.length, vOffset);
		bl.wipePercentage = getWipePercentage (baseData.window.isPantograph, bl.optimalArmLength, bl.length, bl.wipeAngle, width, height, vOffset);
		
		bl.wipeAngle *= 57.295780181884765625;
		
		console.log("Done!");
		return bl;
	} else {
		return null;
	}
}

function getWipePercentage (isPantograph, armLength, bladeLength, wipeAngle, width, height, vOffset) {
	if(isPantograph){
		return (Math.sin(wipeAngle / 2) * armLength * (bladeLength/2) * 4) / (height * width);
	} else {
		return (Math.PI * armLength * (bladeLength / 2) * (wipeAngle / 2)) / (Math.PI/2 * height * width);
	}
}

















































