import { MAP_WIDTH, MAP_HEIGHT } from '../globals.js';
import { Attraction } from '../entities/Attraction.js';
import { Shop } from '../entities/Shop.js';
import { Restroom } from '../entities/Restroom.js';
import { ObjectRegistry } from './ObjectRegistry.js';

class EconomyManager {

    level = 0;
    constructor(gridManager, level=0) {
        this.gridManager = gridManager;
        this.attractionBonusMultiplier = 1.0; // Multiplicador inicial
        
        // GE-2: Inicializar ObjectRegistry para modificadores económicos
        this.objectRegistry = new ObjectRegistry();
        this.tickCounter = 0;
        
        // MR-3: Definir tipos de casillas construidas para bonus por diversidad
        this.constructedTileTypes = {
            SHOP: 'shop',
            RESTROOM: 'restroom',
            ATTRACTION: 'attraction',
            PATH: 'path',           // Para futuras implementaciones
            DECORATION: 'decoration' // Para futuras implementaciones
        };
    }

    /**
     * Calcula el ingreso de una montaña rusa basado en su excitement y decay temporal
     * MR-1: Implementar cálculo de ingresos por Excitement
     * MR-2: Desarrollar mecanismo de Decaimiento Temporal
     * MR-5: Aplicar Bonus por Diversidad de Casillas
     */
    calculateAttractionIncome(attraction) {
        if (attraction.broken) {
            return { base: 0, decayFactor: 0, diversityBonus: 0, final: 0, age: 0 }; // Atracciones rotas no generan ingresos
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

        // MR-5: Aplicar bonus por diversidad de entorno
        const diversityBonus = this.calculateDiversityBonus(attraction.tileX, attraction.tileY, attraction.width, attraction.height);

        // Calcular ingreso final con decay y bonus de diversidad aplicados
        const incomeWithDecay = Math.floor(baseIncome * decayFactor);
        const finalIncome = incomeWithDecay + diversityBonus;

        return {
            base: baseIncome,
            decayFactor: decayFactor,
            diversityBonus: diversityBonus,
            final: finalIncome,
            age: ageInSeconds
        };
    }

    /**
     * AS-1: Implementar chequeo de proximidad: Tiendas
     * Determina si un aseo se encuentra dentro de un radio definido de cualquier tienda
     */
    isRestroomNearShop(restroomX, restroomY, radius = 3) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const entity = this.gridManager.getEntityAt(x, y);
                if (entity instanceof Shop) {
                    const distance = Math.sqrt(Math.pow(x - restroomX, 2) + Math.pow(y - restroomY, 2));
                    if (distance <= radius) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * AS-2: Implementar chequeo de proximidad: Montañas Rusas
     * Determina si un aseo se encuentra dentro de un radio definido de cualquier montaña rusa
     */
    isRestroomNearAttraction(restroomX, restroomY, radius = 3) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const entity = this.gridManager.getEntityAt(x, y);
                if (entity instanceof Attraction) {
                    // Para atracciones de 2x2, verificar proximidad a cualquier parte de la atracción
                    for (let ax = x; ax < x + entity.width; ax++) {
                        for (let ay = y; ay < y + entity.height; ay++) {
                            const distance = Math.sqrt(Math.pow(ax - restroomX, 2) + Math.pow(ay - restroomY, 2));
                            if (distance <= radius) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * AS-3: Aplicar bonus de ingreso por doble proximidad
     * Calcula el ingreso de un aseo basado en su proximidad a tiendas Y montañas rusas
     */
    calculateRestroomIncome(restroom) {
        const baseIncome = 2; // Ingreso base de los aseos
        
        const nearShop = this.isRestroomNearShop(restroom.tileX, restroom.tileY);
        const nearAttraction = this.isRestroomNearAttraction(restroom.tileX, restroom.tileY);
        
        // Bonus solo si cumple AMBOS requisitos de proximidad
        const doubleProximityBonus = (nearShop && nearAttraction) ? 8 : 0;
        
        const finalIncome = baseIncome + doubleProximityBonus;
        
        return {
            base: baseIncome,
            nearShop: nearShop,
            nearAttraction: nearAttraction,
            doubleProximityBonus: doubleProximityBonus,
            final: finalIncome
        };
    }

    /**
     * MR-4: Implementar detector de casillas alrededor (Mejorado con sistema GE-2)
     * Escanea las casillas adyacentes a una atracción y contabiliza tipos únicos de casillas construidas
     * Ahora incluye casillas económicas adicionales de modificadores registrados
     */
    scanAdjacentTiles(attractionX, attractionY, attractionWidth, attractionHeight) {
        const uniqueTileTypes = new Set();
        
        // Escanear un radio de 1 casilla alrededor de toda la atracción
        const minX = Math.max(0, attractionX - 1);
        const maxX = Math.min(MAP_WIDTH - 1, attractionX + attractionWidth);
        const minY = Math.max(0, attractionY - 1);
        const maxY = Math.min(MAP_HEIGHT - 1, attractionY + attractionHeight);
        
        // Escanear entidades físicas en el grid
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                // Saltar si estamos dentro de la propia atracción
                if (x >= attractionX && x < attractionX + attractionWidth && 
                    y >= attractionY && y < attractionY + attractionHeight) {
                    continue;
                }
                
                const entity = this.gridManager.getEntityAt(x, y);
                if (entity instanceof Shop) {
                    uniqueTileTypes.add(this.constructedTileTypes.SHOP);
                } else if (entity instanceof Restroom) {
                    uniqueTileTypes.add(this.constructedTileTypes.RESTROOM);
                } else if (entity instanceof Attraction) {
                    uniqueTileTypes.add(this.constructedTileTypes.ATTRACTION);
                }
            }
        }
        
        // GE-2: Integrar casillas económicas adicionales de modificadores
        const economicTilesInArea = this.objectRegistry.getTilesInArea(
            attractionX, attractionY, attractionWidth, attractionHeight, 1
        );
        
        for (const tile of economicTilesInArea) {
            uniqueTileTypes.add(tile.type);
        }
        
        return {
            uniqueTypes: Array.from(uniqueTileTypes),
            count: uniqueTileTypes.size,
            economicTilesCount: economicTilesInArea.length
        };
    }

    /**
     * MR-5: Aplicar Bonus por Diversidad de Casillas
     * Aplica un bonus económico si hay 2 o más tipos diferentes de casillas construidas
     */
    calculateDiversityBonus(attractionX, attractionY, attractionWidth, attractionHeight) {
        const scanResult = this.scanAdjacentTiles(attractionX, attractionY, attractionWidth, attractionHeight);
        
        // Bonus progresivo por diversidad:
        // 2 tipos diferentes: +$3
        // 3 tipos diferentes: +$6  
        // 4+ tipos diferentes: +$10
        if (scanResult.count >= 4) {
            return 10;
        } else if (scanResult.count === 3) {
            return 6;
        } else if (scanResult.count === 2) {
            return 3;
        }
        
        return 0; // Sin bonus si hay menos de 2 tipos
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

    /**
     * GE-2: Métodos públicos para el manejo del ObjectRegistry
     */

    /**
     * Registra un modificador económico
     * @param {IEconomyModifier} modifier - Objeto que implementa IEconomyModifier
     * @returns {number} ID del modificador registrado
     */
    registerModifier(modifier) {
        return this.objectRegistry.registerModifier(modifier);
    }

    /**
     * Desregistra un modificador económico
     * @param {number} id - ID del modificador a remover
     * @returns {boolean} True si se removió exitosamente
     */
    unregisterModifier(id) {
        return this.objectRegistry.unregisterModifier(id);
    }

    /**
     * Ejecuta el tick económico (debe ser llamado desde simulationTick)
     */
    executeTick() {
        this.tickCounter++;
        this.objectRegistry.executeEconomicTick(this.tickCounter);
    }

    /**
     * Obtiene información de debug del sistema de modificadores
     * @returns {object} Información de debug consolidada
     */
    getModifierDebugInfo() {
        return {
            totalModifiers: this.objectRegistry.getModifierCount(),
            activeModifiers: this.objectRegistry.getActiveModifierCount(),
            totalEconomicTiles: this.objectRegistry.getAllEconomicTiles().length,
            modifiers: this.objectRegistry.getDebugInfo()
        };
    }
}

export { EconomyManager };
