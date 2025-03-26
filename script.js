// =========================================================
// PONG EXTREME 2025 - THE ULTIMATE PONG EXPERIENCE
// =========================================================

// -------------------- CANVAS SETUP --------------------
const gameCanvas = document.getElementById('pong-canvas');
const ctx = gameCanvas.getContext('2d');
gameCanvas.width = 800;
gameCanvas.height = 500;

// Particle canvas for background effects
const particleCanvas = document.getElementById('particle-canvas');
const particleCtx = particleCanvas.getContext('2d');
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

// Performance optimization
ctx.imageSmoothingEnabled = false;

// -------------------- GAME CONSTANTS --------------------
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const DEFAULT_BALL_SPEED = 4;
const MAX_BALL_SPEED = 15;
const MIN_BALL_SPEED = 3;
const POWERUP_SIZE = 30;
const POWERUP_TYPES = ['speed', 'size', 'slow', 'multi', 'reverse', 'invisible'];
const SPECIAL_METER_MAX = 100;
const SPECIAL_METER_GAIN = 5;

// Game modes
const GAME_MODES = {
    CLASSIC: 'classic',
    CHAOS: 'chaos',
    SPEED: 'speed',
    MULTI: 'multi'
};

// -------------------- GAME STATE --------------------
let gameRunning = false;
let gamePaused = false;
let player1Score = 0;
let player2Score = 0;
let lastFrameTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;
let gameTimer = 0;
let timerInterval;
let currentRally = 0;
let longestRally = 0;
let ballsInPlay = [];
let powerups = [];
let particles = [];
let hitEffects = [];
let stats = {
    longestRally: 0,
    powerupsCollected: 0,
    totalTime: 0,
    maxBallSpeed: 0
};

// -------------------- SETTINGS & OPTIONS --------------------
let winningScore = 5;
let gameSpeed = 1;
let soundEnabled = true;
let musicEnabled = true;
let visualEffectsEnabled = true;
let powerupsEnabled = true;
let aiDifficulty = 3;
let currentGameMode = GAME_MODES.CLASSIC;
let player1IsAI = false;
let player2IsAI = false;

// -------------------- UI ELEMENTS --------------------
const screens = {
    mainMenu: document.getElementById('main-menu'),
    modes: document.getElementById('modes-menu'),
    options: document.getElementById('options-menu'),
    credits: document.getElementById('credits-menu'),
    game: document.getElementById('game-screen'),
    pause: document.getElementById('pause-menu'),
    gameOver: document.getElementById('game-over'),
    playerSelect: document.getElementById('player-select'),
    countdown: document.getElementById('countdown-overlay'),
    flash: document.getElementById('flash-overlay'),
    specialEffect: document.getElementById('special-effect-overlay')
};

