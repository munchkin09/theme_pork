

import { TILE_SIZE } from '../globals.js';

// ==========================================
// GESTOR DEL MAPA (LOGICA DE GRID CON PHASER TILEMAPS)
// ==========================================

class GridManager {
    constructor(scene, width, height, seed = "default") {
        this.scene = scene;
        this.width = width;
        this.height = height;
        
        console.log(`GridManager: Inicializando mapa de ${width}x${height} con semilla "${seed}"`);
        // 1. Create terrain sprites container instead of tilemap
        this.terrainLayer = scene.add.container(0, 0);
        this.terrainSprites = Array(height).fill(null).map(() => Array(width).fill(null));

        // 2. Matriz para entidades (objetos del juego sobre el suelo)
        this.entityGrid = Array(height).fill(null).map(() => Array(width).fill(null));

        // 3. Crear tooltip para información de casillas
        this.tooltip = scene.add.text(0, 0, '', { fontSize: '14px', backgroundColor: '#000000', color: '#ffffff', padding: {x:5, y:5} }).setVisible(false).setDepth(1000);

        // 4. Generar mapa
        this.generateRandomBlockedTiles(seed);
    }

    generateRandomBlockedTiles(seed) {
        const blockChance = 0.3; // 30% de las tiles estarán bloqueadas
        const random = this.seededRandom(this.hash(seed));
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const isBlocked = random() < blockChance;
                const textureName = isBlocked ? 'blocked' : 'grass';
                
                // Crear sprite para cada tile
                let sprite;
                if (this.scene.textures.exists(textureName)) {
                    sprite = this.scene.add.sprite(x * TILE_SIZE, y * TILE_SIZE, textureName);
                } else {
                    // Fallback si no existe la textura
                    sprite = this.scene.add.rectangle(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 
                        isBlocked ? 0x666666 : 0x228b22);
                }
                
                sprite.setOrigin(0, 0);
                sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
                
                // Hacer interactiva la casilla para tooltips
                sprite.setInteractive();
                sprite.on('pointerover', () => this.showTooltip(x, y));
                sprite.on('pointerout', () => this.hideTooltip());
                
                // Almacenar referencia del sprite y si está bloqueado
                this.terrainSprites[y][x] = {
                    sprite: sprite,
                    blocked: isBlocked
                };
                
                this.terrainLayer.add(sprite);
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
                if (this.terrainSprites[y] && this.terrainSprites[y][x] && this.terrainSprites[y][x].blocked) {
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
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            return this.terrainSprites[y][x] && this.terrainSprites[y][x].blocked;
        }
        return false;
    }

    unlockTile(x, y) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width && this.terrainSprites[y][x]) {
            // Cambiar sprite a grass y marcar como no bloqueado
            const tileData = this.terrainSprites[y][x];
            tileData.blocked = false;
            
            if (this.scene.textures.exists('grass')) {
                tileData.sprite.setTexture('grass');
            } else {
                // Fallback color for grass
                tileData.sprite.setFillStyle(0x228b22);
            }
        }
    }

    getEntityAt(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.entityGrid[y][x];
        }
        return null;
    }

    showTooltip(tx, ty) {
        const tileData = this.terrainSprites[ty][tx];
        let info = `Casilla (${tx}, ${ty})\n`;
        if (tileData.blocked) {
            info += 'Estado: Bloqueado\nNo se puede construir aquí.';
        } else {
            const entity = this.getEntityAt(tx, ty);
            if (entity) {
                info += `Estado: Ocupado\nEntidad: ${entity.constructor.name}`;
            } else {
                info += 'Estado: Libre\nSe puede construir aquí.';
            }
        }
        this.tooltip.setText(info);
        this.tooltip.setPosition(tx * TILE_SIZE + TILE_SIZE / 2 - this.tooltip.width / 2, ty * TILE_SIZE - this.tooltip.height - 5);
        this.tooltip.setVisible(true);
    }

    hideTooltip() {
        this.tooltip.setVisible(false);
    }
}

export { GridManager };