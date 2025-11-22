import {ParkEntity} from './ParkEntity.js';
/**
 * Clase Derivada: Shop
 * Añade lógica de ventas e ingresos.
 */
class Shop extends ParkEntity {
    constructor(scene, x, y) {
        super(scene, x, y, 'shop', {
            width: 1, height: 1, cost: 200, name: "Burgers", 
            texture: 'shop_fallback', color: 0x33ff57
        });

        this.incomePerTick = 5;
    }

    // Método específico de negocio
    generateIncome() {
        return this.incomePerTick;
    }
    
    tick() {
        // Animación simple de venta
    }
}

export { Shop };