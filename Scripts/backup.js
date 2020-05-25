//-------------------------------
//			 PONG 3D Game
//-------------------------------

// scene object variables
var renderer, scene, camera1, camera2, pointLight, spotLight;

// field variables
var fieldWidth = 400, fieldHeight = 200;

// paddle variables
var paddleWidth, paddleHeight, paddleDepth, paddleQuality;
var paddle1DirY = 0, paddle2DirY = 0, paddleSpeed = 3;

// ball variables
var ball, paddle1, paddle2;
var ballDirX = 1, ballDirY = 1, ballSpeed = 2;

// used for changing ball's y rotation
var hit = 1;
var prevTime = performance.now();

// players score variable
var score1 = 0, score2 = 0;
// game max score
var maxScore = 5;

// set opponent reflexes (0 - easiest, 1 - hardest)
var difficulty = 0.2;

// scene size
var WIDTH = window.innerWidth, HEIGHT = 481	;

// game state
var state = 'PAUSED'; // Can be 'PLAY' or 'PAUSED'

// pause/unpause game
var pause_timeout;

// last sound
var last = -1;

function setup()
{
	// display the max score to win the game
	document.getElementById("winnerBoard").innerHTML = "First to " + maxScore + " wins!";

	// reset player and opponent scores
	score1 = 0;
	score2 = 0;
	
	// set up all the 3D objects in the scene	
	createScene();

	// load sounds
	loadSounds();
	
	// let the game begin
	render();
}

