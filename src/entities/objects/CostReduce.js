import { Item } from '../Item.js';

class CostReduce extends Item {
    constructor(scene) {
        super('cost_reduce', 'Reducción de Costos', 1000, 'Reduce los costos de construcción en un 10%.', () => {
            scene.buildDiscount *= 0.9;
            scene.updateBuildMenu();
        }, false); // Instantáneo
    }
}

export { CostReduce };