import { Item } from '../Item.js';

class IncomeBoost extends Item {
    constructor(scene) {
        super('income_boost', 'Aumento de Ingresos', 300, 'Aumenta el ingreso base de todas las tiendas en 1 por tick.', () => {
            scene.shopIncomeBonus += 1;
        }, true); // Continuous
    }
}

export { IncomeBoost };