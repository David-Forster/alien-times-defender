# Distribution Guide

This guide explains how to bundle and distribute the Multiplication Trainer game for others to run on their computers.

## Option 1: Static Web Build (Recommended for Quick Sharing)

The game is built as a static web application that runs in any modern browser.

### Building for Distribution

1. Ensure dependencies are installed:
   ```bash
   pnpm install
   ```

2. Build and package the game:
   ```bash
   pnpm bundle
   ```

   This will create `multiplication-trainer.zip` containing all necessary files.

   Alternatively, build manually:
   ```bash
   pnpm build
   ```
   The `dist/` folder will contain all necessary files.

### Sharing the Game

1. Zip the `dist/` folder (e.g., `multiplication-trainer.zip`).

2. Share the zip file with others.

### Running the Game

1. Unzip the folder.

2. Open `index.html` in a web browser (Chrome, Firefox, Safari, etc.).

3. The game runs offline and saves progress locally.

## Option 2: Desktop App with Tauri (For Native Experience)

For a more native desktop application experience.

### Prerequisites

1. Install Node.js dependencies:
   ```bash
   pnpm install
   ```

2. Install Rust (if not already installed): Follow instructions at https://rustup.rs/

3. Install Tauri CLI:
   ```bash
   cargo install tauri-cli
   ```

### Building for Distribution

1. Build the Tauri app:
   ```bash
   tauri build
   ```

2. Installers will be created in `src-tauri/target/release/bundle/` folder.

### Development Testing

To test the Tauri app during development:

```bash
tauri dev
```

### Sharing the Game

Share the appropriate installer file:
- macOS: `.dmg` file
- Windows: `.msi` or `.exe` installer
- Linux: `.AppImage` file

### Running the Game

Run the installer and launch the app like any other desktop application.

## Notes

- The static web build is the simplest and most portable option.
- Tauri provides a native app feel but increases file size.
- Both options preserve local storage for game progress.
- The game requires no internet connection once loaded.