function createScene()
{
	// camera attributes
	var VIEW_ANGLE = 50,
	  	ASPECT = WIDTH / HEIGHT,
	 	NEAR = 0.01,
      	FAR = 10000;
      
    var c = document.getElementById("gameCanvas");

	// create WebGL renderer
	renderer = new THREE.WebGLRenderer( { antialias:true } );
	
	// create scene
	scene = new THREE.Scene();

	// create camera1 for player1
	camera1 = new THREE.PerspectiveCamera(
		VIEW_ANGLE,
		ASPECT,
		NEAR,
		FAR
	);

	// add the camera1 to the scene
    scene.add(camera1);
	
	// create camera2 for player2
    camera2 = new THREE.PerspectiveCamera(
		VIEW_ANGLE,
		ASPECT,
		NEAR,
		FAR
	);
    
	// add camera2 to the scene
    scene.add(camera2);
    
	// set renderer size
    renderer.setSize( WIDTH, HEIGHT );

	// attach the render-supplied DOM element
    c.appendChild(renderer.domElement);

	// set up the playing surface plane 
	var planeWidth = fieldWidth,
		planeHeight = fieldHeight,
		planeQuality = 10;

	// create grass texture
	var grassTexture = new THREE.ImageUtils.loadTexture("images/grass2.jpg");
		
	// create the paddle1's material
	var paddle1Material =
	  new THREE.MeshLambertMaterial(
		{
			// player 1 blue color paddle
			color: 0x0104FF
		});

	// create the paddle2's material
	var paddle2Material =
	  new THREE.MeshLambertMaterial(
		{
			// player 2 red color paddle
			color: 0xFF4045
		});

	// create the plane's material
	var planeMaterial =
	  new THREE.MeshLambertMaterial(
		{
		  color: 0x4BD121, // green color if texture is not found
		  map: grassTexture // add grass material
		});

	// create the table's material
	var tableMaterial =
	  new THREE.MeshLambertMaterial(
		{
		  color: 0x111111
		});

	// create the ground's material
	var groundMaterial =
	  new THREE.MeshLambertMaterial(
		{
		  color: 0x888888
		});
		
	// create the playing surface plane
	var plane = new THREE.Mesh(
		new THREE.PlaneGeometry(
			planeWidth * 0.95,	// 95% of table width, since we want to show where the ball goes out-of-bounds
			planeHeight,
			planeQuality,
			planeQuality
		),
		planeMaterial
	);
	
	// add plane to scene
	scene.add(plane);
	plane.receiveShadow = true;	
	
	// create table size
	var table = new THREE.Mesh(
		new THREE.CubeGeometry(
			planeWidth * 1.05,	// this creates the feel of a billiards table, with a lining
			planeHeight * 1.03,
			100,				// arbitrary depth
			planeQuality,
			planeQuality,
			1
		),
		tableMaterial
	);
	table.position.z = -51;	// we sink the table into the ground by 50 units. The extra 1 is so the game plane can be seen

	// add table to scene
	scene.add(table);
	table.receiveShadow = true;	

	// create ball size, material and add it to the scene		
	var geometry = new THREE.CircleGeometry( 15, 32 );
	var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
	var circle = new THREE.Mesh( geometry, material );
	circle.position.z= 0.9;
	scene.add( circle );		

	// create center line to imitate a football field
	var middleLineGeometry = new THREE.CubeGeometry(5, planeHeight * 0.99, 0.1);
    var middleLineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
	var middleLine = new THREE.Mesh(middleLineGeometry, middleLineMaterial);
	middleLine.position.z=0.5;
    middleLine.castShadow = true;
    scene.add(middleLine);

    // var rightWallGeometry = new THREE.CubeGeometry(WALL_WIDTH, PLAYFIELD_HEIGHT, WALL_HEIGHT);
    // var rightWallMaterial = new THREE.MeshLambertMaterial({color: WALL_COLOR});
    // var rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
    // rightWall.position.set(PLAYFIELD_WIDTH / 2 + (WALL_WIDTH / 2), 0, WALL_WIDTH);
    // rightWall.castShadow = true;
    // rightWall.receiveShadow = true;
    // scene.add(rightWall);


		
	// set up the ball size
	var radius = 5,
		segments = 6,
		rings = 6;
		
	//ball texture
	var ballTexture = new THREE.ImageUtils.loadTexture("images/soccerBall.jpg");

	// // create the sphere's material
	var sphereMaterial =
	  new THREE.MeshLambertMaterial(
		{
		  color: 0xffffff,
		  side: THREE.DoubleSide,
		  map: ballTexture
		});

	// Create a ball with sphere geometry
	ball = new THREE.Mesh( new THREE.SphereGeometry( radius, segments, rings), sphereMaterial);
	  
	// add the sphere to the scene
	scene.add(ball);
	
	// set ball position
	ball.position.x = 0;
	ball.position.y = 0;
	// set ball above the table surface
	ball.position.z = radius;
	ball.receiveShadow = true;
    ball.castShadow = true;
	
	// set up the paddle sizes
	paddleWidth = 5;
	paddleHeight = 35;
	paddleDepth = 15;
	paddleQuality = 1;
	
	// create player 1 paddle1
	paddle1 = new THREE.Mesh(
	  new THREE.CubeGeometry(
		paddleWidth,
		paddleHeight,
		paddleDepth,
		paddleQuality,
		paddleQuality,
		paddleQuality),
	  paddle1Material);

	// add the paddle1 to the scene
	scene.add(paddle1);
	paddle1.receiveShadow = true;
    paddle1.castShadow = true;
	
	// create player 2 paddle2
	paddle2 = new THREE.Mesh(
	  new THREE.CubeGeometry(
		paddleWidth,
		paddleHeight,
		paddleDepth,
		paddleQuality,
		paddleQuality,
		paddleQuality),
	  paddle2Material);
	  
	// add the paddle2 to the scene
	scene.add(paddle2);
	paddle2.receiveShadow = true;
    paddle2.castShadow = true;	
	
	// set paddles on each side of the table
	paddle1.position.x = -fieldWidth/2 + paddleWidth;
	paddle2.position.x = fieldWidth/2 - paddleWidth;
	
	// lift paddles over playing surface
	paddle1.position.z = paddleDepth;
	paddle2.position.z = paddleDepth;

	// crowd texture
	var crowdTexture = new THREE.ImageUtils.loadTexture("images/crowd.png");
	var crowdMaterial =
	new THREE.MeshLambertMaterial(
	{
		color: 0xffffff,
		side: THREE.DoubleSide,
		map: crowdTexture
	});

	// create front crowd, set position and add it to scene
	var frontcrowd = new THREE.Mesh(
		new THREE.CubeGeometry( 600,  50,  300 ), crowdMaterial);
	frontcrowd.position.x = 0;
	frontcrowd.position.y = 230;
	frontcrowd.position.z = -20;		
	frontcrowd.castShadow = true;
	frontcrowd.receiveShadow = true;	
	frontcrowd.rotation.x = -60;	  
	scene.add(frontcrowd);	

	// create back crowd, set position and add it to scene
	var backcrowd = new THREE.Mesh(
		new THREE.CubeGeometry( 600, 50, 300 ), crowdMaterial);
	backcrowd.position.x = 0;
	backcrowd.position.y = -230;
	backcrowd.position.z = -19;
	backcrowd.castShadow = true;
	backcrowd.receiveShadow = true;		
	backcrowd.rotation.x = 60;
	backcrowd.rotation.y = 109.953;
	scene.add(backcrowd);	

	// create right crowd, set position and add it to scene
	var rightcrowd = new THREE.Mesh(
		new THREE.CubeGeometry( 30, 300, 500 ), crowdMaterial);
	rightcrowd.position.x = 300;
	rightcrowd.position.y = 0;
	rightcrowd.position.z = -18;
	rightcrowd.castShadow = true;
	rightcrowd.receiveShadow = true;		
	rightcrowd.rotation.x = 29.84;
	rightcrowd.rotation.z = 60;
	scene.add(rightcrowd);

	// create left crowd, set position and add it to scene
	var leftcrowd = new THREE.Mesh(
		new THREE.CubeGeometry( 30, 300, 500 ), crowdMaterial);
	leftcrowd.position.x = -300;
	leftcrowd.position.y = 0;
	leftcrowd.position.z = -18;
	leftcrowd.castShadow = true;
	leftcrowd.receiveShadow = true;		
	leftcrowd.rotation.x = -29.85;
	leftcrowd.rotation.z = 0.5;
	scene.add(leftcrowd);

	// create ground, set position and add it to scene
	var ground = new THREE.Mesh(
		new THREE.CubeGeometry( 1000, 1000, 3 ), groundMaterial);
	ground.position.z = -132;
	ground.receiveShadow = true;	
	scene.add(ground);		
		
	// create a point light
	pointLight = new THREE.PointLight(0xF8D898);

	// set its position
	pointLight.position.set(0,0,500) 
	pointLight.distance = 10000;
	pointLight.intensity = 0.5;

	// add to the scene
	scene.add(pointLight);

	// create another point light for more brightness
	pointLight2 = new THREE.PointLight(0xF8D898);

	// add to the scene
	scene.add(pointLight2);
		
	// add a spot light for casting shadow
    spotLight = new THREE.SpotLight(0xF8D898);
    spotLight.position.set(0, 0, 460);
    spotLight.intensity = 1.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
	
	// enable shadow map
	renderer.shadowMapEnabled = true;	
	
	 // set renderer size
	 renderer.setSize( WIDTH, HEIGHT );
	 renderer.setClearColor( 0x000000, 1 );

	 // must set autoclear to false to render more than 1 scene
	 renderer.autoClear = false;
}

