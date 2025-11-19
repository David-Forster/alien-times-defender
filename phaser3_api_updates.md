# Phaser 3 API Updates

This document summarizes the aspects of the Phaser 3 API that differ from earlier understandings, based on current documentation (Phaser 3.80). It focuses on concepts relevant to implementing visual game elements like sprites, tweens, particles, collisions, and effects. Only changed or new features are highlighted.

## Actions
No significant changes since early Phaser 3. The API for applying tween-like effects to groups of game objects remains stable and backward-compatible.

## Animations
Performance improvements in Phaser 3.70+ with better frame caching for sprite animations. No breaking changes; existing animation code continues to work.

## Events
Enhanced integration with FX and physics events in Phaser 3.60+. No major API changes; the pub/sub system is stable.

## FX
Introduced in Phaser 3.60 as a new post-processing effects system for advanced visuals (e.g., bloom, glow, shadows). Pre-3.60 versions lacked built-in FX; developers relied on custom shaders.

Key API methods:
- `Phaser.FX.Bloom(pipelineConfig)`: Adds bloom effect.
- `Phaser.FX.Glow(pipelineConfig)`: Adds glow effect.
- `Phaser.FX.Shadow(pipelineConfig)`: Adds shadow effect.
- `Phaser.FX.Gradient(pipelineConfig)`: Adds gradient overlay.
- `Phaser.FX.Pixelate(pipelineConfig)`: Pixelates the image.
- `Phaser.FX.Wipe(pipelineConfig)`: Wipe transition effect.
- `Phaser.FX.Barrel(pipelineConfig)`: Barrel distortion.
- `Phaser.FX.Displacement(pipelineConfig)`: Displacement mapping.
- `Phaser.FX.Circle(pipelineConfig)`: Circular mask.
- `Phaser.FX.Bokeh(pipelineConfig)`: Bokeh blur.

Applied via `gameObject.setFX(fxConfig)` or scene pipelines.

Example: Adding bloom to a sprite for explosion effects.
```javascript
sprite.setFX({
  bloom: {
    strength: 0.5,
    steps: 4
  }
});
```

## Arcade Physics
Minor performance optimizations in Phaser 3.70+. The API for 2D physics (collisions, movement) is stable with no breaking changes.