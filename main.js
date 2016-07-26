/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
var formData;

function gatherData () {
	var data = new DataSet (
		new Contact (
			document.getElementById("contactName").value,
			document.getElementById("contactCompany").value,
			document.getElementById("contactAddress").value,
			document.getElementById("contactZIP").value,
			document.getElementById("contactPlace").value,
			document.getElementById("contactCountry").value,
			document.getElementById("contactTel").value,
			document.getElementById("contactFax").value,
			document.getElementById("contactEmail").value
		),
		new Motor (
			document.getElementById("motor12V").checked,
			document.getElementById("motor24V").checked,
			document.getElementById("motorBelow").checked,
			document.getElementById("motorAbove").checked
		),
		new Switchgear (
			document.getElementById("motorAbove").value
		),
		new Washing (
			document.getElementById("motorAbove").value
		),
		new Window (
			document.getElementById("windowType").value,
			document.getElementById("windowHeight").value,
			document.getElementById("windowTopWidth").value,
			document.getElementById("windowBottomWidth").value,
			document.getElementById("windowCentreDistance").value,
			document.getElementById("windowEyeLevel").value,
			document.getElementById("windowBulkheadThickness").value
		)
	);
	formData = data;
	return data;
}

function computeWiperset () {
	var dataSet = gatherData();
	
}

function DataSet (contactData, motorData, switchgearData, washingData, windowData){
	this.contactData = contactData;
	this.motorData = motorData;
	this.switchgearData = switchgearData;
	this.washing = washingData;
	this.windowData = windowData;
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

function Window (type, height, topWidth, bottomWidth, centreDistance, eyeLevel, bulkheadThickness){
	this.type = type;
	this.height = height;
	this.topWidth = topWidth;
	this.bottomWidth = bottomWidth;
	this.centreDistance = centreDistance;
	this.eyeLevel = eyeLevel;
	this.bulkheadThickness = bulkheadThickness;
}
