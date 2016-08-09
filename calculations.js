/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
var formData;

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
		
		results = new Results (armLength, bladeLength, maxWipeAngle, Marginhorizontal, MarginverticalBelow, MarginverticalAbove, MarginverticalMovement);
		
	} else {
		console.error ("Something went terribly wrong.");
	}
	
	return results;
}

function Results (armLength, bladeLength, maxWiperAngle, marginHorizontal, marginBelow, marginAbove, marginVerticalMovement) {
	this.armLenth = armLength;
	this.bladeLength = bladeLength;
	this.maxWiperAngle = maxWiperAngle;
	this.marginHorizontal = marginHorizontal;
	this.marginBelow = marginBelow;
	this.marginAbove = marginAbove;
	this.marginVerticalMovements = marginVerticalMovement;
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

function PantographBladeLength (centreHeight, height, armLength){
	return Math.floor(((height + centreHeight - armLength - 20) * 2) / 5) * 5;
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
		return wipeAngle;
	}
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
	return Math.round(((2 * halfAngleAlpha) - 15) / 5) * 5
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
