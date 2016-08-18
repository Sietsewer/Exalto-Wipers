/*jshint unused: vars, browser: true, couch: false, devel: false, worker: false, node: false, nonstandard: false, phantom: false, rhino: false, wsh: false, yui: false, browserify: false, shelljs: false, jasmine: false, mocha: false, qunit: false, typed: false, dojo: false, jquery: false, mootools: false, prototypejs: false*/
/*globals Phaser*/

// phaser 2.6.1
var game = new Phaser.Game(2480, 3508, Phaser.CANVAS, 'graphicView', { preload: preload, create: create, update: update });

var pixelSize = 0;
var millimeterMargin = 1000;

var windowPattern;
var windowGraphic;

function preload() {
	loadAssets();
}

function create() {
	game.stage.backgroundColor = "#ffffff";
	windowPattern = game.add.tileSprite(0,0,game.width, game.height, 'line_tile_black');
	windowGraphic = game.add.graphics(0, 0);
	
	windowPattern.mask = windowGraphic;
}

function update() {
}

function loadAssets (){
	game.load.image('line_tile_black', 'assets/line_tile_black.png');
}

function drawSheme (data) {
	var mmWidth = data.inputData.windowData.topWidth;
	var mmHeight = data.inputData.windowData.height;
	
	pixelSize = calculateScale(mmWidth, mmHeight, millimeterMargin);
	
	buildWindow (windowGraphic, mmWidth, mmHeight, windowPattern);
}

function buildWindow(graphics, width, height, patternSprite) {
	graphics.clear();
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
		scale = height / game.height;
	} else {
		// use width
		scale = width / game.width;
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