

// ==========================================
// GESTOR DEL MAPA (LOGICA DE GRID)
// ==========================================

class GridManager {
    constructor(width, height, seed = "default") {
        this.width = width;
        this.height = height;
        // Matriz 2D para almacenar qué celdas están ocupadas
        // null = vacío, 'blocked' = bloqueado, objeto = referencia a la entidad
        this.grid = Array(height).fill(null).map(() => Array(width).fill(null));

        // Generar mapa aleatorio: bloquear algunas tiles al inicio
        this.generateRandomBlockedTiles(seed);
    }

    generateRandomBlockedTiles(seed) {
        const blockChance = 0.60; // 60% de las tiles estarán bloqueadas
        const random = this.seededRandom(this.hash(seed));
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (random() < blockChance) {
                    this.grid[y][x] = 'blocked';
                }
            }
        }
    }

    hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (h * 31 + str.charCodeAt(i)) % 1000000; // Limitar para evitar overflow
        }
        return h;
    }

    seededRandom(seed) {
        let x = seed;
        return function() {
            x = (x * 9301 + 49297) % 233280;
            return x / 233280;
        };
    }

    canPlace(tx, ty, width, height) {
        // 1. Validar límites del mapa
        if (tx < 0 || ty < 0 || tx + width > this.width || ty + height > this.height) {
            return false;
        }

        // 2. Validar superposición (colisiones)
        for (let y = ty; y < ty + height; y++) {
            for (let x = tx; x < tx + width; x++) {
                if (this.grid[y][x] !== null) {
                    return false; // Ya está ocupado
                }
            }
        }
        return true;
    }

    placeEntity(entity, tx, ty) {
        if (!this.canPlace(tx, ty, entity.widthTiles, entity.heightTiles)) return false;

        // Registrar en la matriz
        for (let y = ty; y < ty + entity.heightTiles; y++) {
            for (let x = tx; x < tx + entity.widthTiles; x++) {
                this.grid[y][x] = entity;
            }
        }
        
        entity.placeAt(tx, ty);
        return true;
    }
}

export { GridManager };