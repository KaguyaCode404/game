/**
 * ====================================================================
 * NEON HORIZON // VOID PROTOCOL - GAME ENGINE
 * Complete vanilla HTML5 Canvas 60fps space shooter with
 * Web Audio API synthesizer, particle physics & threat scaling.
 * ====================================================================
 */

// --------------------------------------------------------------------
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER (Zero external MP3s needed)
// --------------------------------------------------------------------
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('neon_audio_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('neon_audio_muted', this.isMuted);
    return this.isMuted;
  }

  playLaser(pitch = 880) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playEnemyLaser() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playExplosion(size = 'med') {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = size === 'large' ? 0.45 : 0.25;

      // Noise generator for crunchy arcade explosion
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Lowpass filter to muffle noise into an explosion
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(size === 'large' ? 400 : 700, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(size === 'large' ? 0.35 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {}
  }

  playPowerup() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.11);
      });
    } catch (e) {}
  }

  playShieldHit() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }
}

// --------------------------------------------------------------------
// 2. GAME ENGINE CORE
// --------------------------------------------------------------------
class NeonVoidGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sounds = new SoundSystem();

    // Virtual resolution
    this.width = 800;
    this.height = 520;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game States: 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.state = 'START';

    // Telemetry & Metrics
    this.score = 0;
    this.kills = 0;
    this.multiplier = 1.0;
    this.highScore = parseInt(localStorage.getItem('neon_highscore') || '0', 10);

    // Keyboard & Input state
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      shield: false
    };

    // Parallax Starfield
    this.stars = this.createStarfield(120);

    // Entities
    this.player = null;
    this.playerLasers = [];
    this.enemyLasers = [];
    this.asteroids = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.shockwaves = [];

    // Spawners & Timers
    this.lastTime = 0;
    this.asteroidTimer = 0;
    this.enemyTimer = 0;
    this.lastFireTime = 0;

    // Connect DOM Elements
    this.initDOM();
    this.bindEvents();
    this.resetGame();

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initDOM() {
    this.hudScore = document.getElementById('hudScore');
    this.hudMultiplier = document.getElementById('hudMultiplier');
    this.hudHealthBar = document.getElementById('hudHealthBar');
    this.hudShieldBar = document.getElementById('hudShieldBar');
    this.hudHighScore = document.getElementById('hudHighScore');
    this.hudHighScore.innerText = this.pad(this.highScore, 6);

    this.startOverlay = document.getElementById('startOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');

    this.finalScoreVal = document.getElementById('finalScoreVal');
    this.finalKillsVal = document.getElementById('finalKillsVal');
    this.finalBestVal = document.getElementById('finalBestVal');

    this.audioBtn = document.getElementById('btnAudioToggle');
    this.audioIcon = document.getElementById('audioIcon');
    this.audioLabel = document.getElementById('audioLabel');

    this.pauseBtn = document.getElementById('btnPauseGame');
    this.pauseIcon = document.getElementById('pauseIcon');
    this.pauseLabel = document.getElementById('pauseLabel');

    this.updateAudioButtonState();
  }

  updateAudioButtonState() {
    if (this.sounds.isMuted) {
      this.audioLabel.innerText = 'AUDIO: OFF';
      this.audioIcon.setAttribute('data-lucide', 'volume-x');
    } else {
      this.audioLabel.innerText = 'AUDIO: ON';
      this.audioIcon.setAttribute('data-lucide', 'volume-2');
    }
    if (window.lucide) lucide.createIcons();
  }

  createStarfield(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
    return stars;
  }

  resetGame() {
    this.score = 0;
    this.kills = 0;
    this.multiplier = 1.0;
    this.asteroidTimer = 0;
    this.enemyTimer = 0;

    this.playerLasers = [];
    this.enemyLasers = [];
    this.asteroids = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.shockwaves = [];

    this.player = {
      x: this.width / 2,
      y: this.height - 70,
      width: 32,
      height: 40,
      speed: 6.2,
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      isShieldActive: false,
      overdriveTimer: 0,
      invulnerableTimer: 0,
      tilt: 0
    };

    this.updateHUD();
  }

  startGame() {
    this.sounds.init();
    this.resetGame();
    this.state = 'PLAYING';
    this.startOverlay.classList.remove('active');
    this.pauseOverlay.classList.remove('active');
    this.gameOverOverlay.classList.remove('active');
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseOverlay.classList.add('active');
      this.pauseLabel.innerText = 'RESUME';
      this.pauseIcon.setAttribute('data-lucide', 'play');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.pauseOverlay.classList.remove('active');
      this.pauseLabel.innerText = 'PAUSE';
      this.pauseIcon.setAttribute('data-lucide', 'pause');
    }
    if (window.lucide) lucide.createIcons();
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    this.sounds.playExplosion('large');

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_highscore', this.highScore);
      this.hudHighScore.innerText = this.pad(this.highScore, 6);
    }

    this.finalScoreVal.innerText = this.score;
    this.finalKillsVal.innerText = this.kills;
    this.finalBestVal.innerText = this.highScore;

    this.gameOverOverlay.classList.add('active');
  }

  // --------------------------------------------------------------------
  // 3. INPUT HANDLERS
  // --------------------------------------------------------------------
  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.sounds.init();
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.up = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.down = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.keys.fire = true;
          if (this.state === 'START') this.startGame();
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shield = true;
          e.preventDefault();
          break;
        case 'KeyP':
        case 'Escape':
          this.togglePause();
          break;
        case 'KeyM':
          this.sounds.toggleMute();
          this.updateAudioButtonState();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.up = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.down = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.fire = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shield = false;
          break;
      }
    });

    // Button Listeners
    document.getElementById('btnStartGame').addEventListener('click', () => this.startGame());
    document.getElementById('btnResumeGame').addEventListener('click', () => this.togglePause());
    document.getElementById('btnRestartGame').addEventListener('click', () => this.startGame());

    this.audioBtn.addEventListener('click', () => {
      this.sounds.init();
      this.sounds.toggleMute();
      this.updateAudioButtonState();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.sounds.init();
      this.togglePause();
    });

    // Touch / Virtual Buttons
    const setupTouchBtn = (id, action) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const start = (e) => {
        e.preventDefault();
        this.sounds.init();
        if (this.state === 'START') this.startGame();
        this.keys[action] = true;
      };
      const end = (e) => {
        e.preventDefault();
        this.keys[action] = false;
      };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('touchstart', start);
      btn.addEventListener('touchend', end);
    };

    setupTouchBtn('touchLeft', 'left');
    setupTouchBtn('touchRight', 'right');
    setupTouchBtn('touchFire', 'fire');
    setupTouchBtn('touchShield', 'shield');
  }

  // --------------------------------------------------------------------
  // 4. ENTITY SPAWNERS & UPDATES
  // --------------------------------------------------------------------
  spawnAsteroid() {
    const isLarge = Math.random() > 0.45;
    const radius = isLarge ? Math.random() * 16 + 24 : Math.random() * 8 + 14;
    const points = [];
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const offset = radius * (0.75 + Math.random() * 0.5);
      points.push({
        x: Math.cos(angle) * offset,
        y: Math.sin(angle) * offset
      });
    }

    this.asteroids.push({
      x: Math.random() * (this.width - 60) + 30,
      y: -radius - 10,
      radius,
      points,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 1.5 + 1.2 + (this.score / 6000),
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.04,
      health: isLarge ? 4 : 2,
      isLarge
    });
  }

  spawnEnemy() {
    this.enemies.push({
      x: Math.random() * (this.width - 100) + 50,
      y: -40,
      width: 30,
      height: 32,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 1.2 + 1.4 + (this.score / 8000),
      health: 3,
      fireTimer: Math.random() * 60 + 60,
      hoverOffset: Math.random() * Math.PI * 2
    });
  }

  spawnPowerup(x, y) {
    const rand = Math.random();
    let type = 'overdrive';
    if (rand < 0.35) type = 'repair';
    else if (rand < 0.65) type = 'shield';

    this.powerups.push({
      x,
      y,
      type,
      radius: 12,
      vy: 1.5,
      pulse: 0
    });
  }

  createExplosionParticles(x, y, color = '#00f0ff', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1,
        life: Math.random() * 20 + 20
      });
    }

    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 35,
      color,
      alpha: 0.8
    });
  }

  // --------------------------------------------------------------------
  // 5. UPDATE CYCLE
  // --------------------------------------------------------------------
  update(delta) {
    if (this.state !== 'PLAYING') return;

    // A. Player Movement & Physics
    if (this.keys.left) {
      this.player.x -= this.player.speed;
      this.player.tilt = Math.max(this.player.tilt - 0.1, -0.6);
    } else if (this.keys.right) {
      this.player.x += this.player.speed;
      this.player.tilt = Math.min(this.player.tilt + 0.1, 0.6);
    } else {
      this.player.tilt *= 0.8;
    }

    if (this.keys.up) this.player.y -= this.player.speed;
    if (this.keys.down) this.player.y += this.player.speed;

    // Boundaries
    const margin = 20;
    this.player.x = Math.max(margin, Math.min(this.width - margin, this.player.x));
    this.player.y = Math.max(100, Math.min(this.height - 30, this.player.y));

    // Shield Consumption & Recharge
    if (this.keys.shield && this.player.shield > 2) {
      this.player.isShieldActive = true;
      this.player.shield = Math.max(0, this.player.shield - 0.45);
    } else {
      this.player.isShieldActive = false;
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 0.12);
    }

    // Overdrive decay
    if (this.player.overdriveTimer > 0) {
      this.player.overdriveTimer--;
    }

    // Invulnerability decay
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer--;
    }

    // Player Firing
    const now = performance.now();
    const fireInterval = this.player.overdriveTimer > 0 ? 110 : 200;
    if (this.keys.fire && now - this.lastFireTime > fireInterval) {
      this.lastFireTime = now;
      if (this.player.overdriveTimer > 0) {
        // Triple Spread Cannon
        this.playerLasers.push({ x: this.player.x, y: this.player.y - 20, vx: 0, vy: -14, color: '#00f0ff' });
        this.playerLasers.push({ x: this.player.x - 14, y: this.player.y - 10, vx: -2.5, vy: -13, color: '#ff0055' });
        this.playerLasers.push({ x: this.player.x + 14, y: this.player.y - 10, vx: 2.5, vy: -13, color: '#ff0055' });
        this.sounds.playLaser(1100);
      } else {
        // Twin Plasma Cannons
        this.playerLasers.push({ x: this.player.x - 10, y: this.player.y - 15, vx: 0, vy: -13, color: '#00f0ff' });
        this.playerLasers.push({ x: this.player.x + 10, y: this.player.y - 15, vx: 0, vy: -13, color: '#00f0ff' });
        this.sounds.playLaser(850);
      }
    }

    // Engine exhaust sparks
    if (Math.random() > 0.3) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 8,
        y: this.player.y + 18,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 2 + 1,
        color: this.player.overdriveTimer > 0 ? '#ff0055' : '#00f0ff',
        alpha: 0.8,
        life: 14
      });
    }

    // B. Player Lasers Update
    for (let i = this.playerLasers.length - 1; i >= 0; i--) {
      const l = this.playerLasers[i];
      l.x += l.vx;
      l.y += l.vy;
      if (l.y < -20 || l.x < 0 || l.x > this.width) {
        this.playerLasers.splice(i, 1);
      }
    }

    // C. Enemy Lasers Update
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const l = this.enemyLasers[i];
      l.y += l.vy;

      // Check collision with player
      const dist = Math.hypot(l.x - this.player.x, l.y - this.player.y);
      if (dist < 22) {
        this.enemyLasers.splice(i, 1);
        this.handlePlayerDamage(12);
        continue;
      }

      if (l.y > this.height + 20) {
        this.enemyLasers.splice(i, 1);
      }
    }

    // D. Spawning Loop
    this.asteroidTimer++;
    const asteroidInterval = Math.max(45, 90 - Math.floor(this.score / 2500));
    if (this.asteroidTimer > asteroidInterval) {
      this.asteroidTimer = 0;
      this.spawnAsteroid();
    }

    this.enemyTimer++;
    const enemyInterval = Math.max(90, 180 - Math.floor(this.score / 3500));
    if (this.enemyTimer > enemyInterval) {
      this.enemyTimer = 0;
      this.spawnEnemy();
    }

    // E. Asteroids Update & Collision
    for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
      const a = this.asteroids[aIdx];
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.vRot;

      // Laser collision
      for (let lIdx = this.playerLasers.length - 1; lIdx >= 0; lIdx--) {
        const l = this.playerLasers[lIdx];
        if (Math.hypot(l.x - a.x, l.y - a.y) < a.radius) {
          this.playerLasers.splice(lIdx, 1);
          a.health--;
          this.createExplosionParticles(l.x, l.y, '#ffd60a', 4);

          if (a.health <= 0) {
            this.sounds.playExplosion(a.isLarge ? 'large' : 'small');
            this.createExplosionParticles(a.x, a.y, '#ffd60a', a.isLarge ? 20 : 10);
            this.score += Math.round(150 * this.multiplier);

            // Chance to drop powerup
            if (Math.random() < 0.22) {
              this.spawnPowerup(a.x, a.y);
            }

            this.asteroids.splice(aIdx, 1);
            break;
          }
        }
      }

      // Check collision with player
      if (this.asteroids[aIdx]) {
        const distToPlayer = Math.hypot(a.x - this.player.x, a.y - this.player.y);
        if (distToPlayer < a.radius + 18) {
          this.handlePlayerDamage(a.isLarge ? 28 : 16);
          this.createExplosionParticles(a.x, a.y, '#ff0055', 14);
          this.asteroids.splice(aIdx, 1);
          continue;
        }
      }

      if (a.y > this.height + 60) {
        this.asteroids.splice(aIdx, 1);
      }
    }

    // F. Enemies Update & Attack
    for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
      const enemy = this.enemies[eIdx];
      enemy.y += enemy.vy;
      enemy.x += Math.sin(enemy.y * 0.03 + enemy.hoverOffset) * 2;

      // Enemy firing
      enemy.fireTimer--;
      if (enemy.fireTimer <= 0) {
        enemy.fireTimer = Math.random() * 70 + 70;
        this.enemyLasers.push({
          x: enemy.x,
          y: enemy.y + 16,
          vy: 5.5
        });
        this.sounds.playEnemyLaser();
      }

      // Laser collision with enemy
      for (let lIdx = this.playerLasers.length - 1; lIdx >= 0; lIdx--) {
        const l = this.playerLasers[lIdx];
        if (Math.hypot(l.x - enemy.x, l.y - enemy.y) < 22) {
          this.playerLasers.splice(lIdx, 1);
          enemy.health--;
          this.createExplosionParticles(l.x, l.y, '#ff0055', 6);

          if (enemy.health <= 0) {
            this.sounds.playExplosion('large');
            this.createExplosionParticles(enemy.x, enemy.y, '#ff0055', 25);
            this.score += Math.round(350 * this.multiplier);
            this.kills++;
            this.multiplier = Math.min(4.0, +(this.multiplier + 0.1).toFixed(1));

            // High chance to drop powerup
            if (Math.random() < 0.45) {
              this.spawnPowerup(enemy.x, enemy.y);
            }

            this.enemies.splice(eIdx, 1);
            break;
          }
        }
      }

      // Collision with player
      if (this.enemies[eIdx]) {
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (dist < 32) {
          this.handlePlayerDamage(24);
          this.createExplosionParticles(enemy.x, enemy.y, '#ff0055', 18);
          this.enemies.splice(eIdx, 1);
          continue;
        }
      }

      if (enemy.y > this.height + 50) {
        this.enemies.splice(eIdx, 1);
      }
    }

    // G. Powerups Update
    for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
      const p = this.powerups[pIdx];
      p.y += p.vy;
      p.pulse += 0.08;

      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < p.radius + 20) {
        this.sounds.playPowerup();
        if (p.type === 'overdrive') {
          this.player.overdriveTimer = 360; // ~6 seconds
        } else if (p.type === 'repair') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
        } else if (p.type === 'shield') {
          this.player.shield = this.player.maxShield;
        }
        this.createExplosionParticles(p.x, p.y, p.type === 'repair' ? '#10b981' : '#00f0ff', 16);
        this.score += 200;
        this.powerups.splice(pIdx, 1);
        continue;
      }

      if (p.y > this.height + 30) {
        this.powerups.splice(pIdx, 1);
      }
    }

    // H. Particles & Shockwaves
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 1 / pt.life;
      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 1.8;
      sw.alpha -= 0.035;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    this.updateHUD();
  }

  handlePlayerDamage(amount) {
    if (this.player.invulnerableTimer > 0) return;

    if (this.player.isShieldActive && this.player.shield > 5) {
      this.sounds.playShieldHit();
      this.player.shield = Math.max(0, this.player.shield - amount * 0.8);
      this.createExplosionParticles(this.player.x, this.player.y - 10, '#00f0ff', 6);
      return;
    }

    this.sounds.playExplosion('small');
    this.player.health = Math.max(0, this.player.health - amount);
    this.player.invulnerableTimer = 40; // ~0.66s i-frames
    this.multiplier = 1.0; // Reset combo multiplier on direct hull hit

    if (this.player.health <= 0) {
      this.triggerGameOver();
    }
  }

  updateHUD() {
    this.hudScore.innerText = this.pad(this.score, 6);
    this.hudMultiplier.innerText = `${this.multiplier.toFixed(1)}x`;

    const hpPercent = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
    this.hudHealthBar.style.width = `${hpPercent}%`;

    const shieldPercent = Math.max(0, (this.player.shield / this.player.maxShield) * 100);
    this.hudShieldBar.style.width = `${shieldPercent}%`;
  }

  pad(num, size) {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }

  // --------------------------------------------------------------------
  // 6. RENDER ENGINE (60 FPS Canvas Graphics)
  // --------------------------------------------------------------------
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Deep space gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(1, '#070b18');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Parallax Starfield
    for (let star of this.stars) {
      star.y += star.speed;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Render Asteroids
    for (let a of this.asteroids) {
      this.ctx.save();
      this.ctx.translate(a.x, a.y);
      this.ctx.rotate(a.rotation);

      this.ctx.beginPath();
      this.ctx.moveTo(a.points[0].x, a.points[0].y);
      for (let i = 1; i < a.points.length; i++) {
        this.ctx.lineTo(a.points[i].x, a.points[i].y);
      }
      this.ctx.closePath();

      this.ctx.fillStyle = '#1c2237';
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffd60a';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      this.ctx.restore();
    }

    // Render Enemies
    for (let enemy of this.enemies) {
      this.ctx.save();
      this.ctx.translate(enemy.x, enemy.y);

      // Enemy hull (downward red arrowhead)
      this.ctx.beginPath();
      this.ctx.moveTo(0, 18);
      this.ctx.lineTo(-15, -12);
      this.ctx.lineTo(0, -6);
      this.ctx.lineTo(15, -12);
      this.ctx.closePath();

      this.ctx.fillStyle = '#ff0055';
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Cockpit glow
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // Render Powerups
    for (let p of this.powerups) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);

      let color = '#00f0ff';
      let icon = '⚡';
      if (p.type === 'repair') { color = '#10b981'; icon = '+'; }
      else if (p.type === 'shield') { color = '#9d4edd'; icon = '🛡'; }

      const glow = Math.sin(p.pulse) * 4 + 10;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      this.ctx.fill();
      this.ctx.strokeStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = glow;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = color;
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(icon, 0, 1);

      this.ctx.restore();
    }

    // Render Enemy Lasers
    this.ctx.fillStyle = '#ff0055';
    this.ctx.shadowColor = '#ff0055';
    this.ctx.shadowBlur = 8;
    for (let l of this.enemyLasers) {
      this.ctx.fillRect(l.x - 2, l.y, 4, 12);
    }
    this.ctx.shadowBlur = 0;

    // Render Player Lasers
    for (let l of this.playerLasers) {
      this.ctx.fillStyle = l.color;
      this.ctx.shadowColor = l.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(l.x - 2, l.y, 4, 16);
    }
    this.ctx.shadowBlur = 0;

    // Render Particles
    for (let pt of this.particles) {
      this.ctx.fillStyle = pt.color;
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }
    this.ctx.globalAlpha = 1.0;

    // Render Shockwaves
    for (let sw of this.shockwaves) {
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = sw.color;
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = Math.max(0, sw.alpha);
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1.0;

    // Render Player Ship
    if (this.player && this.state !== 'GAMEOVER') {
      const isBlinking = this.player.invulnerableTimer > 0 && Math.floor(this.player.invulnerableTimer / 4) % 2 === 0;
      if (!isBlinking) {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.tilt);

        // Shield Bubble
        if (this.player.isShieldActive) {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 32, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
          this.ctx.fill();
          this.ctx.strokeStyle = '#00f0ff';
          this.ctx.lineWidth = 2;
          this.ctx.shadowColor = '#00f0ff';
          this.ctx.shadowBlur = 15;
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }

        // Ship Wings & Body
        this.ctx.beginPath();
        this.ctx.moveTo(0, -22); // Nose
        this.ctx.lineTo(16, 18);  // Right wing
        this.ctx.lineTo(8, 12);   // Right inner thruster
        this.ctx.lineTo(-8, 12);  // Left inner thruster
        this.ctx.lineTo(-16, 18); // Left wing
        this.ctx.closePath();

        this.ctx.fillStyle = '#0f172a';
        this.ctx.fill();

        this.ctx.strokeStyle = this.player.overdriveTimer > 0 ? '#ff0055' : '#00f0ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Cockpit canopy
        this.ctx.beginPath();
        this.ctx.ellipse(0, -4, 4, 8, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();

        this.ctx.restore();
      }
    }
  }

  loop(currentTime) {
    const delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(delta);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// --------------------------------------------------------------------
// 7. INITIALIZE ENGINE ON DOM READY
// --------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new NeonVoidGame();
});