// -------------------- AUDIO SYSTEM --------------------
// Sound effects (mock implementation - would normally use actual audio files)
const sounds = {
    paddle: { 
        play: () => { if (soundEnabled) console.log('Paddle hit sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    wall: { 
        play: () => { if (soundEnabled) console.log('Wall hit sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    score: { 
        play: () => { if (soundEnabled) console.log('Score sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    win: { 
        play: () => { if (soundEnabled) console.log('Win sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    menu: { 
        play: () => { if (soundEnabled) console.log('Menu sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    countdown: { 
        play: () => { if (soundEnabled) console.log('Countdown sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    powerup: { 
        play: () => { if (soundEnabled) console.log('Powerup sound'); },
        volume: 1.0,
        pitch: 1.0
    },
    special: { 
        play: () => { if (soundEnabled) console.log('Special ability sound'); },
        volume: 1.0,
        pitch: 1.0
    }
};

// Background music (mock implementation)
const bgMusic = {
    tracks: {
        menu: { play: () => { if (musicEnabled) console.log('Menu music playing'); } },
        game: { play: () => { if (musicEnabled) console.log('Game music playing'); } },
        intense: { play: () => { if (musicEnabled) console.log('Intense music playing'); } }
    },
    currentTrack: null,
    play: function(track) {
        if (this.currentTrack) this.currentTrack = null;
        this.currentTrack = this.tracks[track];
        if (musicEnabled && this.currentTrack) this.currentTrack.play();
    },
    pause: function() {
        console.log('Music paused');
    }
};

// -------------------- PLAYER PADDLES --------------------
const player1 = {
    x: 20,
    y: gameCanvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 8,
    upPressed: false,
    downPressed: false,
    color: '#4080ff',
    specialMeter: 0,
    specialActive: false,
    specialReady: false,
    powerups: [],
    isAI: false,
    aiReactionTime: 0.15,  // Time delay in seconds
    aiTarget: null,        // Target Y position
    lastHitTime: 0
};

const player2 = {
    x: gameCanvas.width - 20 - PADDLE_WIDTH,
    y: gameCanvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 8,
    upPressed: false,
    downPressed: false,
    color: '#ff4080',
    specialMeter: 0,
    specialActive: false,
    specialReady: false,
    powerups: [],
    isAI: false,
    aiReactionTime: 0.15,
    aiTarget: null,
    lastHitTime: 0
};

// -------------------- BALL CLASS --------------------
class Ball {
    constructor(x, y, speedX, speedY) {
        this.x = x || gameCanvas.width / 2;
        this.y = y || gameCanvas.height / 2;
        this.size = BALL_SIZE;
        this.speedX = speedX || (Math.random() > 0.5 ? DEFAULT_BALL_SPEED : -DEFAULT_BALL_SPEED) * gameSpeed;
        this.speedY = speedY || (Math.random() > 0.5 ? DEFAULT_BALL_SPEED : -DEFAULT_BALL_SPEED) * gameSpeed;
        this.color = '#ffffff';
        this.trail = [];
        this.maxTrail = 5;
        this.glowing = false;
        this.isInvisible = false;
        this.invisibilityFactor = 0;
        this.lastHitBy = null;
    }

    update() {
        // Update trail
        this.updateTrail();

        // Move ball
        this.x += this.speedX;
        this.y += this.speedY;

        // Update invisibility effect (pulsing)
        if (this.isInvisible) {
            this.invisibilityFactor = (Math.sin(Date.now() * 0.005) + 1) / 2;
        }

        // Check if speed exceeds record
        const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
        if (currentSpeed > stats.maxBallSpeed) {
            stats.maxBallSpeed = currentSpeed;
        }

        // Constrain ball speed
        if (currentSpeed > MAX_BALL_SPEED) {
            const ratio = MAX_BALL_SPEED / currentSpeed;
            this.speedX *= ratio;
            this.speedY *= ratio;
        }
    }

    updateTrail() {
        // Add current position to trail
        this.trail.unshift({ x: this.x, y: this.y });
        
        // Keep trail at max length
        if (this.trail.length > this.maxTrail) {
            this.trail.pop();
        }
    }

    reset(side = null) {
        this.x = gameCanvas.width / 2;
        this.y = gameCanvas.height / 2;
        this.trail = [];
        this.glowing = false;
        this.isInvisible = false;
        
        // If side is specified, send ball in that direction
        if (side === 'left') {
            this.speedX = -DEFAULT_BALL_SPEED * gameSpeed;
        } else if (side === 'right') {
            this.speedX = DEFAULT_BALL_SPEED * gameSpeed;
        } else {
            // Randomize initial ball direction
            this.speedX = (Math.random() > 0.5 ? DEFAULT_BALL_SPEED : -DEFAULT_BALL_SPEED) * gameSpeed;
        }
        
        this.speedY = (Math.random() > 0.5 ? DEFAULT_BALL_SPEED : -DEFAULT_BALL_SPEED) * gameSpeed;
        
        // Force proper initial velocities
        if (Math.abs(this.speedX) < MIN_BALL_SPEED) {
            this.speedX = this.speedX > 0 ? MIN_BALL_SPEED * gameSpeed : -MIN_BALL_SPEED * gameSpeed;
        }
        if (Math.abs(this.speedY) < MIN_BALL_SPEED) {
            this.speedY = Math.random() > 0.5 ? MIN_BALL_SPEED * gameSpeed : -MIN_BALL_SPEED * gameSpeed;
        }
    }
}

// -------------------- POWERUP CLASS --------------------
class Powerup {
    constructor() {
        // Position in the middle section of the court
        const margin = 100;
        this.x = margin + Math.random() * (gameCanvas.width - 2 * margin);
        this.y = margin + Math.random() * (gameCanvas.height - 2 * margin);
        this.size = POWERUP_SIZE;
        this.type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        this.color = this.getColorForType();
        this.icon = this.getIconForType();
        this.active = true;
        this.rotation = 0;
        this.duration = 5000; // 5 seconds for active powerups
    }

    getColorForType() {
        switch(this.type) {
            case 'speed': return '#ff4040'; // Red
            case 'size': return '#40ff40';  // Green
            case 'slow': return '#4040ff';  // Blue
            case 'multi': return '#ffff40'; // Yellow
            case 'reverse': return '#ff40ff'; // Purple
            case 'invisible': return '#40ffff'; // Cyan
            default: return '#ffffff';
        }
    }

    getIconForType() {
        switch(this.type) {
            case 'speed': return '⚡';
            case 'size': return '↔';
            case 'slow': return '⏱';
            case 'multi': return '➕';
            case 'reverse': return '↩';
            case 'invisible': return '👁';
            default: return '?';
        }
    }

    update() {
        this.rotation += 0.02;
    }

    activate(player) {
        this.active = false;
        sounds.powerup.play();
        stats.powerupsCollected++;
        
        // Apply powerup effect
        switch(this.type) {
            case 'speed':
                applySpeedPowerup(player);
                break;
            case 'size':
                applySizePowerup(player);
                break;
            case 'slow':
                applySlowPowerup(player === player1 ? player2 : player1);
                break;
            case 'multi':
                applyMultiballPowerup();
                break;
            case 'reverse':
                applyReversePowerup(player === player1 ? player2 : player1);
                break;
            case 'invisible':
                applyInvisiblePowerup();
                break;
        }
        
        // Add to player's active powerups
        player.powerups.push({
            type: this.type,
            icon: this.icon,
            color: this.color,
            timeRemaining: this.duration
        });
        
        // Update powerup indicators UI
        updatePowerupIndicators();
        
        // Visual feedback
        flashScreen();
        createPowerupParticles(this.x, this.y, this.color);
        showMessage(this.type.toUpperCase() + " POWERUP!");
    }
}

// -------------------- PARTICLE SYSTEM --------------------
class Particle {
    constructor(x, y, color, size, speedX, speedY, life = 1, gravity = 0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.initialSize = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.life = life;  // 0 to 1
        this.decay = Math.random() * 0.02 + 0.005; // Random decay rate
        this.gravity = gravity;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.life -= this.decay;
        this.size = this.initialSize * this.life;
    }

    isDead() {
        return this.life <= 0;
    }
}

// -------------------- HIT EFFECT CLASS --------------------
class HitEffect {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.maxSize = size * 3;
        this.color = color;
        this.alpha = 0.8;
        this.growing = true;
    }

    update() {
        if (this.growing) {
            this.size += this.maxSize / 10;
            if (this.size >= this.maxSize) {
                this.growing = false;
            }
        }
        this.alpha -= 0.05;
    }

    isDead() {
        return this.alpha <= 0;
    }
}

// -------------------- BACKGROUND PARTICLES --------------------
const bgParticles = [];
for (let i = 0; i < 50; i++) {
    bgParticles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: `rgba(64, 128, 255, ${Math.random() * 0.5 + 0.1})`
    });
}

// Update background particles
function updateBackgroundParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Only draw if visual effects are enabled
    if (!visualEffectsEnabled) return;
    
    for (let p of bgParticles) {
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Wrap around screen
        if (p.x < 0) p.x = particleCanvas.width;
        if (p.x > particleCanvas.width) p.x = 0;
        if (p.y < 0) p.y = particleCanvas.height;
        if (p.y > particleCanvas.height) p.y = 0;
        
        // Draw particle
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = p.color;
        particleCtx.fill();
    }
    
    // Draw subtle glow in the center
    const centerGlow = particleCtx.createRadialGradient(
        particleCanvas.width/2, particleCanvas.height/2, 0,
        particleCanvas.width/2, particleCanvas.height/2, particleCanvas.width/2
    );
    centerGlow.addColorStop(0, 'rgba(64, 128, 255, 0.05)');
    centerGlow.addColorStop(1, 'rgba(64, 128, 255, 0)');
    
    particleCtx.fillStyle = centerGlow;
    particleCtx.fillRect(0, 0, particleCanvas.width, particleCanvas.height);
}

// -------------------- INPUT HANDLING --------------------
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'w':
            case 'W':
                player1.upPressed = true;
                break;
            case 's':
            case 'S':
                player1.downPressed = true;
                break;
            case 'ArrowUp':
                player2.upPressed = true;
                break;
            case 'ArrowDown':
                player2.downPressed = true;
                break;
            case 'Escape':
                if (gameRunning && !gamePaused) {
                    pauseGame();
                }
                break;
            case ' ':
                // Space key activates special ability
                if (gameRunning && !gamePaused) {
                    if (player1.specialReady && !player1.isAI) activateSpecialAbility(player1);
                    if (player2.specialReady && !player2.isAI) activateSpecialAbility(player2);
                }
                break;
        }
    });

    document.addEventListener('keyup', function(e) {
        switch(e.key) {
            case 'w':
            case 'W':
                player1.upPressed = false;
                break;
            case 's':
            case 'S':
                player1.downPressed = false;
                break;
            case 'ArrowUp':
                player2.upPressed = false;
                break;
            case 'ArrowDown':
                player2.downPressed = false;
                break;
        }
    });
    
    // Touch controls (for mobile support)
    gameCanvas.addEventListener('touchstart', handleTouchStart, false);
    gameCanvas.addEventListener('touchmove', handleTouchMove, false);
    gameCanvas.addEventListener('touchend', handleTouchEnd, false);
}

// Touch control variables
let touchY = null;
let touchIdentifier = null;
let touchPaddle = null;

function handleTouchStart(e) {
    e.preventDefault();
    if (gameRunning && !gamePaused) {
        const touch = e.touches[0];
        touchY = touch.clientY;
        touchIdentifier = touch.identifier;
        
        // Determine which paddle to control based on touch position
        if (touch.clientX < window.innerWidth / 2) {
            touchPaddle = player1;
        } else {
            touchPaddle = player2;
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchY || !touchPaddle) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdentifier) {
            const deltaY = touch.clientY - touchY;
            touchY = touch.clientY;
            
            // Move paddle based on touch movement
            touchPaddle.y += deltaY;
            
            // Constrain paddle to canvas
            if (touchPaddle.y < 0) touchPaddle.y = 0;
            if (touchPaddle.y > gameCanvas.height - touchPaddle.height) {
                touchPaddle.y = gameCanvas.height - touchPaddle.height;
            }
            
            break;
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdentifier) {
            touchY = null;
            touchIdentifier = null;
            touchPaddle = null;
            break;
        }
    }
}

// -------------------- GAME MECHANICS --------------------

// Update game state
function update() {
    // Handle AI paddle movement
    updateAI();
    
    // Move player 1 paddle
    if (!player1.isAI) {
        if (player1.upPressed && player1.y > 0) {
            player1.y -= player1.speed * gameSpeed;
        } else if (player1.downPressed && player1.y < gameCanvas.height - player1.height) {
            player1.y += player1.speed * gameSpeed;
        }
    }

    // Move player 2 paddle
    if (!player2.isAI) {
        if (player2.upPressed && player2.y > 0) {
            player2.y -= player2.speed * gameSpeed;
        } else if (player2.downPressed && player2.y < gameCanvas.height - player2.height) {
            player2.y += player2.speed * gameSpeed;
        }
    }

    // Update all balls in play
    for (let i = ballsInPlay.length - 1; i >= 0; i--) {
        const ball = ballsInPlay[i];
        ball.update();

        // Ball collision with top and bottom walls
        if (ball.y - ball.size < 0 || ball.y + ball.size > gameCanvas.height) {
            ball.speedY = -ball.speedY;
            if (soundEnabled) {
                sounds.wall.pitch = 1.0 + Math.random() * 0.2 - 0.1; // Random pitch variation
                sounds.wall.play();
            }
            
            // Create particles for wall collision
            if (visualEffectsEnabled) {
                createParticles(
                    ball.x, 
                    ball.y < ball.size ? ball.size : gameCanvas.height - ball.size, 
                    10, '#ffffff'
                );
            }
        }

        // Ball collision with paddles
        checkPaddleCollision(ball, player1);
        checkPaddleCollision(ball, player2);

        // Scoring
        if (ball.x - ball.size < 0) {
            // Player 2 scores
            player2Score++;
            updateScoreDisplay();
            if (soundEnabled) sounds.score.play();
            
            // Reset rally counter
            resetRally();
            
            // Create score effect
            if (visualEffectsEnabled) {
                createScoreEffect(2);
            }
            
            checkWinner();
            if (gameRunning) {
                // Remove this ball and reset if it's the last one
                ballsInPlay.splice(i, 1);
                if (ballsInPlay.length === 0) {
                    resetBall('left');
                    showCountdown();
                }
            }
        } else if (ball.x + ball.size > gameCanvas.width) {
            // Player 1 scores
            player1Score++;
            updateScoreDisplay();
            if (soundEnabled) sounds.score.play();
            
            // Reset rally counter
            resetRally();
            
            // Create score effect
            if (visualEffectsEnabled) {
                createScoreEffect(1);
            }
            
            checkWinner();
            if (gameRunning) {
                // Remove this ball and reset if it's the last one
                ballsInPlay.splice(i, 1);
                if (ballsInPlay.length === 0) {
                    resetBall('right');
                    showCountdown();
                }
            }
        }
    }
    
    // Update powerups
    updatePowerups();
    
    // Update particles
    updateParticles();
    
    // Update hit effects
    updateHitEffects();
    
    // Update special meters
    updateSpecialMeters();
    
    // Create powerups periodically in modes that support them
    if (powerupsEnabled && (currentGameMode === GAME_MODES.CHAOS || currentGameMode === GAME_MODES.MULTI)) {
        if (Math.random() < 0.003 * gameSpeed && powerups.length < 3) {
            powerups.push(new Powerup());
        }
    }
    
    // Handle mode-specific updates
    updateGameMode();
}

function checkPaddleCollision(ball, paddle) {
    if (
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.height &&
        ((ball.speedX < 0 && paddle === player1) || (ball.speedX > 0 && paddle === player2))
    ) {
        // Reverse ball direction
        ball.speedX = -ball.speedX;
        
        // Adjust ball angle based on where it hits the paddle
        adjustBallAngle(ball, paddle);
        
        // Slightly increase ball speed with each hit for more challenge
        const speedIncreaseFactor = currentGameMode === GAME_MODES.SPEED ? 1.1 : 1.05;
        ball.speedX *= speedIncreaseFactor;
        
        // Visual and audio feedback
        ball.glowing = true;
        setTimeout(() => { ball.glowing = false; }, 200);
        
        if (soundEnabled) {
            // Adjust pitch based on ball speed
            const speedRatio = Math.min(Math.abs(ball.speedX) / MAX_BALL_SPEED, 1);
            sounds.paddle.pitch = 0.8 + speedRatio * 0.4;
            sounds.paddle.play();
        }
        
        // Screen shake for powerful hits
        if (visualEffectsEnabled && Math.abs(ball.speedX) > MAX_BALL_SPEED * 0.7) {
            shakeScreen(Math.abs(ball.speedX) / MAX_BALL_SPEED * 10);
        }
        
        // Hit effect
        if (visualEffectsEnabled) {
            createHitEffect(ball.x, ball.y, 20, paddle.color);
            createParticles(ball.x, ball.y, 15, paddle.color);
        }
        
        // Increment rally counter
        incrementRally();
        
        // Record last hit
        ball.lastHitBy = paddle === player1 ? 1 : 2;
        paddle.lastHitTime = Date.now();
        
        // Add to special meter
        paddle.specialMeter = Math.min(paddle.specialMeter + SPECIAL_METER_GAIN, SPECIAL_METER_MAX);
        if (paddle.specialMeter >= SPECIAL_METER_MAX && !paddle.specialActive) {
            paddle.specialReady = true;
            document.getElementById(`special-ready-${paddle === player1 ? 'p1' : 'p2'}`).classList.add('active');
        }
        updateSpecialMeterDisplay(paddle);
    }
}

function adjustBallAngle(ball, paddle) {
    // Calculate relative impact position (0 = middle, -0.5 = top, 0.5 = bottom)
    const relativeY = ((ball.y - paddle.y) / paddle.height) - 0.5;
    
    // Change angle based on impact position
    ball.speedY = relativeY * 7 * gameSpeed;
    
    // Ensure minimum Y velocity
    if (Math.abs(ball.speedY) < 1) {
        ball.speedY = ball.speedY > 0 ? 1 : -1;
    }
}

function updateAI() {
    // Player 1 AI
    if (player1.isAI) {
        updateAIPaddle(player1, aiDifficulty);
    }
    
    // Player 2 AI
    if (player2.isAI) {
        updateAIPaddle(player2, aiDifficulty);
    }
}

function updateAIPaddle(paddle, difficulty) {
    // Find the ball targeted at this paddle or closest to it
    let targetBall = null;
    let minDistance = Infinity;
    
    for (const ball of ballsInPlay) {
        // Only target balls headed toward this paddle
        if ((paddle === player1 && ball.speedX < 0) || (paddle === player2 && ball.speedX > 0)) {
            const distance = Math.abs(ball.x - paddle.x);
            if (distance < minDistance) {
                minDistance = distance;
                targetBall = ball;
            }
        }
    }
    
    // If no ball is coming toward this paddle, find closest ball
    if (!targetBall && ballsInPlay.length > 0) {
        for (const ball of ballsInPlay) {
            const distance = Math.abs(ball.x - paddle.x);
            if (distance < minDistance) {
                minDistance = distance;
                targetBall = ball;
            }
        }
    }
    
    if (!targetBall) return;
    
    // Calculate prediction for ball position
    const timeToIntercept = Math.abs((paddle.x - targetBall.x) / targetBall.speedX);
    
    // Predicted Y position when ball reaches paddle X position
    let predictedY = targetBall.y + targetBall.speedY * timeToIntercept;
    
    // Account for bounces
    while (predictedY < 0 || predictedY > gameCanvas.height) {
        if (predictedY < 0) predictedY = -predictedY;
        if (predictedY > gameCanvas.height) predictedY = 2 * gameCanvas.height - predictedY;
    }
    
    // Add imperfection based on difficulty (1-5)
    // Lower difficulty means more imperfection
    const imperfectionFactor = (6 - difficulty) * 20;
    predictedY += (Math.random() - 0.5) * imperfectionFactor;
    
    // Set target with delay based on reaction time
    setTimeout(() => {
        paddle.aiTarget = predictedY - paddle.height / 2;
    }, paddle.aiReactionTime * 1000);
    
    // Move toward target if set
    if (paddle.aiTarget !== null) {
        const paddleCenter = paddle.y + paddle.height / 2;
        const distanceToTarget = paddle.aiTarget + paddle.height / 2 - paddleCenter;
        
        // Ease toward target
        const moveSpeed = Math.min(Math.abs(distanceToTarget), paddle.speed * gameSpeed);
        
        if (distanceToTarget > 0 && paddle.y + paddle.height < gameCanvas.height) {
            paddle.y += moveSpeed;
        } else if (distanceToTarget < 0 && paddle.y > 0) {
            paddle.y -= moveSpeed;
        }
    }
    
    // AI Special ability usage
    if (paddle.specialReady && Math.random() < 0.01) {
        activateSpecialAbility(paddle);
    }
}

function resetBall(side = null) {
    // Create a new ball and reset game state
    ballsInPlay = [new Ball()];
    
    // Force the ball to go in the specified direction
    if (side) {
        ballsInPlay[0].reset(side);
    }
}

function incrementRally() {
    currentRally++;
    document.getElementById('rally-counter').textContent = `RALLY: ${currentRally}`;
    
    // Check if this is the longest rally
    if (currentRally > longestRally) {
        longestRally = currentRally;
        stats.longestRally = longestRally;
    }
}

function resetRally() {
    currentRally = 0;
    document.getElementById('rally-counter').textContent = `RALLY: ${currentRally}`;
}

function updatePowerups() {
    // Update floating powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.update();
        
        // Check for collision with balls
        for (const ball of ballsInPlay) {
            const dx = powerup.x - ball.x;
            const dy = powerup.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < powerup.size / 2 + ball.size && powerup.active) {
                // Determine which player gets the powerup
                if (ball.lastHitBy === 1) {
                    powerup.activate(player1);
                } else if (ball.lastHitBy === 2) {
                    powerup.activate(player2);
                }
                
                // Remove powerup
                powerups.splice(i, 1);
                break;
            }
        }
    }
    
    // Update active powerup timers
    updatePowerupTimers(player1);
    updatePowerupTimers(player2);
}

function updatePowerupTimers(player) {
    for (let i = player.powerups.length - 1; i >= 0; i--) {
        player.powerups[i].timeRemaining -= 16; // ~16ms per frame at 60fps
        
        if (player.powerups[i].timeRemaining <= 0) {
            // Powerup expired, remove it
            player.powerups.splice(i, 1);
            updatePowerupIndicators();
        }
    }
}

function updatePowerupIndicators() {
    // Update player 1 powerup indicators
    const p1Indicators = document.getElementById('powerup-indicators-p1');
    p1Indicators.innerHTML = '';
    
    for (const powerup of player1.powerups) {
        const icon = document.createElement('div');
        icon.className = 'powerup-icon';
        icon.style.backgroundColor = powerup.color;
        icon.textContent = powerup.icon;
        p1Indicators.appendChild(icon);
    }
    
    // Update player 2 powerup indicators
    const p2Indicators = document.getElementById('powerup-indicators-p2');
    p2Indicators.innerHTML = '';
    
    for (const powerup of player2.powerups) {
        const icon = document.createElement('div');
        icon.className = 'powerup-icon';
        icon.style.backgroundColor = powerup.color;
        icon.textContent = powerup.icon;
        p2Indicators.appendChild(icon);
    }
}

function updateSpecialMeters() {
    updateSpecialMeterDisplay(player1);
    updateSpecialMeterDisplay(player2);
}

function updateSpecialMeterDisplay(player) {
    const isPlayer1 = player === player1;
    const meterElement = document.getElementById(`special-meter-${isPlayer1 ? 'p1' : 'p2'}`).querySelector('.special-fill');
    meterElement.style.width = `${(player.specialMeter / SPECIAL_METER_MAX) * 100}%`;
}

function activateSpecialAbility(player) {
    if (!player.specialReady || player.specialActive) return;
    
    player.specialReady = false;
    player.specialActive = true;
    player.specialMeter = 0;
    
    // Hide special ready indicator
    document.getElementById(`special-ready-${player === player1 ? 'p1' : 'p2'}`).classList.remove('active');
    
    // Play special sound
    sounds.special.play();
    
    // Visual effect
    flashScreen(player === player1 ? player1.color : player2.color);
    
    // Apply special ability based on player
    if (player === player1) {
        // Player 1 special: Time slowdown for opponent
        player2.speed /= 2;
        showMessage("TIME WARP!");
        
        setTimeout(() => {
            player2.speed *= 2;
            player1.specialActive = false;
        }, 5000);
    } else {
        // Player 2 special: Ball acceleration
        ballsInPlay.forEach(ball => {
            ball.speedX *= 1.5;
            ball.speedY *= 1.5;
            ball.glowing = true;
        });
        showMessage("HYPER SPEED!");
        
        setTimeout(() => {
            ballsInPlay.forEach(ball => {
                ball.speedX /= 1.5;
                ball.speedY /= 1.5;
                ball.glowing = false;
            });
            player2.specialActive = false;
        }, 5000);
    }
}

// -------------------- VISUAL EFFECTS --------------------

function createParticles(x, y, count, color) {
    if (!visualEffectsEnabled) return;
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        const size = Math.random() * 4 + 2;
        
        particles.push(new Particle(
            x,
            y,
            color,
            size,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        ));
    }
}

