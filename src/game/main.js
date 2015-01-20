/**
 *
 * This is a simple state template to use for getting a Phaser game up
 * and running quickly. Simply add your own game logic to the default
 * state object or delete it and make your own.
 *
 */

 var SPEED = 200;
 var GRAVITY = 900;
 var JET = 420;
 var OPENING = 200;
 var SPAWN_RATE = 1.25;

var state = {
    init: function() {
        
    },
    preload: function() {
        this.load.image("wall", "assets/wall.png");
        this.load.image("background", "assets/background-texture.png");
        this.load.spritesheet("player", "assets/player.png", 48, 48);
        this.load.audio("jet", "assets/jet.wav");
        this.load.audio("score", "assets/score.wav");
        this.load.audio("hurt", "assets/hurt.wav");
    },
    create: function(){
        // set up the physics system
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = GRAVITY;
        // set up the background to fill the game window
        this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');
        // create walls group
        this.walls = this.add.group();
        // set up the player
        this.player = this.add.sprite(0, 0, 'player');
        this.player.animations.add('fly', [0,1,2], 10, true);
        this.physics.arcade.enableBody(this.player);
        this.player.body.collideWorldBounds = true;
        // set up the score text
        this.scoreText = this.add.text(
            this.world.centerX,
            this.world.height / 5,
            "",
            {
                size: "32px",
                fill: "#FFF",
                align: "center"
            }
        );
        this.scoreText.anchor.setTo(0.5, 0.5);
        // bind set function to click event
        this.input.onDown.add(this.jet, this);
        // set up the audio
        this.jetSnd = this.add.audio('jet');
        this.scoreSnd = this.add.audio('score');
        this.hurtSnd = this.add.audio('hurt');
        // reset the game 
        this.reset();
    },
    update: function() {
        if (this.gameStarted) {
            // play the fly animation as long as the play is going up faster than 20 
            if (this.player.body.velocity.y > -20) {
                this.player.frame = 3;
            } else {
                this.player.animations.play("fly");
            }
            if (!this.gameOver) {
                // set game over if the player touches the floor
                if (this.player.body.bottom >= this.world.bounds.bottom) {
                    this.setGameOver();
                }
                // collide player with walls
                this.physics.arcade.collide(this.player, this.walls, this.setGameOver, null, this);
                this.walls.forEachAlive(function removeNonVisibleWalls (wall) {
                    // dealocate walls off the screen
                    if (wall.x + wall.width < game.world.bounds.left) {
                        wall.kill();
                    } else if (!wall.scored && wall.x <= state.player.x) {
                        state.addScore(wall);
                    }
                });
            }
        } else {
            // make the player hover up and down while waiting for game to start
            this.player.y = this.world.centerY + (8 * Math.cos(this.time.now/200));
        }
    },
    reset: function() {
        this.background.autoScroll(-SPEED * .80, 0);
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.player.body.allowGravity = false;
        this.player.reset(this.world.width / 4, this.world.centerY);
        this.player.animations.play('fly');
        this.scoreText.setText("TOUCH TO\nSTART GAME");
        this.walls.removeAll();
    },
    start: function() {
        this.player.body.allowGravity = true;
        this.scoreText.setText("SCORE\n" + this.score);
        this.gameStarted = true;
        this.wallTimer = this.game.time.events.loop(Phaser.Timer.SECOND * SPAWN_RATE, this.spawnWalls, this);
        this.wallTimer.timer.start();
    },
    setGameOver: function() {
        this.hurtSnd.play();
        this.gameOver = true;
        this.player.body.velocity.x = 0;
        this.scoreText.setText("FINAL SCORE\n" + this.score + "\n\nTOUCH TO\nTRY AGAIN");
        this.background.autoScroll(0, 0);
        this.walls.forEachAlive(function stopWallScrolling (wall) {
            wall.body.velocity.x = wall.body.velocity.y = 0;
        });
        this.wallTimer.timer.stop();
        this.timeOver = this.time.now;
    },
    jet: function() {
        // start the game on click if it hasn't already started
        if (!this.gameStarted) {
            this.start();
        }
        // if the game isn't over, then up the player velocity
        if (!this.gameOver) {
            this.player.body.velocity.y = -JET;
            this.jetSnd.play();
        }
        // game is over, check time to reset game
        else if (this.time.now > this.timeOver + 400) {
            this.reset();
        }
    },
    spawnWall: function(y, flipped) {
        var wall = this.walls.create(
            game.width,
            y + (flipped? -OPENING : OPENING) / 2,
            'wall'
        );
        this.physics.arcade.enableBody(wall);
        wall.body.allowGravity = false;
        wall.scored = false;
        wall.body.immovable = true;
        wall.body.velocity.x = -SPEED;
        if (flipped) {
            wall.scale.y = -1;
            wall.body.offset.y = -wall.body.height;
        }
        return wall;
    },
    spawnWalls: function() {
        var wallY = this.rnd.integerInRange(game.height * 0.3, game.height * 0.7);
        var bottomWall = this.spawnWall(wallY);
        var topWall = this.spawnWall(wallY, true);
    },
    addScore: function(wall) {
        wall.scored = true;
        this.score += 0.5;
        this.scoreText.setText("SCORE\n" + this.score);
        this.scoreSnd.play();
    }
};

var game = new Phaser.Game(
    800,
    480,
    Phaser.AUTO,
    'game',
    state
);