function render()
{	
	// loop draw function call
    requestAnimationFrame(render);
	
	camera1.aspect = 0.5 * WIDTH / HEIGHT;
	camera1.updateProjectionMatrix();
	camera2.aspect = 0.5 * WIDTH / HEIGHT; 
    camera2.updateProjectionMatrix();
	
	// clear renderer
	renderer.clear();

	// Viewport for left side - Player 1
    renderer.setViewport( WIDTH/50, 0, WIDTH * 0.5 +120, HEIGHT+100 );

	// render player 1 THREE.JS scene
    renderer.render(scene, camera1);

	// Viewport for right side - Player 2
	renderer.setViewport( WIDTH * 0.5 + 150 + 90, 0, WIDTH * 0.5 +120, HEIGHT+100 );
	
	// render player 2 THREE.JS scene
   	renderer.render(scene, camera2);
	
	// handle pausing game
   	handlePause();
	
	// if game isn't paused render everything
	if ( state != 'PAUSED')
	{
		ballPhysics();
		paddlePhysics();
		cameraPhysics();
		playerPaddleMovement();
		opponentPaddleMovement();
	}
}

function handlePause() {
	if (Key.isDown(Key.P)){
		//Key.onKeyup(Key.P);
		console.log("working");
		togglePause();
	}
}

function togglePause() {
	state = (state == 'PLAY') ? 'PAUSED' : 'PLAY';
	var x = document.getElementById("pause");
	if (x.style.display === "none") {
		x.style.display = "inline";
	} else {
		x.style.display = "none";
	}
}

