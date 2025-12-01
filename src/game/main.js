import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader.js';
import { MainScene } from './scenes/Main.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../globals.js';


// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: "50%",
    height: "100%",
    parent: 'phaser-game',
    backgroundColor: '#2d2d2d',
    scene: [Preloader, MainScene]
};

const StartGame = (parent) => {
    const gameConfig = { ...config, parent };
    const game = new Phaser.Game(gameConfig);
    // Start with Preloader scene
    game.scene.start('^Preloader');
    return game;
}

export { StartGame };

