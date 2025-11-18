import { Item } from '../Item.js';

class UnlockTile extends Item {
    constructor(scene) {
        super('unlock_tile', 'Desbloquear Terreno', 250, 'Desbloquea una tile bloqueada aleatoria en el mapa.', () => {
            scene.unlockRandomTile();
        }, false); // Instantáneo
    }
}

export { UnlockTile };