function createPowerupParticles(x, y, color) {
    if (!visualEffectsEnabled) return;
    
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const size = Math.random() * 6 + 3;
        
        particles.push(new Particle(
            x,
            y,
            color,
            size,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            1,
            0.05  // slight gravity
        ));
    }
}

function createHitEffect(x, y, size, color) {
    if (!visualEffectsEnabled) return;
    
    hitEffects.push(new HitEffect(x, y, size, color));
}

function createScoreEffect(player) {
    if (!visualEffectsEnabled) return;
    
    const color = player === 1 ? player1.color : player2.color;
    const x = player === 1 ? gameCanvas.width * 0.25 : gameCanvas.width * 0.75;
    
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        const size = Math.random() * 8 + 4;
        
        particles.push(new Particle(
            x,
            gameCanvas.height / 2,
            color,
            size,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            1,
            0.1  // gravity
        ));
    }
}

function updateParticles() {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        
        // Remove dead particles
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
}

function updateHitEffects() {
    // Update hit effects
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        hitEffects[i].update();
        
        // Remove finished effects
        if (hitEffects[i].isDead()) {
            hitEffects.splice(i, 1);
        }
    }
}

function shakeScreen(intensity) {
    if (!visualEffectsEnabled) return;
    
    const gameScreen = document.getElementById('game-screen');
    gameScreen.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
    
    setTimeout(() => {
        gameScreen.style.transform = 'translate(0, 0)';
    }, 100);
}

