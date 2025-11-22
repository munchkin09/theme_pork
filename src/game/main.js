import Phaser from 'phaser';
import { MainScene } from './scenes/Main.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../globals.js';


// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE,
    parent: 'phaser-game',
    backgroundColor: '#2d2d2d',
    scene: [MainScene]
};

const StartGame = (parent) => {
    const gameConfig = { ...config, parent };
    return new Phaser.Game(gameConfig);
}

export { StartGame };

