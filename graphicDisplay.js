/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
/*globals Phaser*/

// phaser 2.6.1
var game = new Phaser.Game(2480, 3508, Phaser.CANVAS, 'graphicView', { preload: preload, create: create, update: update });

var pixelSize = 0;
var millimeterMargin = 100;

var windowPattern;
var windowGraphic;

var wiperMarkMask;
var wiperMarkVisible;

var measurementGraphics;
var textGroup; // Use to be able to remove text from the screen.

function preload() {
	loadAssets();
}

function create() {
	game.stage.backgroundColor = "#ffffff";
	windowPattern = game.add.tileSprite(0,0,game.width, game.height, 'line_tile_black');
	windowGraphic = game.add.graphics(0, 0);
	
	measurementGraphics = game.add.graphics(0, 0);
	
	windowPattern.mask = windowGraphic;
	
	textGroup = game.add.group();
	
	wiperMarkVisible = game.add.graphics(0,0);
	wiperMarkMask = game.add.graphics(0,0);

	wiperMarkVisible.mask = wiperMarkMask;
	
	// Render order
	
	textGroup.z = 20;
	measurementGraphics.z = 19;
	
	wiperMarkMask.z = 18;
	wiperMarkVisible.z = 17;
	
	windowGraphic.z = 16;
	windowPattern.z = 15;

}

// Measurements are always on the right side.
function drawMeasure (graphics, startPoint, endPoint, group){
	graphics.lineStyle(2, 0x000000);
	
	var boundLength = 30;
	var lineDistance = 20;
	var direction = new Phaser.Point(endPoint.x - startPoint.x, endPoint.y - startPoint.y).normalize();
	var distance = startPoint.distance(endPoint);
	var normalDirection = new Phaser.Point(direction.y, -direction.x);
	
	// Draw bounds
	
	var startPointOffsetX = startPoint.x + (normalDirection.x * boundLength);
	var startPointOffsetY = startPoint.y + (normalDirection.y * boundLength);
	
	graphics.moveTo(startPoint.x, startPoint.y);
	graphics.lineTo(startPointOffsetX, startPointOffsetY);
	
	graphics.lineStyle(2, 0x000000);

	var endPointOffsetX = endPoint.x + (normalDirection.x * boundLength);
	var endPointOffsetY = endPoint.y + (normalDirection.y * boundLength);
	
	graphics.moveTo(endPoint.x, endPoint.y);
	graphics.lineTo(endPointOffsetX, endPointOffsetY);

	graphics.lineStyle(2, 0x000000);

	
	// Draw line
	graphics.moveTo(startPoint.x + (normalDirection.x * lineDistance), startPoint.y + (normalDirection.y * lineDistance));
	graphics.lineTo(endPoint.x + (normalDirection.x * lineDistance), endPoint.y + (normalDirection.y * lineDistance));
	
	var textPos = lerpPoint(
		new Phaser.Point(startPointOffsetX, startPointOffsetY),
		new Phaser.Point(endPointOffsetX, endPointOffsetY),
		0.5);
	
	var textAngle = Math.atan2(direction.y, direction.x) * 57.2958;
	// Make sure text is at a readable angle
	if (textAngle > 90 || textAngle < -90){
		textAngle += 180;
	}
	
	
	var lineLable = game.add.bitmapText(textPos.x, textPos.y, 'arial', Math.round(distance * pixelSize), 15);
	lineLable.angle = textAngle;
	
	lineLable.anchor.setTo(0.5); 
	
	if(group !== null){
		group.add(lineLable);
	}
	
}
 

function update() {
}

function loadAssets (){
	game.load.image('line_tile_black', 'assets/line_tile_black.png');
	game.load.bitmapFont('arial', 'assets/arial.png', 'assets/arial.fnt');
}

