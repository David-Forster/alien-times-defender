## Cleaned-Up Requirements for PlayScene UX Improvements

### Overview
Transform the math puzzle game in `src/scenes/PlayScene.ts` into a more engaging experience inspired by Galaga or Space Invaders. The core gameplay machanics (puzzle presentation, timing, scoring, and state saving) remains unchanged. Focus on visual and interactive enhancements to gamify the experience.

### Key Game Elements
- **Puzzle Ship (PS)**: Represents the current math puzzle. It hovers above the play area and moves erratically like a Galaga ship (e.g., side-to-side or figure-eight patterns). It does not fire torpedoes. 

the "maths puzzle" should be overlayed on top of the PS and fixed relative to the PS - ie anchored to PS

consider: src/assets/bsquadron-enemies.png / assets_usage.md

- **Gun Turret (GT)**: Fixed at the center bottom of the play area. Acts as the player's weapon.

as player enters puzzle answer the large digits entered should appear above the GT. hitting enter will fire the GT weapon.

consider: src/assets/ship.png / ship_usage.md

- **Progress Indicator**: the count of puzzles solved this session is displayed top right of screen next to the game length - e.g 12 / 20 - where player is solving the 12th puzzle and game length is 20.

- **Lives System**: Display 3 lives as small GT icons in the bottom-right corner. Each GT destruction removes one life. Update lives displayed bottom right accordingly. Losing the last life terminates the session early (before completing all `GAME_LENGTH` puzzles).

- **Missiles**: Fired by GT on correct answers. Travel quickly to the PS for destruction.

consider: bullet7.png

- **Explosions**: Animated using Phaser 3 effects (e.g., particles, scaling, color transitions). Vary based on answer speed/accuracy.

consider: explosion.png / explosion_usage.md

### Gameplay Mechanics
- **Correct Answer**:
  - GT fires a missile that destroys the PS instantly.
  - Explosion animation varies by response time:
    - Instant answer (≤2s): Direct hit with maximum flashy explosion (e.g., largest particle burst, brightest colors).
    - Very fast answer (2-3s): Direct hit with very flashy explosion (e.g., large particle burst, bright colors).
    - Fast answer (3-5s): Direct hit with flashy explosion (e.g., medium particle burst, vibrant colors).
    - Medium answer (5-10s): Slightly less direct hit with moderately flashy animation (e.g., smaller burst, subdued colors).
    - Slow answer (>10s): Hits wing/edge; PS spins off-screen out of control (e.g., rotation tween, fade-out).
- **Incorrect Answer**:
  - GT overheats and explodes (e.g., red glow, particle effects, screen shake).

- **Timeout (Default Incorrect)**:
  - PS swoops in and collides with GT, destroying it (e.g., collision detection, shared explosion animation). PS should move closer and closer to the GT as the timeTaken closes in on timeout. 

NOTE: Keep the existing deltaText "tween" behaviour but positioned in proximity to the current location of the PS. This gives a visual clue to the player points gained or lost based on result

### Implementation Notes
- Preserve existing logic for correct/incorrect scoring, rating deltas, and saving state (e.g., `competencyTable`, `answerHistory`).
- Some assets already exist under src/asserts folder. review markdown files on usage for hints as to how to exploit the assets.
- Use Phaser 3 features for animations (e.g., `Tweens`, `Particles`, `Physics` for collisions).
- Integrate visuals without disrupting text-based UI (puzzle, input, timer, feedback).
- Handle session termination on last life loss: Transition to `SummaryScene` with partial results. 

- **Animation Timings and Effects**: Ensure exact durations, easing, or particle configurations are capture in constants (e.g., extend `src/constants.ts`) for explosion durations, missile speed, swoop paths.
