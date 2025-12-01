import { IEconomyModifier, EconomicTile } from './IEconomyModifier.js';

/**
 * GE-2: ObjectRegistry - Sistema de registro y evaluación de modificadores económicos
 * 
 * Gestiona todos los objetos que implementan IEconomyModifier y proporciona
 * un punto centralizado para la evaluación económica de casillas adicionales.
 */
class ObjectRegistry {
    constructor() {
        this.modifiers = new Map(); // Map<id, IEconomyModifier>
        this.nextId = 1;
    }

    /**
     * Registra un nuevo modificador económico en el sistema
     * @param {IEconomyModifier} modifier - Objeto que implementa IEconomyModifier
     * @returns {number} ID único del modificador registrado
     */
    registerModifier(modifier) {
        // Verificar que el objeto implemente los métodos requeridos de IEconomyModifier
        if (!modifier || 
            typeof modifier.getEconomicTiles !== 'function' || 
            typeof modifier.isActive !== 'function') {
            throw new Error("El objeto debe implementar IEconomyModifier (getEconomicTiles, isActive)");
        }

        const id = this.nextId++;
        this.modifiers.set(id, modifier);
        return id;
    }

    /**
     * Desregistra un modificador del sistema
     * @param {number} id - ID del modificador a remover
     * @returns {boolean} True si se removió exitosamente
     */
    unregisterModifier(id) {
        return this.modifiers.delete(id);
    }

    /**
     * Obtiene todos los modificadores activos
     * @returns {IEconomyModifier[]} Array de modificadores activos
     */
    getActiveModifiers() {
        const activeModifiers = [];
        for (const [id, modifier] of this.modifiers) {
            if (modifier.isActive()) {
                activeModifiers.push(modifier);
            }
        }
        return activeModifiers;
    }

    /**
     * Recolecta todas las casillas económicas de todos los modificadores activos
     * @returns {EconomicTile[]} Array consolidado de todas las casillas económicas
     */
    getAllEconomicTiles() {
        const allTiles = [];
        const activeModifiers = this.getActiveModifiers();

        for (const modifier of activeModifiers) {
            try {
                const tiles = modifier.getEconomicTiles();
                if (Array.isArray(tiles)) {
                    allTiles.push(...tiles);
                }
            } catch (error) {
                console.error(`Error obteniendo tiles de modificador:`, error);
            }
        }

        return allTiles;
    }

    /**
     * Obtiene casillas económicas en un área específica
     * @param {number} x - Coordenada X del área
     * @param {number} y - Coordenada Y del área  
     * @param {number} width - Ancho del área
     * @param {number} height - Alto del área
     * @param {number} radius - Radio adicional de búsqueda (opcional)
     * @returns {EconomicTile[]} Casillas económicas en el área especificada
     */
    getTilesInArea(x, y, width = 1, height = 1, radius = 0) {
        const allTiles = this.getAllEconomicTiles();
        const tilesInArea = [];

        const minX = x - radius;
        const maxX = x + width + radius - 1;
        const minY = y - radius;
        const maxY = y + height + radius - 1;

        for (const tile of allTiles) {
            if (tile.x >= minX && tile.x <= maxX && 
                tile.y >= minY && tile.y <= maxY) {
                tilesInArea.push(tile);
            }
        }

        return tilesInArea;
    }

    /**
     * Obtiene tipos únicos de casillas en un área
     * @param {number} x - Coordenada X del área
     * @param {number} y - Coordenada Y del área
     * @param {number} width - Ancho del área
     * @param {number} height - Alto del área
     * @param {number} radius - Radio de búsqueda
     * @returns {object} Información sobre tipos únicos y modificadores
     */
    getUniqueTypesInArea(x, y, width = 1, height = 1, radius = 1) {
        const tilesInArea = this.getTilesInArea(x, y, width, height, radius);
        const uniqueTypes = new Set();
        let totalModifier = 0;
        let tileCount = 0;

        for (const tile of tilesInArea) {
            uniqueTypes.add(tile.type);
            totalModifier += tile.modifier;
            tileCount++;
        }

        return {
            uniqueTypes: Array.from(uniqueTypes),
            count: uniqueTypes.size,
            averageModifier: tileCount > 0 ? totalModifier / tileCount : 1.0,
            totalTiles: tileCount
        };
    }

    /**
     * Ejecuta el tick económico en todos los modificadores activos
     * @param {number} tick - Número de tick actual
     */
    executeEconomicTick(tick) {
        const activeModifiers = this.getActiveModifiers();
        for (const modifier of activeModifiers) {
            try {
                modifier.onEconomicTick(tick);
            } catch (error) {
                console.error(`Error en tick económico de modificador:`, error);
            }
        }
    }

    /**
     * Obtiene información de debug de todos los modificadores
     * @returns {object[]} Array con información de debug
     */
    getDebugInfo() {
        const debugInfo = [];
        for (const [id, modifier] of this.modifiers) {
            try {
                debugInfo.push({
                    id: id,
                    ...modifier.getDebugInfo()
                });
            } catch (error) {
                debugInfo.push({
                    id: id,
                    type: 'Error',
                    error: error.message
                });
            }
        }
        return debugInfo;
    }

    /**
     * Limpia todos los modificadores registrados
     */
    clear() {
        this.modifiers.clear();
        this.nextId = 1;
    }

    /**
     * Obtiene el número total de modificadores registrados
     * @returns {number} Cantidad de modificadores
     */
    getModifierCount() {
        return this.modifiers.size;
    }

    /**
     * Obtiene el número de modificadores activos
     * @returns {number} Cantidad de modificadores activos
     */
    getActiveModifierCount() {
        return this.getActiveModifiers().length;
    }
}

export { ObjectRegistry };