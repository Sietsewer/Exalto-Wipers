/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
/*globals Phaser, limits, baseData*/
// phaser 2.6.1
var game = new Phaser.Game((210 * 0.0393701) * 72, (148 * 0.0393701) * 72, Phaser.CANVAS, 'graphicsDisplay', { preload: preload, create: create, update: update });

var pixelSize = 0;
var millimeterMargin = 300;

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

var staticElements;

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
	
	
	wiperMarkVisible = game.add.graphics(0,0);
	wiperMarkMask = game.add.graphics(0,0);
	
	bladeSprites = game.add.group();


	wiperMarkVisible.mask = wiperMarkMask;
	wiperGraphic = game.add.graphics(0, 0);

	sprites = game.add.group();
	
	textGroup = game.add.group();
	
	staticElements = game.add.group();

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
function drawMeasure (graphics, startPoint, endPoint, group, lableAngle, anchor){
	graphics.lineStyle(2, lineColor);
	
	if((anchor === null) || (anchor === undefined)){
		anchor = 0.5;
	}
	
	var boundLength = 30 / pixelSize;
	var lineDistance = 20 / pixelSize;
	var direction = new Phaser.Point(endPoint.x - startPoint.x, endPoint.y - startPoint.y).normalize();
	var distance = startPoint.distance(endPoint);
	var normalDirection = new Phaser.Point(direction.y, -direction.x);
	
	var textOffset = 10 / pixelSize;
	
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
	
	// Draw arrows
	
	var arrow1 = game.add.sprite(startPoint.x + (normalDirection.x * lineDistance), startPoint.y + (normalDirection.y * lineDistance), "arrow");
	var arrow2 = game.add.sprite(endPoint.x + (normalDirection.x * lineDistance), endPoint.y + (normalDirection.y * lineDistance), "arrow");

	arrow1.scale.setTo(0.25/pixelSize, 0.4/pixelSize);
	arrow2.scale.setTo(0.25/pixelSize, 0.4/pixelSize);
	
	arrow1.anchor.x = (0);
	arrow1.anchor.y = (0.5);

	arrow2.anchor.x = (0);
	arrow2.anchor.y = (0.5);
	
	arrow1.tint = lineColor;
	arrow2.tint = lineColor;
	
		
	group.add(arrow1);
	group.add(arrow2);
	
	var angle = Math.atan2(direction.y, direction.x) * 57.2958;
	
	arrow1.angle = angle;
	arrow2.angle = angle + 180;
	
	var textPos = lerpPoint(
		new Phaser.Point(startPointOffsetX + (normalDirection.x * textOffset), startPointOffsetY + (normalDirection.y * textOffset)),
		new Phaser.Point(endPointOffsetX + (normalDirection.x * textOffset), endPointOffsetY + (normalDirection.y * textOffset)),
		0.5);
	
	var textAngle = Math.atan2(direction.y, direction.x) * 57.2958;
	// Make sure text is at a readable angle
	if (textAngle > 90 || textAngle < -90){
		textAngle += 180;
	}
	
	
	if(!(lableAngle === undefined || lableAngle === null)){
		textAngle = lableAngle;
	}
	
	var lineLable = game.add.bitmapText(textPos.x, textPos.y, 'arial', SizeNotation(Math.round(distance * pixelSize)), 25 / pixelSize);
	
	lineLable.anchor.setTo(anchor); 
	
	if (document.getElementById("location").value === "bottom") {
		textAngle += 180;
	}
	
	lineLable.angle = textAngle;
	

	
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
	game.load.image('arrow','assets/arrow.png');
	game.load.image('logo','assets/exalto_logo_2927x924.png');
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
		
		var a = new Phaser.Point(Math.sin(radsAngle / 2) * ((distance + (bladeLength/2)) / pixelSize), Math.cos(radsAngle / 2) * ((distance + (bladeLength/2)) / pixelSize));
		
		var pointL = new Phaser.Point(xPos - a.x, a.y + yPos);
		var pointR = new Phaser.Point(a.x + xPos, a.y + yPos);
		var pointLL = new Phaser.Point(pointL.x, ((distance + (bladeLength/2)) / pixelSize) + yPos);
		var pointRL = new Phaser.Point(pointR.x, pointLL.y);
		
		
		
		//var measureL = new Phaser.Point(pointAx, yPos + (hOffset/pixelSize) + (distance/pixelSize) + ((bladeLength/2) / pixelSize));
		//var measureR = new Phaser.Point(pointBx, measureL.y);
		
		drawMeasure (measurementGraphics, pointRL, pointLL, textGroup);
		
		measurementGraphics.moveTo(pointL.x,pointL.y);		
    	measurementGraphics.lineTo(pointLL.x, pointLL.y);
				
		measurementGraphics.moveTo(pointRL.x, pointRL.y);
    	measurementGraphics.lineTo(pointR.x, pointR.y);
		
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
		visGraphics.lineTo(pointAx, pointAy + (bladeLength/2) / pixelSize);
		visGraphics.lineTo(pointBx, pointBy + (bladeLength/2) / pixelSize);
		visGraphics.endFill();
		
		visGraphics.lineStyle(2, 0xffffff, 1);

		
		visGraphics.beginFill(0xffffff);
		visGraphics.arc(xPos + (hOffset / pixelSize), bottomHeight, distance / pixelSize, game.math.degToRad(90 - (angle / 2)),game.math.degToRad(90 + (angle / 2)));
		visGraphics.lineTo(pointAx, pointAy + ((bladeLength/2) / pixelSize));
		visGraphics.lineTo(pointBx, pointBy + ((bladeLength/2) / pixelSize));
		visGraphics.endFill();
		
		var measureL = new Phaser.Point(pointAx, yPos + (hOffset/pixelSize) + (distance/pixelSize) + ((bladeLength/2) / pixelSize));
		var measureR = new Phaser.Point(pointBx, measureL.y);
		
		drawMeasure (measurementGraphics, measureR, measureL, textGroup);
		
		measurementGraphics.moveTo(measureR.x,measureR.y);		
    	measurementGraphics.lineTo(pointBx, pointBy + ((bladeLength/2) / pixelSize));
				
		measurementGraphics.moveTo(measureL.x, measureL.y);
    	measurementGraphics.lineTo(pointAx, pointAy + ((bladeLength/2) / pixelSize));
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
		fixtureSprite.tint = fillColor;
		fixtureSprite.alpha = alpha;
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
	
	staticElements.destroy();
	staticElements = game.add.group();
	// -- //
	
	//var mmWidth = Number(data.inputData.windowData.topWidth);
	//var mmHeight = Number(data.inputData.windowData.height);
	
	var mmWidth = Number(baseData.windowRaw.width);
	var mmHeight = Number(baseData.windowRaw.height);
	
	var vOffsetMargin = baseData.windowRaw.centreDistance;
	if(vOffsetMargin < 0){
		vOffsetMargin = 0;
	}
	
	
	pixelSize = calculateScale(mmWidth, mmHeight + vOffsetMargin, millimeterMargin);
	var pixelMargin = millimeterMargin / pixelSize;

	if(!isPreview){
	var logoSprite = game.add.sprite(pixelMargin/3, pixelMargin/3, "logo");
	logoSprite.scale.setTo((1/1324) * (pixelMargin/3), (1/1324) * (pixelMargin/3));
	staticElements.add(logoSprite);
	}
	
	
	//pixelSize = calculateScale(mmWidth, mmHeight + Math.abs(Number(data.inputData.windowData.centreDistance) * 2), millimeterMargin);
	

	
	buildWindow (windowGraphic, mmWidth, mmHeight, windowPattern, pixelMargin);
	
	var pixelWidth = mmWidth / pixelSize;
	var pixelHeight = mmHeight / pixelSize;
	
	var pointA = new Phaser.Point((game.width - pixelWidth) / 2,				((game.height - pixelHeight) / 2) + (baseData.windowRaw.centreDistance/pixelSize));
	var pointB = new Phaser.Point( game.width - ((game.width - pixelWidth) / 2),((game.height - pixelHeight) / 2) + (baseData.windowRaw.centreDistance/pixelSize));
	var pointC = new Phaser.Point( game.width - ((game.width - pixelWidth) / 2), (game.height - ((game.height - pixelHeight) / 2)) + (baseData.windowRaw.centreDistance/pixelSize));
	var pointD = new Phaser.Point((game.width - pixelWidth) / 2,				 (game.height - ((game.height - pixelHeight) / 2)) + (baseData.windowRaw.centreDistance/pixelSize));
	

	//drawMeasure (measurementGraphics, new Phaser.Point(500, 100), new Phaser.Point(500, 500));
	//drawMeasure (measurementGraphics, new Phaser.Point(100, 100), new Phaser.Point(500, 100));
	
	//var wiperOrigin = new Phaser.Point((game.width * pixelSize) / 2,(pointA.y * pixelSize) - data.inputData.windowData.centreDistance);
	var wiperOrigin = new Phaser.Point((game.width * pixelSize) / 2,(pointA.y * pixelSize) - baseData.windowRaw.centreDistance);
	//var wiperBladePoint = new Phaser.Point(,);
	
	var final = calcFinal();
	
	var hasHoH = isFinite(limits.arm.hoh) && (limits.arm.hoh > 0);
	
	if(final !== null && (hasHoH || !(baseData.window.isPantograph) && (isFinite(limits.arm.armMax) && isFinite(limits.blade.bladeLength) && isFinite(limits.motor.angleMax)))){
		
		drawWipedArea(wiperMarkVisible, wiperMarkMask, baseData.windowRaw.wiperType, wiperOrigin, final.wipeAngle, final.length, 0, final.optimalArmLength);
		
		var bladeOriginX = Math.sin(game.math.degToRad(final.wipeAngle / 2)) * (final.optimalArmLength / pixelSize);
		var bladeOriginY = Math.cos(game.math.degToRad(final.wipeAngle / 2)) * (final.optimalArmLength / pixelSize);
		//drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, 0, data.armLenth , 0xdddddd, 0.3, bladeSprites, data.bladeLength, data.inputData.windowData.wiperType === "pantograph");
	
		drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, final.wipeAngle/2, final.optimalArmLength , 0xdddddd, 0.7, bladeSprites, final.length, baseData.windowRaw.wiperType === "pantograph");
		drawWiperArm(wiperGraphic, wiperOrigin.x, wiperOrigin.y, -final.wipeAngle/2, final.optimalArmLength , 0xffffff, 1, bladeSprites, final.length, baseData.windowRaw.wiperType === "pantograph");
		
    		//top measure
    	var pointTopMeasure = new Phaser.Point(pointB.x, wiperOrigin.y / pixelSize);
		var pointTopMeasureL = new Phaser.Point(pointA.x, wiperOrigin.y / pixelSize);
		
		if(baseData.window.isPantograph){
			var armOffset = 0;
			if(limits.arm.centreMounted){
				armOffset = (limits.arm.hoh/2)/pixelSize;
			}
			
			var armOrigX = (wiperOrigin.x / pixelSize) + armOffset;
			var armOrigY = (wiperOrigin.y / pixelSize);
			
			var armOrig = new Phaser.Point(armOrigX, armOrigY);
			
			var armOrig2 = new Phaser.Point(armOrigX - (limits.arm.hoh)/pixelSize, armOrigY);
			
			
			
			if (baseData.windowRaw.centreDistance > 0){
				drawMeasure (measurementGraphics, pointC, pointD, textGroup);
				drawMeasure (measurementGraphics, pointB, pointC, textGroup);
				
				drawMeasure (measurementGraphics, pointTopMeasureL, armOrig2, textGroup);
				drawMeasure (measurementGraphics, armOrig2, armOrig, textGroup);
				drawMeasure (measurementGraphics, armOrig, pointTopMeasure, textGroup);
				
				drawMeasure(measurementGraphics, pointTopMeasure, pointB, textGroup);
    			measurementGraphics.moveTo(pointTopMeasureL.x, pointTopMeasureL.y);
    			measurementGraphics.lineTo(pointA.x, pointB.y);
				
				
			} else if (baseData.windowRaw.centreDistance < 0) {
				
				var armOrigTop = new Phaser.Point(armOrig.x, pointA.y);
				var armOrig2Top = new Phaser.Point(armOrig2.x, pointA.y);
				
				drawMeasure (measurementGraphics, pointC, pointD, textGroup);
				drawMeasure (measurementGraphics, pointTopMeasure, pointC, textGroup);
				
				drawMeasure (measurementGraphics, pointA, armOrig2Top, textGroup);
				drawMeasure (measurementGraphics, armOrig2Top, armOrigTop, textGroup);
				drawMeasure (measurementGraphics, armOrigTop, pointB, textGroup);
				
				drawMeasure(measurementGraphics, pointB, pointTopMeasure, textGroup);
				
    			measurementGraphics.moveTo(armOrig.x, armOrig.y);
    			measurementGraphics.lineTo(armOrigTop.x, armOrigTop.y);
				
				measurementGraphics.moveTo(armOrig2.x, armOrig2.y);
    			measurementGraphics.lineTo(armOrig2Top.x, armOrig2Top.y);
			} else { // zero
				var armOrigTop = new Phaser.Point(armOrig.x, pointA.y);
				var armOrig2Top = new Phaser.Point(armOrig2.x, pointA.y);
				
				drawMeasure (measurementGraphics, pointC, pointD, textGroup);
				drawMeasure (measurementGraphics, pointTopMeasure, pointC, textGroup);
				
				drawMeasure (measurementGraphics, pointA, armOrig2Top, textGroup);
				drawMeasure (measurementGraphics, armOrig2Top, armOrigTop, textGroup);
				drawMeasure (measurementGraphics, armOrigTop, pointB, textGroup);
				
				drawMeasure(measurementGraphics, pointB, pointTopMeasure, textGroup);
				
    			measurementGraphics.moveTo(armOrig.x, armOrig.y);
    			measurementGraphics.lineTo(armOrigTop.x, armOrigTop.y);
				
				measurementGraphics.moveTo(armOrig2.x, armOrig2.y);
    			measurementGraphics.lineTo(armOrig2Top.x, armOrig2Top.y);
			}
		} else {
			
			var armOrigX = (wiperOrigin.x / pixelSize);
			var armOrigY = (wiperOrigin.y / pixelSize);
			
			var armOrig = new Phaser.Point(armOrigX, armOrigY);
			
			var armOrig2 = new Phaser.Point(armOrigX - (limits.arm.hoh)/pixelSize, armOrigY);
			
			
			if (baseData.windowRaw.centreDistance > 0){
				drawMeasure (measurementGraphics, pointC, pointD, textGroup);
				drawMeasure (measurementGraphics, pointB, pointC, textGroup);
				
				drawMeasure (measurementGraphics, pointTopMeasureL, armOrig, textGroup);
				drawMeasure (measurementGraphics, armOrig, pointTopMeasure, textGroup);
				
				drawMeasure(measurementGraphics, pointTopMeasure, pointB, textGroup);
    			measurementGraphics.moveTo(pointTopMeasureL.x, pointTopMeasureL.y);
    			measurementGraphics.lineTo(pointA.x, pointB.y);
				
				
			} else if (baseData.windowRaw.centreDistance < 0) {
				
				var armOrigTop = new Phaser.Point(armOrig.x, pointA.y);
				//var armOrig2Top = new Phaser.Point(armOrig2.x, pointA.y);
				
				drawMeasure (measurementGraphics, pointC, pointD, textGroup);
				drawMeasure (measurementGraphics, pointTopMeasure, pointC, textGroup);
				
				drawMeasure (measurementGraphics, pointA, armOrigTop, textGroup);
				drawMeasure (measurementGraphics, armOrigTop, pointB, textGroup);
				
				drawMeasure(measurementGraphics, pointB, pointTopMeasure, textGroup);
				
    			measurementGraphics.moveTo(armOrig.x, armOrig.y);
    			measurementGraphics.lineTo(armOrigTop.x, armOrigTop.y);
				
			} else { // zero
				var armOrigTop = new Phaser.Point(armOrig.x, pointA.y);
				
				drawMeasure (measurementGraphics, pointC, pointD, textGroup);
				drawMeasure (measurementGraphics, pointTopMeasure, pointC, textGroup);
				
				drawMeasure (measurementGraphics, pointA, armOrigTop, textGroup);
				drawMeasure (measurementGraphics, armOrigTop, pointB, textGroup);
				
				drawMeasure(measurementGraphics, pointB, pointTopMeasure, textGroup);
				
    			measurementGraphics.moveTo(armOrig.x, armOrig.y);
    			measurementGraphics.lineTo(armOrigTop.x, armOrigTop.y);
			}
		}
		
		var percentX = wiperOrigin.x;
		var percentY = wiperOrigin.y + final.optimalArmLength;
		
		percentX /= pixelSize;
		percentY /= pixelSize;
		
		var percentage = Math.round(final.wipePercentage * 100);
		percentage = percentage + "%";
		
		
		var percentageLable = game.add.bitmapText(percentX, percentY, 'arial', percentage , 60 / pixelSize);
		
		percentageLable.alpha = 0.5;
		
		percentageLable.anchor.setTo(0.5); 
		
		if (document.getElementById("location").value === "bottom") {
			percentageLable.angle = 180;
		}
	
		textGroup.add(percentageLable);
		
		// rotation magic
		
		
		//windowPattern.width = game.width;
		//windowPattern.height = game.height;
	
		if (document.getElementById("location").value === "bottom") {
		
		windowGraphic.angle = 180;
		measurementGraphics.angle = 180;
	
		textGroup.angle = 180;
		
		wiperMarkMask.angle = 180;
		wiperMarkVisible.angle = 180;
	
		bladeSprites.angle = 180;
	
		wiperGraphic.angle = 180;
	
		sprites.angle = 180;
		
		windowGraphic.x = game.width;
		measurementGraphics.x = game.width;
	
		textGroup.x = game.width;
		
		wiperMarkMask.x = game.width;
		wiperMarkVisible.x = game.width;
	
		bladeSprites.x = game.width;
	
		wiperGraphic.x = game.width;
	
		sprites.x = game.width;
		
		windowGraphic.y = game.height;
		measurementGraphics.y = game.height;
	
		textGroup.y = game.height;
		
		wiperMarkMask.y = game.height;
		wiperMarkVisible.y = game.height;
	
		bladeSprites.y = game.height;
	
		wiperGraphic.y = game.height;
	
		sprites.y = game.height;
		} else {
			
		windowGraphic.angle = 0;
		measurementGraphics.angle = 0;
	
		textGroup.angle = 0;
		
		wiperMarkMask.angle = 0;
		wiperMarkVisible.angle = 0;
	
		bladeSprites.angle = 0;
	
		wiperGraphic.angle = 0;
	
		sprites.angle = 0;
		
		windowGraphic.x = 0;
		measurementGraphics.x = 0;
	
		textGroup.x = 0;
		
		wiperMarkMask.x = 0;
		wiperMarkVisible.x = 0;
	
		bladeSprites.x = 0;
	
		wiperGraphic.x = 0;
	
		sprites.x = 0;
		
		windowGraphic.y = 0;
		measurementGraphics.y = 0;
	
		textGroup.y = 0;
		
		wiperMarkMask.y = 0;
		wiperMarkVisible.y = 0;
	
		bladeSprites.y = 0;
	
		wiperGraphic.y = 0;
	
		sprites.y = 0;
		}
		
		// end magic
		
		if(!isPreview){
			//var logoSprite = game.add.sprite(pixelMargin/3, pixelMargin/3, "logo");
			//logoSprite.scale.setTo((1/946) * (pixelMargin/3), (1/946) * (pixelMargin/3));
			//sprites.add(logoSprite);
			
			var headerText = "Arm Length: \t\t" + SizeNotation(final.optimalArmLength) + "\nBlade Length: \t" + SizeNotation(final.length) + "\nWipe Angle: \t\t" + Math.round((Number(final.wipeAngle)) * 10) / 10 + "°";
			
			var headerLable = game.add.bitmapText(((pixelMargin/3)*2) + (((1/1324) * (pixelMargin/3)) * 3380), pixelMargin/3 + (((1/1324) * (pixelMargin/3)) * (1324/2)), 'arial', headerText , 25 / pixelSize);
	
			var partText = "Arm: \t\t" + selectedParts.arm.name + "\nMotor: \t\t" + selectedParts.motor.name + "\nBlade: \t\t" + selectedParts.blade.artNr;
			
			var headerParts = game.add.bitmapText(((pixelMargin/3)*2.5) + (((1/1324) * (pixelMargin/3)) * 3380) + headerLable.textWidth, pixelMargin/3 + (((1/1324) * (pixelMargin/3)) * (1324/2)), 'arial', partText , 25 / pixelSize);
			
			var projectText = "Client: \t\t" + document.getElementById("pName").value + "\nProject: \t\t" + document.getElementById("pReference").value + "\nDate: \t\t" + document.getElementById("pDate").value;
			
			var headerProject = game.add.bitmapText(((pixelMargin/3)*3) + (((1/1324) * (pixelMargin/3)) * 3380) + headerLable.textWidth + headerParts.textWidth, pixelMargin/3 + (((1/1324) * (pixelMargin/3)) * (1324/2)), 'arial', projectText , 25 / pixelSize);
			
			var maxPWidth = game.width - ((pixelMargin/3)*4) + (((1/1324) * (pixelMargin/3)) * 3380) + headerLable.textWidth;
			
			headerProject.maxWidth = maxPWidth;
			
			headerParts.anchor.setTo(0,0.5);
			
			headerLable.anchor.setTo(0,0.5); 
			
			headerProject.anchor.setTo(0,0.5);
			
			staticElements.add(headerParts);
			
			staticElements.add(headerLable);
			
			staticElements.add(headerProject);
		
			// Now for the bottom
			
			var bottom1 = "Exalto B.V.\nP.O. Box 40";
			var bottom2 = "3370 AA Hardinxveld-Giessendam\nThe Netherlands";
			var bottom3 = "T:\t\t+31 (0)184 615 800\nF:\t\t+31 (0)184 614 045";
			var bottom4 = "I:\t\twww.exalto.com\nE:\t\tsales@exalto.com";
			
			var m = pixelMargin/3;
			var bottomX = m;
			var bottomY = game.height - m;
			
			var bottom1Lable = game.add.bitmapText(bottomX,
												   bottomY, 'arial', bottom1, 25/pixelSize);
			var bottom2Lable = game.add.bitmapText(bottomX + bottom1Lable.width + (m * 1),
												   bottomY, 'arial', bottom2, 25/pixelSize);
			var bottom3Lable = game.add.bitmapText(bottomX + bottom1Lable.width + bottom2Lable.width + (m * 2),
												   bottomY, 'arial', bottom3, 25/pixelSize);
			var bottom4Lable = game.add.bitmapText(bottomX + bottom1Lable.width + bottom2Lable.width + bottom3Lable.width + (m * 3),
												   bottomY, 'arial', bottom4, 25/pixelSize);
			
			bottom1Lable.anchor.setTo(0,0.5);
			bottom2Lable.anchor.setTo(0,0.5);
			bottom3Lable.anchor.setTo(0,0.5);
			bottom4Lable.anchor.setTo(0,0.5);
			
			staticElements.add(bottom1Lable);
			staticElements.add(bottom2Lable);
			staticElements.add(bottom3Lable);
			staticElements.add(bottom4Lable);

		}
		
		//lineLable.angle = textAngle;
		
		
    	//drawMeasure(measurementGraphics, pointTopMeasure, pointB, textGroup);
    	//measurementGraphics.moveTo(pointTopMeasureL.x, pointTopMeasureL.y);
    	//measurementGraphics.lineTo(pointA.x, pointB.y);
		
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

function buildWindow(graphics, width, height, patternSprite, pixelMargin) {
	// Assume starting from top-left, when drawing.
	var onscreenWidth = width / pixelSize;
	var onscreenHeight = height / pixelSize;
	
	var offset = (baseData.windowRaw.centreDistance > 0 ? baseData.windowRaw.centreDistance : 0 + millimeterMargin) / pixelSize;
	graphics.lineStyle(2, 0xffffff, 1);
	
	var pointA = new Phaser.Point((game.width - onscreenWidth) / 2,				((game.height - onscreenHeight) / 2) + offset);
	var pointB = new Phaser.Point( game.width - ((game.width - onscreenWidth) / 2),((game.height - onscreenHeight) / 2) + offset);
	var pointC = new Phaser.Point( game.width - ((game.width - onscreenWidth) / 2), (game.height - ((game.height - onscreenHeight) / 2)) + offset);
	var pointD = new Phaser.Point((game.width - onscreenWidth) / 2,				 (game.height - ((game.height - onscreenHeight) / 2)) + offset);
	
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
	
	if(isPreview){
		margin /= 2;
	}
	
	var outerRatio = game.width / game.height;
	var innerRatio = (width + margin + margin) / (height + margin + margin);
	var scale = 0;
	if (outerRatio > innerRatio){
		// use height
		scale = (height + (2* margin)) / game.height;
	} else {
		// use width
		scale = (width + (2* margin)) / game.width;
	}
	return scale;
}

var isPreview = false;

function resize (width, height,data) {
	
	if (data === null || data === undefined){
		game.scale.setGameSize(width, height);
		isPreview = true;
		return;
	}
	isPreview = false;
	
	var maxVal = 0;
	var minVal = 0;
	
	if (width > height){
		maxVal = width;
		minVal = height;
	} else {
		maxVal = height;
		minVal = width;
	}
	
	//if (Number(data.inputData.windowData.height) + Number(data.inputData.windowData.centreDistance) < Number(data.inputData.windowData.topWidth)){
	//	game.scale.setGameSize(minVal,maxVal);
	//} else {
		game.scale.setGameSize(maxVal,minVal);
	//}
	
	pixelSize = calculateScale(Number(data.inputData.windowData.topWidth), Number(data.inputData.windowData.height), millimeterMargin);
	
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