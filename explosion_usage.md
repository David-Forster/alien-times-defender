# Using Explosion Spritesheet in Phaser

The `src/assets/explosion.png` is a spritesheet containing 24 frames (0-23) of an explosion animation, each frame being 64x64 pixels.

## Preloading the Spritesheet

In the `preload()` method of your Phaser scene:

```typescript
this.load.spritesheet('explosion', 'src/assets/explosion.png', {
  frameWidth: 64,
  frameHeight: 64,
  endFrame: 23
});
```

## Creating the Animation

In the `create()` method:

```typescript
const config = {
  key: 'explodeAnimation',
  frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 23, first: 23 }),
  frameRate: 20,
  repeat: -1
};

this.anims.create(config);
```

## Playing the Animation

To display and animate the explosion at a specific position (e.g., x: 400, y: 300):

```typescript
this.add.sprite(400, 300, 'explosion').play('explodeAnimation');
```

This creates a looping explosion animation that can be integrated into game events like collisions or destructions.