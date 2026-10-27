# NEON HORIZON // VOID PROTOCOL
### Official Game Showcase & Playable Web Tech Demo

A futuristic, high-octane sci-fi game showcase website featuring a **fully functional, interactive 60 FPS HTML5 Canvas arcade shooter** with procedural Web Audio sound synthesis, particle physics, and adaptive difficulty.

Zero build steps, zero external npm dependencies. Built with pure HTML5, CSS3, and modern JavaScript.

---

## 🚀 Quick Start: How to Open & Play

### Option 1: One-Line Terminal Command (macOS)
```bash
open /Users/himanshu/.gemini/antigravity/scratch/game-showcase/index.html
```
*(Or specify Chrome: `open -a "Google Chrome" /Users/himanshu/.gemini/antigravity/scratch/game-showcase/index.html`)*

### Option 2: Directly in Google Chrome
1. Open **Google Chrome**.
2. Press `Cmd + O` (or paste the file URL below into your address bar):
   ```text
   file:///Users/himanshu/.gemini/antigravity/scratch/game-showcase/index.html
   ```

### Option 3: Local Development Server (Optional)
```bash
cd /Users/himanshu/.gemini/antigravity/scratch/game-showcase && python3 -m http.server 8080
```
Then visit `http://localhost:8080` in your web browser.

---

## 🎮 Game Controls & Tactics

| Action | Keyboard Binding | Mobile / Mouse Action |
| :--- | :--- | :--- |
| **Move Ship** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> | On-screen **LEFT** / **RIGHT** buttons |
| **Twin Blasters** | <kbd>SPACEBAR</kbd> (Hold for rapid fire) | On-screen **FIRE BLASTER** button |
| **Energy Shield** | <kbd>SHIFT</kbd> (Absorbs damage, drains energy) | On-screen **SHIELD** button |
| **Pause / Resume**| <kbd>P</kbd> or <kbd>ESC</kbd> | Top cockpit **PAUSE** button |
| **Sound FX Mute** | <kbd>M</kbd> | Top cockpit **AUDIO** button |

### Power-Up Drops
* ⚡ **Overdrive Core (Cyan):** Activates 3-way spread cannons with accelerated fire rate for 6 seconds.
* ➕ **Nanite Repair (Green):** Instantly restores +35% Hull Integrity.
* 🛡 **Shield Booster (Purple):** Instantly recharges your defensive deflector shield to 100%.

---

## 📂 File Architecture

```
game-showcase/
├── index.html     # Cinematic hero section, cockpit HUD, canvas viewport, lore & controls
├── styles.css     # Sci-Fi theme tokens, neon glows, glassmorphism, responsive media queries
├── game.js        # 60 FPS Canvas engine, procedural Web Audio synth, particles & enemy AI
└── README.md      # Launch instructions & customization reference
```

---

## ✏️ How to Customize & Extend

### 1. Modifying the Game Story & Headlines
Open [`index.html`](file:///Users/himanshu/.gemini/antigravity/scratch/game-showcase/index.html):
* **Game Title & Tagline:** Search for `class="hero-headline"` (lines 66–69).
* **Story & Lore Cards:** Search for `id="lore"` (lines 200–260) to change the backstory, factions, or datafiles.
* **Flight Manual Key Bindings:** Modify table rows inside `id="controls"` (lines 310–360).

### 2. Customizing Colors & Visual Theme
Open [`styles.css`](file:///Users/himanshu/.gemini/antigravity/scratch/game-showcase/styles.css):
* Look for `:root` at the top (lines 7–27).
* Tweak `--neon-cyan`, `--neon-pink`, `--neon-purple`, or `--neon-gold` to customize the palette.

### 3. Tuning Gameplay Mechanics & Difficulty
Open [`game.js`](file:///Users/himanshu/.gemini/antigravity/scratch/game-showcase/game.js):
* **Player Attributes:** Inside `resetGame()` (lines 255–275):
  * `speed`: ship maneuver velocity (default: `6.2`).
  * `maxHealth`: player hit points (default: `100`).
* **Weapon Fire Rate:** Inside `update()` (lines 430–445):
  * Change `fireInterval` (default: `200ms` standard, `110ms` in Overdrive).
* **Enemy & Asteroid Spawns:** Look for `spawnAsteroid()` and `spawnEnemy()` (lines 345–385) to change enemy health or speeds.
* **Audio Synthesizer:** Look for `SoundSystem` (lines 14–150) to tweak oscillator frequencies, pitch decay, or wave shapes (`sawtooth`, `square`, `sine`).

