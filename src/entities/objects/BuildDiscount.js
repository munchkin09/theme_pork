import { Item } from '../Item.js';

class BuildDiscount extends Item {
    constructor(scene) {
        super('build_discount', 'Descuento en Construcción', 400, 'Reduce el costo de construcción de todos los edificios en 10%.', () => {
            scene.buildDiscount *= 0.9;
            scene.updateBuildMenu();
        }, false); // Instantáneo
    }
}

export { BuildDiscount };