function drawWipedArea (visGraphics, maskGraphics, wiperType, point, angle, areaStart, areaEnd, hOffset, distance) 
{
	visGraphics.clear();
	maskGraphics.clear();
	
	var xPos = point.x / pixelSize;
	var yPos = point.y / pixelSize;
	
	visGraphics.lineStyle(2, 0xffffff, 1);
	visGraphics.moveTo(point.x, point.y);
	visGraphics.lineTo(point.x, point.y  + areaEnd);
	
	var radsAngle = game.math.degToRad(angle);
	
	var pointAxL;
	var pointAyL;
		
	var pointDxL;
	var pointDyL;
	
	var pointAx;
	var pointAy;
	
	var pointBx;
	var pointBy;
	
	var pointCx;
	var pointCy;
	
	var pointDx;
	var pointDy;
	
	
	
	if(wiperType === "pendulum"){
		
		
		visGraphics.mask = maskGraphics;
		// Calc local positions


		pointAxL = Math.sin(radsAngle / 2) * (areaStart / pixelSize);
		pointAyL = Math.cos(radsAngle / 2) * (areaStart / pixelSize);
		
		pointDxL = Math.tan(radsAngle / 2) * (areaEnd / pixelSize);
		pointDyL = (areaEnd / pixelSize);
		
		// Calc global positions
		
		pointAx = xPos - pointAxL + (hOffset / pixelSize);
		pointAy = yPos + pointAyL;
		
		pointBx = xPos + pointAxL + (hOffset / pixelSize);
		pointBy = yPos + pointAyL;
		
		pointCx = xPos + pointDxL + (hOffset / pixelSize);
		pointCy = yPos + pointDyL;
		
		pointDx = xPos - pointDxL + (hOffset / pixelSize);
		pointDy = yPos + pointDyL ;
		
		
		// visable graphic
		
		
		
		visGraphics.lineStyle(2, 0xff0000, 1);
		visGraphics.beginFill(0x00ff00);
		//visGraphics.beginFill(0x00ff00);
		
		visGraphics.arc(xPos + (hOffset / pixelSize), yPos, areaStart / pixelSize, game.math.degToRad(90 - (angle / 2)),game.math.degToRad(90 + (angle / 2)));
		
		//visGraphics.lineTo(pointBx, pointBy);
		visGraphics.lineTo(pointDx, pointDy);
		visGraphics.lineTo(pointCx, pointCy);
		visGraphics.lineTo(pointBx, pointBy);
		visGraphics.endFill();
		//visGraphics.lineTo(xPos, yPos + (hOffset / pixelSize));
		
		//visGraphics.endFill();
		
		// Mask
		maskGraphics.beginFill(0x0000ff);
		maskGraphics.drawCircle(xPos + (hOffset / pixelSize), yPos, (areaEnd / pixelSize) * 2);
		maskGraphics.endFill();

	} else if (wiperType === "pantograph") {
		visGraphics.mask = null;
		// Calc local positions
		
		visGraphics.lineStyle(2, 0xffff00, 1);
		visGraphics.drawCircle(xPos + (hOffset / pixelSize), xPos, (distance * 2) / pixelSize);
		
		pointAxL = Math.sin(radsAngle / 2) * (distance / pixelSize);
		pointAyL = Math.cos(radsAngle / 2) * (distance / pixelSize);
		
		// Calc global positions
		
		pointAx = xPos - pointAxL + (hOffset / pixelSize);
		pointAy = yPos + pointAyL;
		
		pointBx = xPos + pointAxL + (hOffset / pixelSize);
		pointBy = yPos + pointAyL;
		
		var topHeight = yPos + ((areaEnd) / pixelSize);
		var bottomHeight = yPos - ((areaStart) / pixelSize);
		
		// visable graphic
		
		visGraphics.lineStyle(2, 0xff0000, 1);
		
		//visGraphics.beginFill(0x00ff00);
		visGraphics.arc(xPos + (hOffset / pixelSize), topHeight, distance / pixelSize, game.math.degToRad(90 - (angle / 2)),game.math.degToRad(90 + (angle / 2)));
		visGraphics.lineTo(pointAx, pointAy);
		visGraphics.lineTo(pointBx, pointBy);
		//visGraphics.endFill();
		
		visGraphics.lineStyle(2, 0x00ff00, 1);

		
		//visGraphics.beginFill(0x00ff00);
		visGraphics.arc(xPos + (hOffset / pixelSize), bottomHeight, distance / pixelSize, game.math.degToRad(90 - (angle / 2)),game.math.degToRad(90 + (angle / 2)));
		visGraphics.lineTo(pointAx, pointAy);
		visGraphics.lineTo(pointBx, pointBy);
		//visGraphics.endFill();
	}
}