function ballPhysics()
{
	// rotation variables
	var time = performance.now();
	var delta = ( time - prevTime ) / 1000;

	prevTime = time;

	// if ball goes off the 'left' side (Player's 1 side)
	if (ball.position.x <= -fieldWidth/2)
	{	
		// Player 2 scores
		score2++;

		// update scoreboard HTML
		document.getElementById("scores").innerHTML = score1 + "-" + score2;

		// play cheers sound
		playRandomSound(sounds_cheers);

		// reset ball to center, but make ball move towards player 2
		resetBall(2);

		// check if game has ended
		matchScoreCheck();	
	}
	
	// if ball goes off the 'right' side (Player's 2 side)
	if (ball.position.x >= fieldWidth/2)
	{	
		// Player 1 scores
		score1++;

		// update scoreboard HTML
		document.getElementById("scores").innerHTML = score1 + "-" + score2;
		// reset ball to center

		// play cheers sound
		playRandomSound(sounds_cheers);

		// reset ball to center, but make ball move towards player 1
		resetBall(1);

		// check if game has ended
		matchScoreCheck();	
	}
	
	// if ball goes off the top side (side of table)
	if (ball.position.y <= -fieldHeight/2)
	{
		ballDirY = -ballDirY;
		//ball.rotation.setY(ballDirY*ballSpeed);
		playRandomSound(sounds_hits);
	}	

	// if ball goes off the bottom side (side of table)
	if (ball.position.y >= fieldHeight/2)
	{
		ballDirY = -ballDirY;
		//ball.rotation.setY(ballDirY*ballSpeed);
		playRandomSound(sounds_hits);
	}

	// rotate ball every frame to it's direction
	ball.rotation.x += 2 * ballSpeed * delta;
	ball.rotation.y += 2 * ballSpeed * delta * hit; 

	// update ball position over time
	ball.position.x += ballDirX * ballSpeed;
	ball.position.y += ballDirY * ballSpeed;


	// ball.rotation.set(ballDirX*ballSpeed*20, ballDirY*ballSpeed*20, 0);
	// ball.rotation.setX(ballDirX*ballSpeed*20);
	// ball.rotation.setY(Math.PI - ( 2 * ballDirY ));
	// ball.rotation.y = 45 * Math.PI/180;

	
	// limit ball's y-speed to 2x the x-speed, so the game can be playable
	if (ballDirY > ballSpeed * 2)
	{
		ballDirY = ballSpeed * 2;
	}
	else if (ballDirY < -ballSpeed * 2)
	{
		ballDirY = -ballSpeed * 2;
	}
}

// Handles Player 2 movement / COMPUTER logic
function opponentPaddleMovement()
{
	///////////////////////// COMPUTER ///////////////////////////////////////////////////////////////////////

	// move paddle towards the ball on the y plane
	// paddle2DirY = (ball.position.y - paddle2.position.y) * difficulty;
	
	// // in case the move paddle function produces a value above max paddle speed, we clamp it
	// if (Math.abs(paddle2DirY) <= paddleSpeed)
	// {	
	// 	paddle2.position.y += paddle2DirY;
	// }
	// // if the move paddle value is too high, we have to limit speed to paddleSpeed
	// else
	// {
	// 	// if paddle is moving in positive direction
	// 	if (paddle2DirY > paddleSpeed)
	// 	{
	// 		paddle2.position.y += paddleSpeed;
	// 	}
	// 	// if paddle is moving in negative direction
	// 	else if (paddle2DirY < -paddleSpeed)
	// 	{
	// 		paddle2.position.y -= paddleSpeed;
	// 	}
	// }

	// // We move the scale back to 1 when
	// // stretching is done when paddle touches side of table and when paddle hits ball
	// paddle2.scale.y += (1 - paddle2.scale.y) * 0.2;	

	//////////////////////////////////// HUMAN /////////////////////////////////////////////////////////////////////////////////////////////////////

	// move left
	if (Key.isDown(Key.RIGHTARROW))		
	{
		// if paddle is not touching the side of table, move the paddle
		if (paddle2.position.y < fieldHeight * 0.4)
		{
			paddle2DirY = paddleSpeed * 0.5;
		}
		// else don't move and stretch the paddle to indicate we can't move
		else
		{
			paddle2DirY = 0;
			paddle2.scale.z += (10 - paddle2.scale.z) * 0.02;
		}
	}	
	// move right
	else if (Key.isDown(Key.LEFTARROW))
	{
		// if paddle is not touching the side of table, move the paddle
		if (paddle2.position.y > -fieldHeight * 0.4)
		{
			paddle2DirY = -paddleSpeed * 0.5;
		}
		// else don't move and stretch the paddle to indicate we can't move
		else
		{
			paddle2DirY = 0;
			paddle2.scale.z += (10 - paddle2.scale.z) * 0.02;
		}
	}
	// if those keys aren't pressed
	else
	{
		// stop the paddle
		paddle2DirY = 0;
	}
	
	// setting paddle back to it's original size if it's streched
	paddle2.scale.y += (1 - paddle2.scale.y) * 0.2;	
	paddle2.scale.z += (1 - paddle2.scale.z) * 0.2;	
	paddle2.position.y += paddle2DirY;
}


