/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
/*globals Phaser, limits, baseData*/
// phaser 2.6.1
var game = new Phaser.Game((210 * 0.0393701) * 72, (148 * 0.0393701) * 72, Phaser.CANVAS, 'graphicsDisplay', { preload: preload, create: create, update: update });

var pixelSize = 0;
var millimeterMargin = 100;

var windowPattern;
var windowGraphic;

var wiperMarkMask;
var wiperMarkVisible;

var wiperGraphic;

var measurementGraphics;
var textGroup; // Use to be able to remove text from the screen.

var sprites;
var bladeSprites;

var lineColor	= 0x444444;
var fillColor1	= 0xffffff;
var fillColor2	= 0x999999;

var parallelDistance = 80;

function preload() {
	loadAssets();
	game.state.onRenderCallback = renderDone;
}

var updateStack = [];

function inUpdate(func){
	updateStack.push(func);
}

var drawCount;
var drawMin = 10;

function renderDone (){
	if (drawDone){
		if(drawCount >= drawMin){
			while(updateStack.length > 0){
				updateStack.pop()();
			}
		} else {
			drawCount++;
		}
	} else {
		drawCount = 0;	
	}
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
	
	bladeSprites = game.add.group();


	wiperMarkVisible.mask = wiperMarkMask;
	wiperGraphic = game.add.graphics(0, 0);

	sprites = game.add.group();
	

	// Render order
	
	textGroup.z = 22;
	measurementGraphics.z = 21;
	
	wiperMarkMask.z = 20;
	wiperMarkVisible.z = 19;
	
	wiperGraphic.z = 18;
	
	bladeSprites.z = 17;
	
	windowGraphic.z = 16;
	windowPattern.z = 15;
	
	sprites.z = 14
}

// Measurements are always on the right side.
function drawMeasure (graphics, startPoint, endPoint, group){
	graphics.lineStyle(2, lineColor);
	
	var boundLength = 30 / pixelSize;
	var lineDistance = 20 / pixelSize;
	var direction = new Phaser.Point(endPoint.x - startPoint.x, endPoint.y - startPoint.y).normalize();
	var distance = startPoint.distance(endPoint);
	var normalDirection = new Phaser.Point(direction.y, -direction.x);
	
	// Draw bounds
	
	graphics.lineStyle(1, lineColor);
	
	var startPointOffsetX = startPoint.x + (normalDirection.x * boundLength);
	var startPointOffsetY = startPoint.y + (normalDirection.y * boundLength);
	
	graphics.moveTo(startPoint.x, startPoint.y);
	graphics.lineTo(startPointOffsetX, startPointOffsetY);
	

	var endPointOffsetX = endPoint.x + (normalDirection.x * boundLength);
	var endPointOffsetY = endPoint.y + (normalDirection.y * boundLength);
	
	graphics.moveTo(endPoint.x, endPoint.y);
	graphics.lineTo(endPointOffsetX, endPointOffsetY);
	
	//graphics.lineStyle(1, lineColor);
	
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
	
	
	var lineLable = game.add.bitmapText(textPos.x, textPos.y, 'arial', SizeNotation(Math.round(distance * pixelSize)), 25 / pixelSize);
	lineLable.angle = textAngle;
	
	lineLable.anchor.setTo(0.5); 
	
	if(group !== null){
		group.add(lineLable);
	}
	
}
 

function update() {
}

function loadAssets (){
	game.load.image('line_tile_black', 'assets/line_tile_blue.png');
	game.load.bitmapFont('arial', 'assets/arial.png', 'assets/arial.fnt');
	game.load.image('arm_sprite','assets/wiperSprite_arm_top.png');
	game.load.image('arm_fixture','assets/wiperSprite_blade_pantograph_fixture.png');
	game.load.image('arm_fixture_centred','assets/wiperSprite_blade_pantograph_fixture_centred.png');
	game.load.image('blade','assets/wiperSprite_blade_base.png');
	
}

