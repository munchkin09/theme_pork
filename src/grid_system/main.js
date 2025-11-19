

import Phaser from 'phaser';
import { TILE_SIZE } from '../globals.js';

// ==========================================
// GESTOR DEL MAPA (LOGICA DE GRID CON PHASER TILEMAPS)
// ==========================================

class GridManager {
    constructor(scene, width, height, seed = "default") {
        this.scene = scene;
        this.width = width;
        this.height = height;

        // 1. Generar textura para los tiles si no existe
        if (!scene.textures.exists('tiles')) {
            const graphics = scene.make.graphics();
            
            // Tile 0: Suelo (Verde)
            graphics.fillStyle(0x228b22);
            graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            graphics.lineStyle(1, 0x000000, 0.1);
            graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
            
            // Tile 1: Bloqueado (Gris)
            graphics.fillStyle(0x666666);
            graphics.fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
            graphics.lineStyle(1, 0x000000, 0.1);
            graphics.strokeRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

            graphics.generateTexture('tiles', TILE_SIZE * 2, TILE_SIZE);
        }

        // 2. Crear Tilemap y Layer
        this.map = scene.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width: width, height: height });
        const tileset = this.map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE);
        this.layer = this.map.createBlankLayer('Ground', tileset);

        // 3. Matriz para entidades (objetos del juego sobre el suelo)
        this.entityGrid = Array(height).fill(null).map(() => Array(width).fill(null));

        // 4. Generar mapa
        this.generateRandomBlockedTiles(seed);
    }

    generateRandomBlockedTiles(seed) {
        const blockChance = 0.3; // 30% de las tiles estarán bloqueadas
        const random = this.seededRandom(this.hash(seed));
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (random() < blockChance) {
                    this.layer.putTileAt(1, x, y); // Index 1 = Bloqueado
                } else {
                    this.layer.putTileAt(0, x, y); // Index 0 = Suelo
                }
            }
        }
    }

    hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (h * 31 + str.charCodeAt(i)) % 1000000;
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
        // 1. Validar límites
        if (tx < 0 || ty < 0 || tx + width > this.width || ty + height > this.height) {
            return false;
        }

        // 2. Validar colisiones (Suelo bloqueado o Entidad existente)
        for (let y = ty; y < ty + height; y++) {
            for (let x = tx; x < tx + width; x++) {
                // Chequear tile bloqueado
                const tile = this.layer.getTileAt(x, y);
                if (tile && tile.index === 1) {
                    return false;
                }
                // Chequear entidad
                if (this.entityGrid[y][x] !== null) {
                    return false;
                }
            }
        }
        return true;
    }

    placeEntity(entity, tx, ty) {
        if (!this.canPlace(tx, ty, entity.widthTiles, entity.heightTiles)) return false;

        // Registrar en la matriz de entidades
        for (let y = ty; y < ty + entity.heightTiles; y++) {
            for (let x = tx; x < tx + entity.widthTiles; x++) {
                this.entityGrid[y][x] = entity;
            }
        }
        
        entity.placeAt(tx, ty);
        return true;
    }

    // Métodos auxiliares para interacción
    isBlocked(x, y) {
        const tile = this.layer.getTileAt(x, y);
        return tile && tile.index === 1;
    }

    unlockTile(x, y) {
        this.layer.putTileAt(0, x, y); // Cambiar a suelo (Verde)
    }

    getEntityAt(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.entityGrid[y][x];
        }
        return null;
    }
}

export { GridManager };