import { MAP_WIDTH, MAP_HEIGHT } from '../globals.js';
import { Attraction } from '../entities/Attraction.js';
import { Shop } from '../entities/Shop.js';
import { Restroom } from '../entities/Restroom.js';

class EconomyManager {

    level = 0;
    constructor(gridManager, level=0) {
        this.gridManager = gridManager;
        this.attractionBonusMultiplier = 1.0; // Multiplicador inicial
    }

    /**
     * Calcula el ingreso de una montaña rusa basado en su excitement y decay temporal
     * MR-1: Implementar cálculo de ingresos por Excitement
     * MR-2: Desarrollar mecanismo de Decaimiento Temporal
     */
    calculateAttractionIncome(attraction) {
        if (attraction.broken) {
            return 0; // Atracciones rotas no generan ingresos
        }

        // Ingreso base proporcional al excitement (1-10 scale -> $2-20 base income)
        const baseIncome = Math.floor(attraction.excitement * 2);

        // Calcular decay temporal - la atracción pierde atractivo con el tiempo
        const currentTime = Date.now();
        const constructionTime = attraction.constructionTime || currentTime;
        const ageInSeconds = Math.floor((currentTime - constructionTime) / 1000);
        
        // Decay factor: 100% nuevo, reduce 5% cada 30 segundos hasta un mínimo de 50%
        const decayIntervals = Math.floor(ageInSeconds / 30);
        const decayFactor = Math.max(0.5, 1.0 - (decayIntervals * 0.05));

        // Calcular ingreso final con decay aplicado
        const finalIncome = Math.floor(baseIncome * decayFactor);

        return {
            base: baseIncome,
            decayFactor: decayFactor,
            final: finalIncome,
            age: ageInSeconds
        };
    }

    calculateNeighborBonus(tx, ty) {
    let attractions = 0, shops = 0, restrooms = 0;

    // Direcciones: arriba, abajo, izquierda, derecha
    const directions = [
        { dx: 0, dy: -1 }, // arriba
        { dx: 0, dy: 1 },  // abajo
        { dx: -1, dy: 0 }, // izquierda
        { dx: 1, dy: 0 }   // derecha
    ];

    directions.forEach(dir => {
        const nx = tx + dir.dx;
        const ny = ty + dir.dy;

        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            const neighbor = this.gridManager.getEntityAt(nx, ny);
            if (neighbor instanceof Attraction) attractions++;
            else if (neighbor instanceof Shop) shops++;
            else if (neighbor instanceof Restroom) restrooms++;
        }
    });

    // Calcular bonus: atracciones dan más beneficio, con multiplicador
    const bonus = (attractions * 3 * this.attractionBonusMultiplier) + (shops * 2.0) + (restrooms * 1.0);
    return Math.floor(bonus); // Redondear hacia abajo para mantener enteros
    }
}

export { EconomyManager };
