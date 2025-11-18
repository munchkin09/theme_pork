import {ParkEntity} from './ParkEntity.js';
/**
 * Clase Derivada: Service (Aseos)
 * Lógica de limpieza y utilidad.
 */
class Restroom extends ParkEntity {
    constructor(scene, x, y) {
        super(scene, x, y, 'service', {
            width: 1, height: 1, cost: 100, name: "WC", color: 0x3388ff
        });

        this.cleanliness = 100;
    }

    use() {
        this.cleanliness -= 10;
        if(this.cleanliness < 0) this.cleanliness = 0;
    }

    tick() {
        // Se ensucia con el tiempo
        if (Math.random() < 0.01) this.use();
    }
}

export { Restroom };