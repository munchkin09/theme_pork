import {ParkEntity} from './ParkEntity.js';
/**
 * Clase Derivada: Attraction
 * Añade lógica específica de diversión, capacidad y mantenimiento.
 */
class Attraction extends ParkEntity {
    constructor(scene, x, y) {
        super(scene, x, y, 'attraction', {
            width: 2, height: 2, cost: 500, name: "Montaña Rusa", 
            texture: 'rollercoaster', color: 0xff5733
        });
        
        // Lógica específica encapsulada
        this.excitement = 10;
        this.capacity = 20;
        this.broken = false;
        this.constructionTime = Date.now(); // Timestamp de construcción para decay temporal
    }

    onClick() {
        super.onClick();
        // Aquí podríamos abrir un menú de gestión
        this.scene.log(`Atracción: ${this.name} | Emoción: ${this.excitement}/10 | Estado: ${this.broken ? "Averiada" : "Operativa"}`);
    }

    tick() {
        // Ejemplo de lógica interna: Probabilidad de avería
        if (!this.broken && Math.random() < this.scene.breakChance) {
            this.broken = true;
            this.label.setText(this.name + " (ROTO)");
            // Oscurecer visualmente cuando está roto
            this.baseSprite.setTint(0x555555);
        }
    }
}

export { Attraction };