function drawWipedArea (visGraphics, maskGraphics, wiperType, point, angle, bladeLength, hOffset, distance) 
{
	visGraphics.clear();
	maskGraphics.clear();
	
	var xPos = point.x / pixelSize;
	var yPos = point.y / pixelSize;
	
	//visGraphics.lineStyle(2, 0xffffff, 1);
	//visGraphics.moveTo(point.x, point.y);
	//visGraphics.lineTo(point.x, point.y  + areaEnd);
	
	var areaStart = distance - (bladeLength / 2);
	var areaEnd = distance + (bladeLength / 2);
	
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
		
		
		
		visGraphics.lineStyle(2, 0xffffff, 1);
		visGraphics.beginFill(0xffffff);
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
		maskGraphics.beginFill(0xffffff);
		maskGraphics.drawCircle(xPos + (hOffset / pixelSize), yPos, (areaEnd / pixelSize) * 2);
		maskGraphics.endFill();

	} else if (wiperType === "pantograph") {
		visGraphics.mask = null;
		// Calc local positions
		
		//visGraphics.lineStyle(2, 0xffffff, 1);
		//visGraphics.drawCircle(xPos + (hOffset / pixelSize), yPos, (distance * 2) / pixelSize);
		
		pointAxL = Math.sin(radsAngle / 2) * (distance / pixelSize);
		pointAyL = Math.cos(radsAngle / 2) * (distance / pixelSize);
		
		// Calc global positions
		
		pointAx = xPos - pointAxL + (hOffset / pixelSize);
		pointAy = yPos + pointAyL;
		
		pointBx = xPos + pointAxL + (hOffset / pixelSize);
		pointBy = yPos + pointAyL;
		
		var topHeight = yPos + ((bladeLength / 2) / pixelSize);
		var bottomHeight = yPos - ((bladeLength / 2) / pixelSize);
		
		// visable graphic
		
		visGraphics.lineStyle(2, 0xffffff, 1);
		
		visGraphics.beginFill(0xffffff);
		visGraphics.arc(xPos + (hOffset / pixelSize), topHeight, distance / pixelSize, game.math.degToRad(90 - (angle / 2)),game.math.degToRad(90 + (angle / 2)));
		visGraphics.lineTo(pointAx, pointAy);
		visGraphics.lineTo(pointBx, pointBy);
		visGraphics.endFill();
		
		visGraphics.lineStyle(2, 0xffffff, 1);

		
		visGraphics.beginFill(0xffffff);
		visGraphics.arc(xPos + (hOffset / pixelSize), bottomHeight, distance / pixelSize, game.math.degToRad(90 - (angle / 2)),game.math.degToRad(90 + (angle / 2)));
		visGraphics.lineTo(pointAx, pointAy + ((bladeLength/2) / pixelSize));
		visGraphics.lineTo(pointBx, pointBy + ((bladeLength/2) / pixelSize));
		visGraphics.endFill();
	}
}


function drawWiperArm (graphics, PstartX, PstartY, angle, length, fillColor, alpha, bladeSpriteGroup, bladeLength, isPantograph) {
	
	var startX = PstartX / pixelSize;
	var startY = PstartY / pixelSize;
	
	var armOffset = 0;
	if(limits.arm.centreMounted){
		armOffset = (limits.arm.hoh/2)/pixelSize;
	}
	
	var endX = (Math.sin(game.math.degToRad(-angle)) * (length / pixelSize)) + startX;
	var endY = (Math.cos(game.math.degToRad(-angle)) * (length / pixelSize)) + startY;
	
	var bladeSprite = game.add.sprite(endX, endY, "blade");
	bladeSprite.scale.setTo(1/2048 * (Number(bladeLength) / pixelSize),1/2048 * (Number(bladeLength) / pixelSize));
	if(fillColor !== null){
		bladeSprite.tint = fillColor;
	}
	if(alpha !== null){
		bladeSprite.alpha = alpha;
	}
	
	bladeSpriteGroup.add(bladeSprite);
	bladeSprite.anchor.x = 0.5;
	bladeSprite.anchor.y = 0.5;

	
	var armScale = (0.5/475) * (limits.arm.armMin / pixelSize);
	
	if (limits.arm.armMax === limits.arm.armMin) {
		var armScale = (0.5/475) * ((limits.arm.armMin/3) / pixelSize);
	}
	
	var armThickness = armScale * 24;
	
	if(isPantograph){
		
		bladeSprite.angle = 90;
		
		var dist = Number(limits.arm.hoh) / pixelSize;
		
		var fixtureSprite = game.add.sprite(endX+armOffset, endY, limits.arm.centreMounted ? "arm_fixture_centred" : "arm_fixture");
		fixtureSprite.scale.setTo((1/160) * (dist),(1/160) * (dist));
		fixtureSprite.anchor.x = 0.75;
		fixtureSprite.anchor.y = 0.5;
		bladeSpriteGroup.add(fixtureSprite);
		// Second arm
		
		var pArmSprite = game.add.sprite(startX - dist+armOffset, startY, "arm_sprite");
		pArmSprite.scale.setTo(armScale, armScale);
		if(fillColor !== null){
			pArmSprite.tint = fillColor;
		}
		if(alpha !== null){
			pArmSprite.alpha = alpha;
		}
	
		sprites.add(pArmSprite);
		pArmSprite.anchor.x = 0.0625;
		pArmSprite.anchor.y = 0.5;
	
		pArmSprite.angle = angle + 90;
		
		graphics.beginFill(lineColor);
		graphics.drawCircle(endX-dist+armOffset, endY, armThickness + ((1/pixelSize) * 2));//(1/pixelSize) * 20);
		//graphics.endFill();
	
		graphics.moveTo(startX-dist+armOffset, startY);
		graphics.lineStyle(armThickness + ((1/pixelSize) * 2), lineColor);
		graphics.lineTo(endX-dist+armOffset, endY);
	
		graphics.moveTo(startX-dist+armOffset, startY);
		graphics.lineStyle(armThickness, fillColor);
		graphics.lineTo(endX-dist+armOffset, endY);
	
		graphics.lineStyle(0);
	
		graphics.beginFill(fillColor);
		graphics.drawCircle(endX-dist+armOffset, endY, armThickness );
	}else{
		bladeSprite.angle = angle + 90;
	}
	
	var armSprite = game.add.sprite(startX+armOffset, startY, "arm_sprite");
	armSprite.scale.setTo(armScale, armScale);
	if(fillColor !== null){
		armSprite.tint = fillColor;
	}
	if(alpha !== null){
		armSprite.alpha = alpha;
	}
	
	sprites.add(armSprite);
	armSprite.anchor.x = 0.0625;
	armSprite.anchor.y = 0.5;
	
	armSprite.angle = angle + 90;
		
	graphics.beginFill(lineColor);
	graphics.drawCircle(endX+armOffset, endY,  armThickness + ((1/pixelSize) * 2));
	//graphics.endFill();
	
	graphics.moveTo(startX+armOffset, startY);
	graphics.lineStyle( armThickness + ((1/pixelSize) * 2), lineColor);
	graphics.lineTo(endX+armOffset, endY);
	
	graphics.moveTo(startX+armOffset, startY);
	graphics.lineStyle(armThickness, fillColor);
	graphics.lineTo(endX+armOffset, endY);
	
	graphics.lineStyle(0);
	
	graphics.beginFill(fillColor);
	graphics.drawCircle(endX+armOffset, endY, armThickness);
	//graphics.endFill();
	
	//graphics.beginFill(fillColor2);
	//graphics.drawEllipse(endX, endY, (1/pixelSize) * 20, bladeLength / pixelSize)
	
	//drawMeasure (measurementGraphics, new Phaser.Point(PstartX, PstartY), new Phaser.Point(PendX, PendY), textGroup);
	//drawMeasure (measurementGraphics, new Phaser.Point(0, 0), new Phaser.Point(PendX, PendY), textGroup);
	//drawMeasure (measurementGraphics, new Phaser.Point(PstartX, PstartY), new Phaser.Point(0, 0), textGroup);
	
	game.world.bringToTop(graphics);
	game.world.bringToTop(sprites);
	
}