function flashScreen(color = '#ffffff') {
    if (!visualEffectsEnabled) return;
    
    const flashOverlay = screens.flash;
    flashOverlay.style.backgroundColor = color ? `${color}20` : 'rgba(255, 255, 255, 0.2)';
    flashOverlay.classList.add('active');
    
    setTimeout(() => {
        flashOverlay.classList.remove('active');
    }, 100);
}

function showMessage(text, duration = 2000) {
    const messageDisplay = document.getElementById('message-display');
    messageDisplay.textContent = text;
    messageDisplay.style.opacity = 1;
    
    clearTimeout(messageDisplay.hideTimeout);
    messageDisplay.hideTimeout = setTimeout(() => {
        messageDisplay.style.opacity = 0;
    }, duration);
}

// -------------------- GAME MODE MECHANICS --------------------

function updateGameMode() {
    switch (currentGameMode) {
        case GAME_MODES.CHAOS:
            // Random events in chaos mode
            if (Math.random() < 0.001) {
                const events = ['reverse', 'speedup', 'slowdown', 'sizechange'];
                const event = events[Math.floor(Math.random() * events.length)];
                triggerChaosEvent(event);
            }
            break;
            
        case GAME_MODES.SPEED:
            // Gradually increase ball speed in speed mode
            for (const ball of ballsInPlay) {
                ball.speedX *= 1.0003;
                ball.speedY *= 1.0003;
            }
            break;
            
        case GAME_MODES.MULTI:
            // Periodically add balls in multiball mode (up to 3)
            if (ballsInPlay.length < 3 && Math.random() < 0.0005) {
                addBall();
            }
            break;
    }
}

