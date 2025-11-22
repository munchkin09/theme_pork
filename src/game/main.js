import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader.js';
import { MainScene } from './scenes/Main.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../globals.js';


// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE,
    parent: 'phaser-game',
    backgroundColor: '#2d2d2d',
    scene: [Preloader, MainScene]
};

const StartGame = (parent) => {
    const gameConfig = { ...config, parent };
    const game = new Phaser.Game(gameConfig);
    // Start with MainScene scene
    game.scene.start('^Preloader');
    return game;
}

export { StartGame };