function drawWiper (graphics, point, data) {
	var wiperStartX;
	var wiperStartY;
	var wiperEndX;
	var wiperEndY;
	var wiperCentreX;
	var wiperCentreY;
	
	if (data.windowData.wiperType === "pendulum") {
		
	} else if (data.windowData.wiperType === "pantograph") {
		
	}
}

var drawDone = false;

function drawSheme (data) {
	drawCount = 0;	
	drawDone = false;
	// Clear old graphics.
	
	windowPattern.width = game.width;
	windowPattern.height = game.height;
	
	windowGraphic.clear();
	measurementGraphics.clear();
	
	textGroup.destroy();
	textGroup = game.add.group();
	
	wiperMarkMask.clear();
	wiperMarkVisible.clear();
	
	bladeSprites.destroy();
	bladeSprites = game.add.group();
	
	wiperGraphic.clear();
	
	sprites.destroy();
	sprites = game.add.group();
	// -- //
	
	//var mmWidth = Number(data.inputData.windowData.topWidth);
	//var mmHeight = Number(data.inputData.windowData.height);
	
	var mmWidth = Number(baseData.windowRaw.width);
	var mmHeight = Number(baseData.windowRaw.height);
	
	
	//pixelSize = calculateScale(mmWidth, mmHeight + Math.abs(Number(data.inputData.windowData.centreDistance) * 2), millimeterMargin);
	
	pixelSize = calculateScale(mmWidth, mmHeight + Math.abs(Number(baseData.windowRaw.centreDistance) * 2), millimeterMargin);

	
	
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
	
	//var wiperOrigin = new Phaser.Point((game.width * pixelSize) / 2,(pointA.y * pixelSize) - data.inputData.windowData.centreDistance);
	var wiperOrigin = new Phaser.Point((game.width * pixelSize) / 2,(pointA.y * pixelSize) - baseData.windowRaw.centreDistance);
	//var wiperBladePoint = new Phaser.Point(,);
	
	var final = calcFinal();
	
	var hasHoH = isFinite(limits.arm.hoh) && (limits.arm.hoh > 0);
	
	if(final !== null && (hasHoH || !(baseData.window.isPantograph))){
		
		
		drawWipedArea(wiperMarkVisible, wiperMarkMask, baseData.windowRaw.wiperType, wiperOrigin, final.wipeAngle, final.length, 0, final.optimalArmLength);
		
		var bladeOriginX = Math.sin(game.math.degToRad(final.wipeAngle / 2)) * (final.optimalArmLength / pixelSize);
		var bladeOriginY = Math.cos(game.math.degToRad(final.wipeAngle / 2)) * (final.optimalArmLength / pixelSize);
		//drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, 0, data.armLenth , 0xdddddd, 0.3, bladeSprites, data.bladeLength, data.inputData.windowData.wiperType === "pantograph");
	
		drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, final.wipeAngle/2, final.optimalArmLength , 0xdddddd, 0.7, bladeSprites, final.length, baseData.windowRaw.wiperType === "pantograph");
		drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, -final.wipeAngle/2, final.optimalArmLength , 0xffffff, 1, bladeSprites, final.length, baseData.windowRaw.wiperType === "pantograph");
		
    		//top measure
    	var pointTopMeasure = new Phaser.Point(pointB.x, wiperOrigin.y / pixelSize);
    	
    	drawMeasure(measurementGraphics, pointB, pointTopMeasure, textGroup);
    	measurementGraphics.moveTo(pointTopMeasure.x, pointTopMeasure.y);
    	measurementGraphics.lineTo(wiperOrigin.x / pixelSize, wiperOrigin.y / pixelSize);
		
	}
	
	
	/*
			
		drawWipedArea(wiperMarkVisible, wiperMarkMask, data.inputData.windowData.wiperType, wiperOrigin, data.maxWiperAngle, data.bladeLength, 0, data.armLenth);
		
		var bladeOriginX = Math.sin(game.math.degToRad(data.maxWiperAngle / 2)) * (data.armLenth / pixelSize);
		var bladeOriginY = Math.cos(game.math.degToRad(data.maxWiperAngle / 2)) * (data.armLenth / pixelSize);
		//drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, 0, data.armLenth , 0xdddddd, 0.3, bladeSprites, data.bladeLength, data.inputData.windowData.wiperType === "pantograph");
	
		drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, data.maxWiperAngle/2, data.armLenth , 0xdddddd, 0.7, bladeSprites, data.bladeLength, data.inputData.windowData.wiperType === "pantograph");
		drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, -data.maxWiperAngle/2, data.armLenth , 0xffffff, 1, bladeSprites, data.bladeLength, data.inputData.windowData.wiperType === "pantograph");
		
    		//top measure
    	var pointTopMeasure = new Phaser.Point(pointB.x, wiperOrigin.y / pixelSize);
    	
    	drawMeasure(measurementGraphics, pointB, pointTopMeasure, textGroup);
    	measurementGraphics.moveTo(pointTopMeasure.x, pointTopMeasure.y);
    	measurementGraphics.lineTo(wiperOrigin.x / pixelSize, wiperOrigin.y / pixelSize);
		
	*/
	drawDone = true;
	drawCount = 0;
}

