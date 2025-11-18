import Phaser from 'phaser';
import { TILE_SIZE } from '../globals.js';
/**
 * Clase Base: ParkEntity
 * Representa cualquier objeto colocable en el mapa.
 * Extiende de Container para agrupar gráficos y lógica visual,
 * pero mantiene su lógica de negocio encapsulada.
 */
class ParkEntity extends Phaser.GameObjects.Container {
    constructor(scene, x, y, type, config) {
        super(scene, x, y);
        
        // Propiedades de identificación y estado
        this.entityType = type; // 'attraction', 'shop', 'service'
        this.tileX = 0;
        this.tileY = 0;
        this.widthTiles = config.width || 1;
        this.heightTiles = config.height || 1;
        this.cost = config.cost || 0;
        this.name = config.name || "Entidad";

        // Renderizado base (un fondo genérico si no se sobrescribe)
        this.baseSprite = scene.add.rectangle(0, 0, this.widthTiles * TILE_SIZE, this.heightTiles * TILE_SIZE, config.color);
        this.baseSprite.setOrigin(0, 0);
        this.add(this.baseSprite);

        // Etiqueta de texto
        this.label = scene.add.text(5, 5, this.name, { fontSize: '10px', color: '#000' });
        this.add(this.label);

        // Interactividad
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.widthTiles * TILE_SIZE, this.heightTiles * TILE_SIZE), Phaser.Geom.Rectangle.Contains);
        this.on('pointerdown', this.onClick, this);

        scene.add.existing(this);
    }

    // Método encapsulado: Colocar en el grid
    placeAt(tx, ty) {
        this.tileX = tx;
        this.tileY = ty;
        this.x = tx * TILE_SIZE;
        this.y = ty * TILE_SIZE;
    }

    // Método virtual: Comportamiento al hacer clic
    onClick() {
        console.log(`Seleccionado: ${this.name} (Tipo: ${this.entityType})`);
    }

    // Método virtual: Lógica de actualización (simulación)
    tick() {
        // Implementar en hijos
    }
}

export { ParkEntity };