function triggerChaosEvent(event) {
    switch (event) {
        case 'reverse':
            // Reverse ball directions
            ballsInPlay.forEach(ball => {
                ball.speedX = -ball.speedX;
                ball.speedY = -ball.speedY;
            });
            showMessage("DIRECTION REVERSED!");
            flashScreen('#ff40ff');
            break;
            
        case 'speedup':
            // Speed up ball
            ballsInPlay.forEach(ball => {
                ball.speedX *= 1.5;
                ball.speedY *= 1.5;
            });
            showMessage("SPEED BOOST!");
            flashScreen('#ff4040');
            break;
            
        case 'slowdown':
            // Slow down ball
            ballsInPlay.forEach(ball => {
                ball.speedX *= 0.6;
                ball.speedY *= 0.6;
            });
            showMessage("SLOWDOWN!");
            flashScreen('#4040ff');
            break;
            
        case 'sizechange':
            // Change paddle sizes
            const originalHeight1 = player1.height;
            const originalHeight2 = player2.height;
            
            // Random size between 40 and 120
            player1.height = Math.random() * 80 + 40;
            player2.height = Math.random() * 80 + 40;
            
            showMessage("SIZE CHANGE!");
            flashScreen('#40ff40');
            
            // Restore after 10 seconds
            setTimeout(() => {
                player1.height = originalHeight1;
                player2.height = originalHeight2;
            }, 10000);
            break;
    }
}