function buildWindow(graphics, width, height, patternSprite) {
	// Assume starting from top-left, when drawing.
	var onscreenWidth = width / pixelSize;
	var onscreenHeight = height / pixelSize;
	graphics.lineStyle(2, 0xAAAAAA, 1);
	
	var pointA = new Phaser.Point((game.width - onscreenWidth) / 2,				(game.height - onscreenHeight) / 2);
	var pointB = new Phaser.Point( game.width - ((game.width - onscreenWidth) / 2),(game.height - onscreenHeight) / 2);
	var pointC = new Phaser.Point( game.width - ((game.width - onscreenWidth) / 2), game.height - ((game.height - onscreenHeight) / 2));
	var pointD = new Phaser.Point((game.width - onscreenWidth) / 2,				 game.height - ((game.height - onscreenHeight) / 2));
	
	graphics.moveTo(pointA.x, pointA.y);
	
	graphics.beginFill(0xffffff);
	graphics.lineTo(pointB.x,pointB.y);
	graphics.lineTo(pointC.x,pointC.y);
	graphics.lineTo(pointD.x,pointD.y);
	graphics.endFill();

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

function resize (width, height,data) {
	
	if (data === null || data === undefined){
		game.scale.setGameSize(width, height);
		return;
	}
	
	var maxVal = 0;
	var minVal = 0;
	
	if (width > height){
		maxVal = width;
		minVal = height;
	} else {
		maxVal = height;
		minVal = width;
	}
	
	if (Number(data.inputData.windowData.height) + Number(data.inputData.windowData.centreDistance) > Number(data.inputData.windowData.width)){
		game.scale.setGameSize(minVal,maxVal);
	} else {
		game.scale.setGameSize(maxVal,minVal);
	}
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