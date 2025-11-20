import Phaser from 'phaser';
import { UIManager } from './UIManager';
import { GT_X, GT_Y, MISSILE_SPEED, EXPLOSION_INSTANT_DURATION, EXPLOSION_INSTANT_PARTICLES, EXPLOSION_INSTANT_COLOR, EXPLOSION_VERY_FAST_DURATION, EXPLOSION_VERY_FAST_PARTICLES, EXPLOSION_VERY_FAST_COLOR, EXPLOSION_FAST_DURATION, EXPLOSION_FAST_PARTICLES, EXPLOSION_FAST_COLOR, EXPLOSION_MEDIUM_DURATION, EXPLOSION_MEDIUM_PARTICLES, EXPLOSION_MEDIUM_COLOR, EXPLOSION_SLOW_DURATION, EXPLOSION_SLOW_PARTICLES, EXPLOSION_SLOW_COLOR, OVERHEAT_DURATION, OVERHEAT_PARTICLES, OVERHEAT_COLOR, COLLISION_DURATION, COLLISION_PARTICLES, COLLISION_COLOR, LIVES_COUNT } from '../constants';

export class GameMechanics {
  scene: Phaser.Scene;
  uiManager: UIManager;
  missiles!: Phaser.Physics.Arcade.Group;
  lives: number;
  lastTimeTaken: number;
  onGameOver?: (deltas: number[], presented: any[], times: number[], correctness: boolean[]) => void;

  constructor(scene: Phaser.Scene, uiManager: UIManager, onGameOver?: (deltas: number[], presented: any[], times: number[], correctness: boolean[]) => void) {
    this.scene = scene;
    this.uiManager = uiManager;
    this.lives = LIVES_COUNT;
    this.onGameOver = onGameOver;
  }

  createMissiles() {
    this.missiles = this.scene.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 10
    });
  }

  fireMissile(puzzleShip: Phaser.GameObjects.Container, timeTaken: number) {
    this.lastTimeTaken = timeTaken;
    const missile = this.missiles.get(GT_X, GT_Y);
    if (missile) {
      missile.setActive(true);
      missile.setVisible(true);
      const angle = Phaser.Math.Angle.Between(GT_X, GT_Y, puzzleShip.x, puzzleShip.y);
      missile.body.velocity.x = Math.cos(angle) * MISSILE_SPEED;
      missile.body.velocity.y = Math.sin(angle) * MISSILE_SPEED;
    }
  }

  destroyPuzzleShip(puzzleShip: Phaser.GameObjects.Container, timeTaken: number) {
    if (timeTaken > 10) {
      // Hits wing/edge; PS spins off-screen out of control
      this.scene.physics.world.disable(puzzleShip);
      this.scene.tweens.add({
        targets: puzzleShip,
        rotation: Phaser.Math.DegToRad(360 * 5), // spin 5 full rotations
        x: -100, // move off-screen left
        y: -100, // move off-screen top
        alpha: 0, // fade out
        duration: 2000,
        ease: 'Linear',
        onComplete: () => puzzleShip.destroy()
      });
    } else {
      this.createExplosion(puzzleShip.x, puzzleShip.y, timeTaken);
      puzzleShip.destroy();
    }
  }

  setupCollision(puzzleShip: Phaser.GameObjects.Container, delta: number) {
    const onMissileHit = (p, m) => this.onMissileHit(p, m, delta);
    this.scene.physics.add.overlap(this.missiles, puzzleShip, onMissileHit, null, this);
  }

  onMissileHit(puzzleShip: any, missile: any, delta: number) {
    console.log('misile', missile);
    console.log('puzzleShip', puzzleShip);
    console.log('delta', delta);
    missile.destroy();
    this.destroyPuzzleShip(puzzleShip as Phaser.GameObjects.Container, this.lastTimeTaken);
    this.uiManager.showDeltaText(delta, this.uiManager.puzzleShip.x + 130, this.uiManager.puzzleShip.y);
  }

  explodeGunTurret() {
    this.createExplosion(GT_X, GT_Y, -1);
    this.uiManager.gunTurret.setVisible(false);
  }

  createExplosion(x: number, y: number, timeTaken: number) {
    let duration: number, particles: number, color: number;
    if (timeTaken === -2) { // collision
      duration = COLLISION_DURATION;
      particles = COLLISION_PARTICLES;
      color = COLLISION_COLOR;
    } else if (timeTaken === -1) { // overheat
      duration = OVERHEAT_DURATION;
      particles = OVERHEAT_PARTICLES;
      color = OVERHEAT_COLOR;
    } else if (timeTaken <= 2) {
      duration = EXPLOSION_INSTANT_DURATION;
      particles = EXPLOSION_INSTANT_PARTICLES;
      color = EXPLOSION_INSTANT_COLOR;
    } else if (timeTaken <= 3) {
      duration = EXPLOSION_VERY_FAST_DURATION;
      particles = EXPLOSION_VERY_FAST_PARTICLES;
      color = EXPLOSION_VERY_FAST_COLOR;
    } else if (timeTaken <= 5) {
      duration = EXPLOSION_FAST_DURATION;
      particles = EXPLOSION_FAST_PARTICLES;
      color = EXPLOSION_FAST_COLOR;
    } else if (timeTaken <= 10) {
      duration = EXPLOSION_MEDIUM_DURATION;
      particles = EXPLOSION_MEDIUM_PARTICLES;
      color = EXPLOSION_MEDIUM_COLOR;
    } else {
      duration = EXPLOSION_SLOW_DURATION;
      particles = EXPLOSION_SLOW_PARTICLES;
      color = EXPLOSION_SLOW_COLOR;
    }

    const explosion = this.scene.add.sprite(x, y, 'explosion').play('explode');
    explosion.setScale(2);
    explosion.setTint(color);
    this.scene.time.delayedCall(duration, () => explosion.destroy());
  }

  loseLife(puzzleManager: any, uiManager: any) {
    this.lives--;
    if (this.lives >= 0) {
      uiManager.destroyLifeIcon(this.lives);
    }
    // Game over handling is done in InputHandler.nextPuzzle after animations complete
  }

  clearMissiles() {
    this.missiles.clear(true, true);
  }
}