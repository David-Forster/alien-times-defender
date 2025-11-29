export function getRandomStarfieldPath(): string {
  const paths = [
    'assets/starfields/Blue Nebula 1 - 1024x1024.png',
    'assets/starfields/Blue Nebula 2 - 1024x1024.png',
    'assets/starfields/Blue Nebula 3 - 1024x1024.png',
    'assets/starfields/Blue Nebula 4 - 1024x1024.png',
    'assets/starfields/Blue Nebula 5 - 1024x1024.png',
    'assets/starfields/Blue Nebula 6 - 1024x1024.png',
    'assets/starfields/Blue Nebula 7 - 1024x1024.png',
    'assets/starfields/Blue Nebula 8 - 1024x1024.png',
    'assets/starfields/Green Nebula 1 - 1024x1024.png',
    'assets/starfields/Green Nebula 2 - 1024x1024.png',
    'assets/starfields/Green Nebula 3 - 1024x1024.png',
    'assets/starfields/Green Nebula 4 - 1024x1024.png',
    'assets/starfields/Green Nebula 5 - 1024x1024.png',
    'assets/starfields/Green Nebula 6 - 1024x1024.png',
    'assets/starfields/Green Nebula 7 - 1024x1024.png',
    'assets/starfields/Green Nebula 8 - 1024x1024.png',
    'assets/starfields/Purple Nebula 1 - 1024x1024.png',
    'assets/starfields/Purple Nebula 2 - 1024x1024.png',
    'assets/starfields/Purple Nebula 3 - 1024x1024.png',
    'assets/starfields/Purple Nebula 4 - 1024x1024.png',
    'assets/starfields/Purple Nebula 5 - 1024x1024.png',
    'assets/starfields/Purple Nebula 6 - 1024x1024.png',
    'assets/starfields/Purple Nebula 7 - 1024x1024.png',
    'assets/starfields/Purple Nebula 8 - 1024x1024.png',
    'assets/starfields/Starfield 1 - 1024x1024.png',
    'assets/starfields/Starfield 2 - 1024x1024.png',
    'assets/starfields/Starfield 3 - 1024x1024.png',
    'assets/starfields/Starfield 4 - 1024x1024.png',
    'assets/starfields/Starfield 5 - 1024x1024.png',
    'assets/starfields/Starfield 7 - 1024x1024.png',
    'assets/starfields/Starfield 8 - 1024x1024.png'
  ];
  const randomIndex = Math.floor(Math.random() * paths.length);
  return paths[randomIndex];
}