// -------------------- POWERUP MECHANICS --------------------

function applySpeedPowerup(player) {
    player.speed *= 1.5;
    setTimeout(() => {
        player.speed /= 1.5;
    }, 5000);
}

function applySizePowerup(player) {
    const originalHeight = player.height;
    player.height *= 1.5;
    setTimeout(() => {
        player.height = originalHeight;
    }, 5000);
}

function applySlowPowerup(player) {
    player.speed *= 0.5;
    setTimeout(() => {
        player.speed *= 2;
    }, 5000);
}

function applyMultiballPowerup() {
    addBall();
    addBall();
}

function applyReversePowerup(player) {
    // Reverse controls
    const upTemp = player.upPressed;
    player.upPressed = player.downPressed;
    player.downPressed = upTemp;
    
    setTimeout(() => {
        // Reset to normal
        const upTemp = player.upPressed;
        player.upPressed = player.downPressed;
        player.downPressed = upTemp;
    }, 5000);
}

function applyInvisiblePowerup() {
    // Make all balls temporarily invisible
    ballsInPlay.forEach(ball => {
        ball.isInvisible = true;
    });
    
    setTimeout(() => {
        ballsInPlay.forEach(ball => {
            ball.isInvisible = false;
        });
    }, 5000);
}

function addBall() {
    // Create new ball with random position and direction
    const newBall = new Ball(
        gameCanvas.width / 2,
        gameCanvas.height / 2 + (Math.random() - 0.5) * 100,
        (Math.random() > 0.5 ? DEFAULT_BALL_SPEED : -DEFAULT_BALL_SPEED) * gameSpeed,
        (Math.random() > 0.5 ? DEFAULT_BALL_SPEED : -DEFAULT_BALL_SPEED) * gameSpeed
    );
    
    ballsInPlay.push(newBall);
    showMessage("MULTIBALL!");
}

// -------------------- RENDERING FUNCTIONS --------------------

// Main draw function
function draw() {
    // Clear canvas
    ctx.fillStyle = '#080820';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw middle line
    drawMiddleLine();
    
    // Draw powerups
    drawPowerups();
    
    // Draw particles
    drawParticles();
    
    // Draw hit effects
    drawHitEffects();
    
    // Draw paddles
    drawPaddle(player1);
    drawPaddle(player2);
    
    // Draw balls
    for (const ball of ballsInPlay) {
        drawBall(ball);
    }
}

