import { Item } from '../Item.js';

class AttractionPremium extends Item {
    constructor(scene) {
        super('attraction_premium', 'Atracción Premium', 500, 'Aumenta el bonus de income de atracciones adyacentes en 50%.', () => {
            scene.attractionBonusMultiplier += 0.5;
        }, false); // Instantáneo
    }
}

export { AttractionPremium };