import {ParkEntity} from './ParkEntity.js';
/**
 * Clase Derivada: Attraction
 * Añade lógica específica de diversión, capacidad y mantenimiento.
 */
class Attraction extends ParkEntity {
    constructor(scene, x, y) {
        super(scene, x, y, 'attraction', {
            width: 2, height: 2, cost: 500, name: "Montaña Rusa", color: 0xff5733
        });
        
        // Lógica específica encapsulada
        this.excitement = 10;
        this.capacity = 20;
        this.broken = false;
    }

    onClick() {
        super.onClick();
        // Aquí podríamos abrir un menú de gestión
        alert(`Atracción: ${this.name}\nEmoción: ${this.excitement}/10\nEstado: ${this.broken ? "Averiada" : "Operativa"}`);
    }

    tick() {
        // Ejemplo de lógica interna: Probabilidad de avería
        if (!this.broken && Math.random() < this.scene.breakChance) {
            this.broken = true;
            this.label.setText(this.name + " (ROTO)");
            this.baseSprite.setFillStyle(0x555555); // Oscurecer visualmente
        }
    }
}

export { Attraction };