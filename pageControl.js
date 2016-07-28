/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
function fillTable (){
	var data = computeWiperset();
	document.getElementById("armLength").textContent = data.armLenth;
	document.getElementById("bladeLength").textContent = data.bladeLength;
	document.getElementById("maxWiperAngle").textContent = data.maxWiperAngle;
	document.getElementById("marginHorizontal").textContent = data.marginHorizontal;
	document.getElementById("marginBelow").textContent = data.marginBelow;
	document.getElementById("marginAbove").textContent = data.marginAbove;
	document.getElementById("marginVerticalMovements").textContent = data.marginVerticalMovement;
}