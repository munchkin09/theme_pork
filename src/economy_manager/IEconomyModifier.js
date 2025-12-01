/**
 * GE-1: Diseñar interfaz IEconomyModifier
 * 
 * Interfaz que define el contrato para objetos que pueden modificar
 * la evaluación económica del parque mediante casillas adicionales.
 */

/**
 * Representa una casilla que debe ser evaluada para efectos económicos
 */
class EconomicTile {
    constructor(x, y, type, modifier = 1.0, metadata = {}) {
        this.x = x;                    // Coordenada X de la casilla
        this.y = y;                    // Coordenada Y de la casilla  
        this.type = type;              // Tipo de casilla simulada (ej: 'decoration', 'path')
        this.modifier = modifier;      // Multiplicador económico (1.0 = normal, 1.5 = +50%, etc.)
        this.metadata = metadata;      // Información adicional específica del objeto
    }
}

/**
 * Interfaz base para objetos que pueden registrar casillas económicas adicionales
 */
class IEconomyModifier {
    constructor() {
        if (this.constructor === IEconomyModifier) {
            throw new Error("IEconomyModifier es una interfaz abstracta y no puede ser instanciada directamente");
        }
    }

    /**
     * Método abstracto que debe ser implementado por las clases derivadas
     * @returns {EconomicTile[]} Array de casillas económicas que este objeto aporta
     */
    getEconomicTiles() {
        throw new Error("getEconomicTiles() debe ser implementado por la clase derivada");
    }

    /**
     * Método abstracto para determinar si el objeto debe ser evaluado
     * @returns {boolean} True si el objeto está activo y debe contribuir a la economía
     */
    isActive() {
        throw new Error("isActive() debe ser implementado por la clase derivada");
    }

    /**
     * Método opcional para lógica de actualización económica personalizada
     * @param {number} tick - Número de tick actual
     */
    onEconomicTick(tick) {
        // Implementación por defecto: no hacer nada
    }

    /**
     * Método opcional para obtener información de debug
     * @returns {object} Información para mostrar en paneles de debug
     */
    getDebugInfo() {
        return {
            type: this.constructor.name,
            active: this.isActive(),
            tilesCount: this.getEconomicTiles().length
        };
    }
}

export { IEconomyModifier, EconomicTile };