// Handle player's 1 paddle movement
function playerPaddleMovement()
{
	// move left
	if (Key.isDown(Key.A))		
	{
		// if paddle is not touching the side of table, move the paddle
		if (paddle1.position.y < fieldHeight * 0.4)
		{
			paddle1DirY = paddleSpeed * 0.5;
		}
		// else don't move and stretch the paddle to indicate we can't move
		else
		{
			paddle1DirY = 0;
			paddle1.scale.z += (10 - paddle1.scale.z) * 0.02;
		}
	}	
	// move right
	else if (Key.isDown(Key.D))
	{
		// if paddle is not touching the side of table, move the paddle
		if (paddle1.position.y > -fieldHeight * 0.4)
		{
			paddle1DirY = -paddleSpeed * 0.5;
		}
		// else don't move and stretch the paddle to indicate we can't move
		else
		{
			paddle1DirY = 0;
			paddle1.scale.z += (10 - paddle1.scale.z) * 0.02;
		}
	}
	// if those keys aren't pressed
	else
	{
		// stop the paddle
		paddle1DirY = 0;
	}
	
	// setting paddle back to it's original size if it's streched
	paddle1.scale.y += (1 - paddle1.scale.y) * 0.2;	
	paddle1.scale.z += (1 - paddle1.scale.z) * 0.2;	
	paddle1.position.y += paddle1DirY;
}

// Handle camera and lighting logic
function cameraPhysics()
{
	// move lights during the game by following the ball
	spotLight.position.x = ball.position.x ;
	spotLight.position.y = ball.position.y ;
	
	// player 1 camera position
	camera1.position.x = paddle1.position.x - 100;
	camera1.position.y += (paddle1.position.y - camera1.position.y) * 0.05;
	camera1.position.z = paddle1.position.z + 100;
	
	// rotate to face towards the opponent
	camera1.rotation.x = ((ball.position.y) * Math.PI/180)/100;
	camera1.rotation.y = -60 * Math.PI/180;
	camera1.rotation.z = -90 * Math.PI/180;

	// player 2 camera position
    camera2.position.x = paddle2.position.x + 100;
	camera2.position.y += (paddle2.position.y - camera2.position.y) * 0.05;
	camera2.position.z = paddle2.position.z + 100 +  0.04 * (ball.position.x + paddle2.position.x);
	
	// rotate to face towards the opponent
	camera2.rotation.x = ((ball.position.y) * Math.PI/180)/100;
	camera2.rotation.y = 60 * Math.PI/180;
	camera2.rotation.z = 90 * Math.PI/180;
}