function drawMiddleLine() {
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    ctx.moveTo(gameCanvas.width / 2, 0);
    ctx.lineTo(gameCanvas.width / 2, gameCanvas.height);
    ctx.strokeStyle = 'rgba(119, 136, 255, 0.3)';
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBall(ball) {
    // Draw ball trail
    if (visualEffectsEnabled && !ball.isInvisible) {
        for (let i = ball.trail.length - 1; i >= 0; i--) {
            const trailPos = ball.trail[i];
            const alpha = 0.3 - (i / ball.trail.length * 0.3);
            ctx.beginPath();
            ctx.arc(trailPos.x, trailPos.y, ball.size - i, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
    }
    
    // Determine visibility for invisible ball (pulsing)
    let ballAlpha = 1;
    if (ball.isInvisible) {
        ballAlpha = 0.1 + ball.invisibilityFactor * 0.2;
    }

    // Draw ball with glow if needed
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    
    if (ball.glowing && visualEffectsEnabled) {
        ctx.shadowColor = '#4080ff';
        ctx.shadowBlur = 15;
    }
    
    ctx.fillStyle = `rgba(255, 255, 255, ${ballAlpha})`;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function drawPaddle(paddle) {
    // Create gradient for aesthetic effect
    const gradient = ctx.createLinearGradient(
        paddle.x, paddle.y, 
        paddle.x + paddle.width, paddle.y
    );
    gradient.addColorStop(0, paddle.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Add highlight at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, 5);
    
    // Add glow during special activation
    if (paddle.specialActive && visualEffectsEnabled) {
        ctx.shadowColor = paddle.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.rect(paddle.x - 2, paddle.y - 2, paddle.width + 4, paddle.height + 4);
        ctx.strokeStyle = paddle.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function drawPowerups() {
    for (const powerup of powerups) {
        ctx.save();
        ctx.translate(powerup.x, powerup.y);
        ctx.rotate(powerup.rotation);
        
        // Draw powerup circle
        ctx.beginPath();
        ctx.arc(0, 0, powerup.size / 2, 0, Math.PI * 2);
        
        // Add glow
        if (visualEffectsEnabled) {
            ctx.shadowColor = powerup.color;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = powerup.color + '80';  // Add transparency
        ctx.fill();
        
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(0, 0, powerup.size / 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Draw icon
        ctx.fillStyle = '#000000';
        ctx.font = `${powerup.size / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.icon, 0, 0);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

function drawParticles() {
    if (!visualEffectsEnabled) return;
    
    for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.includes('rgba') ? 
            particle.color : 
            `rgba(${hexToRgb(particle.color)}, ${particle.life})`;
        ctx.fill();
    }
}

function drawHitEffects() {
    if (!visualEffectsEnabled) return;
    
    for (const effect of hitEffects) {
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(
            effect.x, effect.y, 0,
            effect.x, effect.y, effect.size
        );
        gradient.addColorStop(0, `${effect.color}00`);
        gradient.addColorStop(0.5, `${effect.color}${Math.floor(effect.alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${effect.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '255, 255, 255';
}

// -------------------- UI FUNCTIONS --------------------

// Update score display
function updateScoreDisplay() {
    document.getElementById('player1-score').textContent = player1Score;
    document.getElementById('player2-score').textContent = player2Score;
    
    // Update final score display
    document.getElementById('final-score-p1').textContent = player1Score;
    document.getElementById('final-score-p2').textContent = player2Score;
}

// Update game timer display
function updateGameTimer() {
    const minutes = Math.floor(gameTimer / 60).toString().padStart(2, '0');
    const seconds = (gameTimer % 60).toString().padStart(2, '0');
    document.getElementById('game-timer').textContent = `${minutes}:${seconds}`;
    
    // Update final stats time
    document.getElementById('stat-total-time').textContent = `${minutes}:${seconds}`;
}

// Start game timer
function startGameTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameRunning && !gamePaused) {
            gameTimer++;
            updateGameTimer();
        }
    }, 1000);
}

// Show a specific screen and hide others
function showScreen(screen) {
    // Hide all screens
    Object.values(screens).forEach(s => {
        if (s && s !== screens.flash && s !== screens.specialEffect) s.classList.remove('active');
    });
    
    // Show the requested screen
    if (screen) screen.classList.add('active');
}

// Show countdown before starting game
function showCountdown() {
    gamePaused = true;
    let count = 3;
    
    screens.countdown.classList.add('active');
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count <= 0) {
            clearInterval(countdownInterval);
            screens.countdown.classList.remove('active');
            gamePaused = false;
            
            // Force ball to move if it's stuck
            ballsInPlay.forEach(ball => {
                if (Math.abs(ball.speedX) < 0.5) ball.speedX = ball.speedX > 0 ? DEFAULT_BALL_SPEED * gameSpeed : -DEFAULT_BALL_SPEED * gameSpeed;
                if (Math.abs(ball.speedY) < 0.5) ball.speedY = ball.speedY > 0 ? DEFAULT_BALL_SPEED * gameSpeed : -DEFAULT_BALL_SPEED * gameSpeed;
            });
        } else {
            countdownElement.textContent = count;
            if (soundEnabled) sounds.countdown.play();
        }
    }, 1000);
}

// Update game speed based on slider
function updateGameSpeed(value) {
    const speedValues = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
    gameSpeed = value / 2;
    document.getElementById('speed-value').textContent = speedValues[value-1];
}

// Update AI difficulty based on slider
function updateAIDifficulty(value) {
    const difficultyValues = ['Beginner', 'Easy', 'Normal', 'Hard', 'Expert'];
    aiDifficulty = value;
    document.getElementById('ai-value').textContent = difficultyValues[value-1];
    
    // Update AI reaction time based on difficulty
    const reactionTimes = [0.3, 0.25, 0.15, 0.1, 0.05];
    player1.aiReactionTime = reactionTimes[value-1];
    player2.aiReactionTime = reactionTimes[value-1];
}

// Check for a winner
function checkWinner() {
    if (player1Score >= winningScore || player2Score >= winningScore) {
        gameRunning = false;
        clearInterval(timerInterval);
        
        const winner = player1Score >= winningScore ? "PLAYER 1" : "PLAYER 2";
        document.getElementById('winner-display').textContent = winner + " WINS!";
        
        // Update final stats display
        document.getElementById('stat-longest-rally').textContent = stats.longestRally;
        document.getElementById('stat-powerups').textContent = stats.powerupsCollected;
        document.getElementById('stat-max-speed').textContent = Math.round(stats.maxBallSpeed * 10) / 10;
        
        if (soundEnabled) sounds.win.play();
        showScreen(screens.gameOver);
    }
}

// -------------------- GAME CONTROL FUNCTIONS --------------------

// Reset game state
function resetGame() {
    // Reset scores
    player1Score = 0;
    player2Score = 0;
    updateScoreDisplay();
    
    // Reset paddles
    player1.y = gameCanvas.height / 2 - PADDLE_HEIGHT / 2;
    player2.y = gameCanvas.height / 2 - PADDLE_HEIGHT / 2;
    player1.height = PADDLE_HEIGHT;
    player2.height = PADDLE_HEIGHT;
    player1.speed = 8;
    player2.speed = 8;
    player1.specialMeter = 0;
    player2.specialMeter = 0;
    player1.specialReady = false;
    player2.specialReady = false;
    player1.specialActive = false;
    player2.specialActive = false;
    player1.powerups = [];
    player2.powerups = [];
    
    // Reset objects
    resetBall();
    powerups = [];
    particles = [];
    hitEffects = [];
    
    // Reset stats
    currentRally = 0;
    longestRally = 0;
    stats = {
        longestRally: 0,
        powerupsCollected: 0,
        totalTime: 0,
        maxBallSpeed: 0
    };
    
    // Reset UI
    document.getElementById('rally-counter').textContent = `RALLY: 0`;
    document.getElementById('special-ready-p1').classList.remove('active');
    document.getElementById('special-ready-p2').classList.remove('active');
    updateSpecialMeterDisplay(player1);
    updateSpecialMeterDisplay(player2);
    updatePowerupIndicators();
    
    // Reset game timer
    gameTimer = 0;
    updateGameTimer();
    
    // Update mode indicator
    document.getElementById('mode-indicator').textContent = currentGameMode.toUpperCase();
}

// Start the game
function startGame() {
    resetGame();
    gameRunning = true;
    gamePaused = false;
    startGameTimer();
    
    // Apply player types
    player1.isAI = player1IsAI;
    player2.isAI = player2IsAI;
    
    showScreen(screens.game);
    
    // Ensure ball has valid velocity before starting
    ballsInPlay.forEach(ball => {
        if (Math.abs(ball.speedX) < 0.5) ball.speedX = ball.speedX > 0 ? DEFAULT_BALL_SPEED * gameSpeed : -DEFAULT_BALL_SPEED * gameSpeed;
        if (Math.abs(ball.speedY) < 0.5) ball.speedY = ball.speedY > 0 ? DEFAULT_BALL_SPEED * gameSpeed : -DEFAULT_BALL_SPEED * gameSpeed;
    });
    
    showCountdown();
    
    if (musicEnabled) bgMusic.play('game');
}

// Pause the game
function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = true;
    showScreen(screens.pause);
    
    if (musicEnabled) bgMusic.pause();
}

// Resume the game
function resumeGame() {
    if (!gameRunning) return;
    
    showScreen(screens.game);
    setTimeout(() => {
        gamePaused = false;
        if (musicEnabled) bgMusic.play('game');
    }, 500);
}

// Start with a specific game mode
function startGameMode(mode) {
    currentGameMode = mode;
    showScreen(screens.playerSelect);
}

// -------------------- GAME LOOP --------------------

// Game loop with performance throttling
function gameLoop(timestamp) {
    // Always request next frame first to ensure smooth animation
    requestAnimationFrame(gameLoop);
    
    // Skip if game is not running or paused
    if (!gameRunning || gamePaused) return;
    
    // Calculate time elapsed since last frame
    const elapsed = timestamp - lastFrameTime;
    
    // Only update if enough time has passed (frame limiting)
    if (elapsed > frameDelay) {
        // Update timing
        lastFrameTime = timestamp - (elapsed % frameDelay);
        
        // Update game state
        update();
        
        // Draw everything
        draw();
    }
}

// Update background continuously
function backgroundLoop() {
    updateBackgroundParticles();
    requestAnimationFrame(backgroundLoop);
}

// -------------------- SETUP AND INITIALIZATION --------------------

// Setup menu controls and UI interactions
function setupMenuControls() {
    // Main Menu Buttons
    document.getElementById('play-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        currentGameMode = GAME_MODES.CLASSIC;
        showScreen(screens.playerSelect);
    });
    
    document.getElementById('modes-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.modes);
    });
    
    document.getElementById('options-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.options);
    });
    
    document.getElementById('credits-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.credits);
    });
    
    // Game Modes
    document.querySelectorAll('.mode-item').forEach(item => {
        item.addEventListener('click', () => {
            if (soundEnabled) sounds.menu.play();
            
            // Remove selected class from all modes
            document.querySelectorAll('.mode-item').forEach(m => m.classList.remove('selected'));
            
            // Add selected class to clicked mode
            item.classList.add('selected');
            
            // Set current game mode
            const mode = item.getAttribute('data-mode');
            currentGameMode = mode;
        });
    });
    
    document.getElementById('modes-back').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.mainMenu);
    });
    
    // Options Menu
    document.getElementById('options-back').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.mainMenu);
    });
    
    // Game speed slider
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.addEventListener('input', () => {
        updateGameSpeed(parseInt(speedSlider.value));
    });
    
    // AI difficulty slider
    const aiSlider = document.getElementById('ai-slider');
    aiSlider.addEventListener('input', () => {
        updateAIDifficulty(parseInt(aiSlider.value));
    });
    
    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
    });
    
    // Music toggle
    document.getElementById('music-toggle').addEventListener('change', (e) => {
        musicEnabled = e.target.checked;
        if (musicEnabled && gameRunning && !gamePaused) {
            bgMusic.play('game');
        } else {
            bgMusic.pause();
        }
    });
    
    // Visual effects toggle
    document.getElementById('effects-toggle').addEventListener('change', (e) => {
        visualEffectsEnabled = e.target.checked;
    });
    
    // Powerups toggle
    document.getElementById('powerups-toggle').addEventListener('change', (e) => {
        powerupsEnabled = e.target.checked;
    });
    
    // Win score controls
    document.getElementById('score-decrease').addEventListener('click', () => {
        if (winningScore > 1) {
            winningScore--;
            document.getElementById('win-score').textContent = winningScore;
        }
    });
    
    document.getElementById('score-increase').addEventListener('click', () => {
        winningScore++;
        document.getElementById('win-score').textContent = winningScore;
    });
    
    // Credits back button
    document.getElementById('credits-back').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.mainMenu);
    });
    
    // Player selection screen
    document.querySelectorAll('.player-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (soundEnabled) sounds.menu.play();
            
            const player = btn.getAttribute('data-player');
            const type = btn.getAttribute('data-type');
            
            // Update UI
            document.querySelectorAll(`.player-type-btn[data-player="${player}"]`).forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            // Update game state
            if (player === '1') {
                player1IsAI = type === 'ai';
            } else {
                player2IsAI = type === 'ai';
            }
        });
    });
    
    document.getElementById('start-game-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        startGame();
    });
    
    document.getElementById('player-select-back').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.modes);
    });
    
    // Pause menu buttons
    document.getElementById('pause-btn').addEventListener('click', () => {
        pauseGame();
    });
    
    document.getElementById('resume-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        resumeGame();
    });
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        startGame();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.options);
    });
    
    document.getElementById('quit-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        gameRunning = false;
        clearInterval(timerInterval);
        showScreen(screens.mainMenu);
    });
    
    // Game over screen buttons
    document.getElementById('play-again-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        startGame();
    });
    
    document.getElementById('change-mode-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.modes);
    });
    
    document.getElementById('main-menu-btn').addEventListener('click', () => {
        if (soundEnabled) sounds.menu.play();
        showScreen(screens.mainMenu);
    });
}

// Initialize game
function init() {
    // Set canvas dimensions based on container
    const resizeCanvas = () => {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            const rect = gameArea.getBoundingClientRect();
            gameCanvas.width = rect.width;
            gameCanvas.height = rect.height;
            
            // Update paddle positions
            player1.x = 20;
            player2.x = gameCanvas.width - 20 - PADDLE_WIDTH;
            
            // Update particle canvas
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }
    };
    
    // Resize on window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Initial resize
    setTimeout(resizeCanvas, 100);
    
    // Reset game state
    resetGame();
    
    // Setup controls
    setupControls();
    setupMenuControls();
    
    // Initialize game UI
    updateGameSpeed(2);
    updateAIDifficulty(3);
    
    // Draw initial state
    draw();
    
    // Start background animation
    backgroundLoop();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Show main menu by default
    showScreen(screens.mainMenu);
    
    // Start menu music
    if (musicEnabled) bgMusic.play('menu');
}

// Start the game when the page loads
window.addEventListener('load', init); 