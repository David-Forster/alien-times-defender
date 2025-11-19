# Phaser Assets Usage Summary

This document summarizes how to load and use some of the assets in `src/assets` based on the provided Phaser example code. Most assets are static images, with one spritesheet for the enemy. The example demonstrates bullet pooling, particle effects, and background scrolling.

## Assets Overview

- `bullet7.png`: Player bullet image (16x16, used in physics group).
- `bullet6.png`: Enemy bullet image (16x16, used in physics group).
- `bsquadron1.png`: Player ship image (used as physics image).
- `starfield.png`: Background starfield image (used with blitter for scrolling).
- `bsquadron-enemies.png`: Enemy spritesheet (192x160 per frame, 4 frames).

## Loading Assets

In `preload()`:

```typescript
this.load.image('bullet', 'src/assets/bullet7.png');
this.load.image('enemyBullet', 'src/assets/bullet6.png');
this.load.image('ship', 'src/assets/bsquadron1.png');
this.load.image('starfield', 'src/assets/starfield.png');
this.load.spritesheet('enemy', 'src/assets/bsquadron-enemies.png', {
  frameWidth: 192,
  frameHeight: 160
});
```

## Using Assets

### Bullets (Pooling with Physics Group)

Create a custom group class for bullets (as shown in the example). In `create()`:

```typescript
this.bullets = this.add.existing(
  new Bullets(this.physics.world, this, { name: 'bullets' })
);
this.bullets.createMultiple({
  key: 'bullet',
  quantity: 5
});
```

Fire a bullet:

```typescript
this.bullets.fire(x, y, vx, vy);
```

### Enemy (Spritesheet)

Add enemy sprite:

```typescript
this.enemy = this.physics.add.sprite(256, 128, 'enemy', 1);
```

Change frame (e.g., on destruction):

```typescript
this.enemy.setFrame(3);
```

### Player Ship

```typescript
this.player = this.physics.add.image(256, 448, 'ship');
```

### Starfield Background (Scrolling)

```typescript
this.stars = this.add.blitter(0, 0, 'starfield');
this.stars.create(0, 0);
this.stars.create(0, -512);
```

In `update()`:

```typescript
this.stars.y += 1;
this.stars.y %= 512;
```

### Particle Effects (Plasma)

```typescript
this.plasma = this.add.particles(0, 0, 'bullet', {
  alpha: { start: 1, end: 0, ease: 'Cubic.easeIn' },
  blendMode: Phaser.BlendModes.SCREEN,
  frequency: -1,
  lifespan: 500,
  radial: false,
  scale: { start: 1, end: 5, ease: 'Cubic.easeOut' }
});
```

Emit particles:

```typescript
this.plasma.emitParticleAt(x, y);
```

## Notes on Phaser API (v3.85)

- **Groups**: Use `this.add.existing(new CustomGroup(...))` to add custom physics groups. `createMultiple` pre-creates inactive instances.
- **Particles**: `emitParticleAt(x, y)` emits a single particle; `frequency: -1` disables auto-emission.
- **Blitter**: Efficient for static backgrounds; manually update position for scrolling.
- **Physics Overlap**: Use `this.physics.add.overlap` for collision detection without bouncing.
- **Spritesheets**: Load with `load.spritesheet`; access frames via `setFrame(index)`.
- **World Bounds**: Bodies can have `onWorldBounds` callbacks for edge detection.

This covers the core usage; adapt for your scene's needs.