// Handle paddle collision logic
function paddlePhysics()
{
	// PLAYER PADDLE LOGIC
	
	// if ball is aligned with paddle1 on x plane
	// remember the position is the CENTER of the object
	// we only check between the front and the middle of the paddle (one-way collision)
	if (ball.position.x <= paddle1.position.x + paddleWidth
	&&  ball.position.x >= paddle1.position.x)
	{
		// and if ball is aligned with paddle1 on y plane
		if (ball.position.y <= paddle1.position.y + paddleHeight/2
		&&  ball.position.y >= paddle1.position.y - paddleHeight/2)
		{
			// and if ball is travelling towards player (-ve direction)
			if (ballDirX < 0)
			{
				// stretch the paddle to indicate a hit
				paddle1.scale.y = 3;

				//ball.rotation.y = -(ball.rotation.y);
				// play hit sound
				playRandomSound(sounds_hits);
				// switch direction of ball travel to create bounce
				ballDirX = -ballDirX;

				// change y rotation of the ball to the other side
				hit = -hit;
				// we impact ball angle when hitting it
				// this is not realistic physics, just spices up the gameplay
				// allows you to 'slice' the ball to beat the opponent
				ballDirY -= paddle1DirY * 0.7;
			}
		}
	}
	
	// OPPONENT PADDLE LOGIC	
	
	// if ball is aligned with paddle2 on x plane
	// remember the position is the CENTER of the object
	// we only check between the front and the middle of the paddle (one-way collision)
	if (ball.position.x <= paddle2.position.x + paddleWidth
	&&  ball.position.x >= paddle2.position.x)
	{
		// and if ball is aligned with paddle2 on y plane
		if (ball.position.y <= paddle2.position.y + paddleHeight/2
		&&  ball.position.y >= paddle2.position.y - paddleHeight/2)
		{
			// and if ball is travelling towards opponent (+ve direction)
			if (ballDirX > 0)
			{
				//ball.rotation.y = -(ball.rotation.y);
				
				// stretch the paddle to indicate a hit
				paddle2.scale.y = 3;	
				// play hit sound
				playRandomSound(sounds_hits);
				// switch direction of ball travel to create bounce
				ballDirX = -ballDirX;

				// change the y rotation of the ball to the other side
				hit = -hit;
				// we impact ball angle when hitting it
				// this is not realistic physics, just spices up the gameplay
				// allows you to 'slice' the ball to beat the opponent
				ballDirY -= paddle2DirY ;
			}
		}
	}
}

// handle the ball reset 
function resetBall(loser)
{
	// position the ball in the center of the table
	ball.position.x = 0;
	ball.position.y = 0;
	
	// if player lost the last point, we send the ball to opponent
	if (loser == 1)
	{
		ballDirX = -1;
	}
	// if opponent lost, we send ball to player
	else
	{
		ballDirX = 1;
	}
	
	// set the ball to move positive in y plane 
	ballDirY = 1;
}


// checks if either player or opponent has reached 5 points
function matchScoreCheck()
{
	// if player has 5=max points
	if (score1 >= maxScore)
	{
		// stop the ball
		ballSpeed = 0;
		// write to the banner
        document.getElementById("scores").innerHTML = "Player 1 wins!";		
		document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
	}
	// else if opponent has max points
	else if (score2 >= maxScore)
	{
		// stop the ball
		ballSpeed = 0;
		// write to the banner
        document.getElementById("scores").innerHTML = "Player 2 wins!";
		document.getElementById("winnerBoard").innerHTML = "Refresh to play again";
	}
}

// load ball hiting and cheering sound
function loadSounds() {
    var one = new Audio("sounds/1.mp3");
    var one_u_5 = new Audio("sounds/1_pitchup_5.mp3");
    var one_u_10 = new Audio("sounds/1_pitchup_10.mp3");
    var one_u_15 = new Audio("sounds/1_pitchup_15.mp3");
    var one_d_5 = new Audio("sounds/1_pitchdown_5.mp3");
    var one_d_10 = new Audio("sounds/1_pitchdown_10.mp3");
    var one_d_15 = new Audio("sounds/1_pitchdown_15.mp3");
    sounds_hits = [one, one_u_5, one_u_10, one_d_5, one_d_10, one_u_15, one_d_15];

    var cheer = new Audio("sounds/cheer.mp3");
    var cheer2 = new Audio("sounds/cheer2.mp3");
    sounds_cheers = [cheer, cheer2];
}

// handle playing random sound
function playRandomSound(audioArray) {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

	var rand = Math.floor(Math.random() * audioArray.length-1)
	console.log(rand);
    while (rand === last) {
        rand = Math.floor(Math.random() * audioArray.length-1)
    }
    last = rand;
    return audioArray[rand].play();
}




////extra
// move to behind the player's paddle
// camera.position.x = paddle1.position.x - 100;
// camera.position.y = (paddle1.position.y);
// camera.position.z = paddle1.position.z + 30 +  0.04 * (-ball.position.x + paddle1.position.x);

// // rotate to face towards the opponent
// camera.rotation.x = -0.01 * (ball.position.y) * Math.PI/180;
// camera.rotation.y = -80 * Math.PI/180;
// camera.rotation.z = -90 * Math.PI/180;

// sound
// sound_targets_start = new Audio("sounds/targets_start.mp3");
    // sound_targets_loop = new Audio("sounds/targets_loop.mp3");
    // sound_targets_loop.loop = true;
    // sound_targets_start.onended = function () {
    //     sound_targets_loop.currentTime = 0;
    //     sound_targets_loop.play();
    // };