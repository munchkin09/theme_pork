import { Item } from '../Item.js';

class AutoMaintenance extends Item {
    constructor(scene) {
        super('auto_maintenance', 'Mantenimiento Automático', 350, 'Reduce a la mitad la probabilidad de avería en atracciones.', () => {
            scene.breakChance *= 0.5;
        }, false); // Instantáneo
    }
}

export { AutoMaintenance };