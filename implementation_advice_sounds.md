## Best Practices for Implementing Sounds and Background Music in Phaser 3

### 1. Loading Audio Assets in the Preload Method
In Phaser 3, audio assets are loaded during the `preload` phase of a scene. Use the `this.load.audio` method to load sound files. Support multiple formats for browser compatibility (e.g., MP3, OGG, WAV). Place this in the `preload` method of your main game scene or a dedicated audio manager scene.

**Step-by-step:**
- Identify required audio files (e.g., background music, sound effects).
- Load them with keys for easy reference.
- Ensure files are in the `public/assets/` directory or equivalent.

**Code Snippet (in a scene's preload method):**
```typescript
preload() {
  // Load background music
  this.load.audio('bgMusic', ['assets/bg_music.mp3', 'assets/bg_music.ogg']);
  
  // Load sound effects
  this.load.audio('puzzleSolve', 'assets/puzzle_solve.wav');
  this.load.audio('explosion', 'assets/explosion.wav');
  this.load.audio('timerWarning', 'assets/timer_warning.wav');
}
```

### 2. Creating and Managing Sound Objects in Scenes
Create sound objects in the `create` method using `this.sound.add`. Store references in the scene or a global manager for reuse. Use a sound manager class to centralize audio logic, avoiding duplication across scenes.

**Step-by-step:**
- Add sounds after loading.
- Configure properties like volume, loop for music.
- Use a manager to handle global state (e.g., mute).

**Pseudocode Example:**
```typescript
create() {
  // Create sound objects
  this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
  this.puzzleSound = this.sound.add('puzzleSolve', { volume: 0.8 });
  
  // Start background music
  this.bgMusic.play();
}
```

### 3. Triggering Sounds on Specific Game Events
Bind sound playback to events using Phaser's event system or direct calls in game logic. For example, emit events from managers (e.g., PuzzleManager) and listen in the scene.

**Step-by-step:**
- Define events in managers (e.g., 'puzzleSolved', 'explosion').
- In the scene, listen and play sounds.
- Use conditional logic for adaptive feedback (e.g., different sounds based on difficulty).

**Code Snippet:**
```typescript
// In PuzzleManager or game logic
this.events.emit('puzzleSolved');

// In PlayScene
this.events.on('puzzleSolved', () => {
  this.puzzleSound.play();
});

// For adaptive feedback
if (difficulty === 'hard') {
  this.sound.add('hardSolve').play();
}
```

### 4. Handling Audio Context Activation for Web Browsers
Web browsers require user interaction to activate audio context (due to autoplay policies). Add a user gesture (e.g., click) to unlock audio before gameplay.

**Step-by-step:**
- Check if audio is unlocked.
- Add an unlock method on first interaction.
- Resume audio context if needed.

**Code Snippet:**
```typescript
create() {
  // Unlock audio on user interaction
  this.input.on('pointerdown', () => {
    if (!this.sound.locked) return;
    this.sound.unlock();
  });
}
```

### 5. Implementing User Controls for Mute/Unmute
Add UI elements (e.g., buttons) to toggle mute. Use Phaser's sound manager to set global mute state. Persist settings using localStorage.

**Step-by-step:**
- Create a mute button in the UI manager.
- Toggle `this.sound.mute` on click.
- Save/load state.

**Pseudocode Example:**
```typescript
// In UIManager
createMuteButton() {
  const button = this.add.text(10, 10, 'Mute', { fontSize: '20px' });
  button.setInteractive();
  button.on('pointerdown', () => {
    this.sound.mute = !this.sound.mute;
    button.setText(this.sound.mute ? 'Unmute' : 'Mute');
    localStorage.setItem('audioMuted', this.sound.mute);
  });
  
  // Load initial state
  this.sound.mute = localStorage.getItem('audioMuted') === 'true';
}
```

### 6. Optimizing Audio Files for Web Performance
Use compressed formats like MP3/OGG for smaller file sizes. Keep files short (<1MB) and loop seamlessly. Use tools like Audacity for compression.

**Step-by-step:**
- Convert to MP3 (128kbps) and OGG.
- Trim silence and normalize volume.
- Test load times in preload.

**Tips:**
- MP3 for broad support, OGG for open-source.
- Avoid uncompressed WAV for web.

### 7. Integrating Audio with the Game's Structure
Tie audio to game mechanics via managers (e.g., adaptive difficulty in GameMechanics). Use events for decoupling. Ensure audio enhances UX without overwhelming.

**Step-by-step:**
- In managers, emit audio-related events.
- Adjust volume/choice based on player state (e.g., from player.ts).
- Test integration in scenes like PlayScene.

**Example Integration:**
- In GameMechanics, on difficulty increase, play a warning sound.
- Use player mastery (from mastery.ts) to vary feedback audio.

### 8. Avoiding Common Pitfalls
- **Mobile Playback:** Audio may not play without user gesture; always unlock on interaction.
- **Overlapping Sounds:** Use `sound.stop()` or limit concurrent plays. Implement a sound pool.
- **Browser Inconsistencies:** Test across Chrome, Firefox, Safari. Use multiple formats.
- **Performance:** Limit simultaneous sounds (max 5-10). Monitor for memory leaks.
- **Autoplay Policies:** Never auto-play without interaction.

**Pseudocode for Avoiding Overlap:**
```typescript
playSound(key) {
  if (this.currentSound) this.currentSound.stop();
  this.currentSound = this.sound.add(key);
  this.currentSound.play();
}
```

This advice ensures robust, performant audio in Phaser 3, enhancing math-master's engagement while avoiding issues.