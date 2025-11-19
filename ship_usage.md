# Using Ship Spritesheet in Phaser

The `src/assets/ship.png` is a spritesheet for a spaceship with animation frames.

## Preloading the Spritesheet

In the `preload()` method of your Phaser scene:

```typescript
this.load.spritesheet('ship', 'src/assets/ship.png', {
  frameWidth: 16,
  frameHeight: 24
});
```

## Creating the Animation

In the `create()` method:

```typescript
this.anims.create({
  key: 'thrust',
  frames: this.anims.generateFrameNumbers('ship', { frames: [2, 7] }),
  frameRate: 20,
  repeat: -1
});
```

## Adding and Animating the Ship

To display an animated ship sprite at a specific position (e.g., x: 400, y: 300):

```typescript
const ship = this.add.sprite(400, 300, 'ship');
ship.play('thrust');
```

This creates a looping thrust animation for the ship sprite.