function drawSheme (data) {
	// Clear old graphics.
	windowGraphic.clear();
	measurementGraphics.clear();
	
	textGroup.destroy();
	textGroup = game.add.group();
	
	wiperMarkMask.clear();
	wiperMarkVisible.clear();
	
	// -- //
	
	var mmWidth = Number(data.inputData.windowData.topWidth);
	var mmHeight = Number(data.inputData.windowData.height);
	
	pixelSize = calculateScale(mmWidth, mmHeight, millimeterMargin);
	
	
	
	buildWindow (windowGraphic, mmWidth, mmHeight, windowPattern);
	
	var pixelWidth = mmWidth / pixelSize;
	var pixelHeight = mmHeight / pixelSize;
	
	var pointA = new Phaser.Point((game.width - pixelWidth) / 2,				(game.height - pixelHeight) / 2);
	var pointB = new Phaser.Point( game.width - ((game.width - pixelWidth) / 2),(game.height - pixelHeight) / 2);
	var pointC = new Phaser.Point( game.width - ((game.width - pixelWidth) / 2), game.height - ((game.height - pixelHeight) / 2));
	var pointD = new Phaser.Point((game.width - pixelWidth) / 2,				 game.height - ((game.height - pixelHeight) / 2));
	
	
	
	drawMeasure (measurementGraphics, pointC, pointD, textGroup);
	drawMeasure (measurementGraphics, pointB, pointC, textGroup);
	//drawMeasure (measurementGraphics, new Phaser.Point(500, 100), new Phaser.Point(500, 500));
	//drawMeasure (measurementGraphics, new Phaser.Point(100, 100), new Phaser.Point(500, 100));

	drawWipedArea(wiperMarkVisible, wiperMarkMask, data.inputData.windowData.wiperType, new Phaser.Point((game.width * pixelSize) / 2,(game.height * pixelSize)/ 2), data.maxWiperAngle, 300, 300, 0, 1000);
	
}

function buildWindow(graphics, width, height, patternSprite) {
	// Assume starting from top-left, when drawing.
	var onscreenWidth = width / pixelSize;
	var onscreenHeight = height / pixelSize;
	graphics.lineStyle(2, 0xAAAAAA, 1);
	graphics.beginFill(0xffffff);
    graphics.drawRect((game.width / 2) - (onscreenWidth / 2), (game.height / 2) - (onscreenHeight / 2) , onscreenWidth, onscreenHeight);
	graphics.endFill();
	
	//patternSprite.mask = graphics;
	
	return graphics;
}

// Calculate millimeter size of one pixel.
function calculateScale (width, height, margin){
	var outerRatio = game.width / game.height;
	var innerRatio = (width + margin) / (height + margin);
	var scale = 0;
	if (outerRatio > innerRatio){
		// use height
		scale = (height + margin) / game.height;
	} else {
		// use width
		scale = (width + margin) / game.width;
	}
	return scale;
}

function resize (width, height) {
	
	game.scale.setGameSize(width,height);
	/*game.width = width;
	game.height = height;
	
	//game.stage.bounds.width = width;
	//game.stage.bounds.height = height;
	
	game.camera.setSize(width, height);
	*/
	//pixelSize = calculateScale(width, height, millimeterMargin);
}

// Linear interpolation of points.
function lerpPoint (a, b, m) {
	var returnValue = new Phaser.Point();
	
	returnValue.x = ((b.x - a.x) * Number(m)) + a.x;
	returnValue.y = ((b.y - a.y) * Number(m)) + a.y;
	
	return returnValue;
}

function lerp (a, b, m) {
	return ((Number(b) - Number(a)) * Number(m)) + Number(a);
}