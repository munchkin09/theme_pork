import { ParkEntity } from './ParkEntity.js';
import { IEconomyModifier, EconomicTile } from '../economy_manager/IEconomyModifier.js';

/**
 * GE-3: Crear Objeto de Prueba de Modificación - Señal de Neón
 * 
 * Un objeto decorativo que implementa IEconomyModifier para demostrar
 * cómo los objetos pueden añadir casillas económicas virtuales al sistema.
 */
class NeonSign extends ParkEntity {
    constructor(scene, x, y) {
        super(scene, x, y, 'decoration', {
            width: 1, height: 1, cost: 150, name: "Señal de Neón", 
            texture: 'neon_sign', color: 0xff00ff
        });

        this.brightness = 1.0;        // Brillo actual (0.0 a 1.0)
        this.isWorking = true;        // Estado de funcionamiento
        this.modifierId = null;       // ID del modificador en el registry
        this.energyConsumption = 2;   // Consumo de energía por tick
    }

    /**
     * Sobrescribir placeAt para registrar el modificador económico
     */
    placeAt(tx, ty) {
        super.placeAt(tx, ty);
        
        // Registrar este objeto como modificador económico
        if (this.scene && this.scene.economyManager) {
            this.modifierId = this.scene.economyManager.registerModifier(this);
        }
    }

    /**
     * Sobrescribir destroy para limpiar el registro
     */
    destroy() {
        // Desregistrar el modificador antes de destruir
        if (this.modifierId !== null && this.scene && this.scene.economyManager) {
            this.scene.economyManager.unregisterModifier(this.modifierId);
        }
        super.destroy();
    }

    /**
     * Implementación de IEconomyModifier: obtener casillas económicas
     */
    getEconomicTiles() {
        if (!this.isWorking) {
            return []; // No contribuye si no está funcionando
        }

        const tiles = [];
        
        // La señal de neón simula una casilla de "decoración iluminada" en su posición
        tiles.push(new EconomicTile(
            this.tileX, 
            this.tileY, 
            'decoration', 
            this.brightness, 
            { 
                type: 'neon_illumination',
                energyConsumption: this.energyConsumption
            }
        ));

        // Añadir efecto de "iluminación" a casillas adyacentes si el brillo es alto
        if (this.brightness >= 0.8) {
            const adjacentOffsets = [
                {dx: -1, dy: 0}, {dx: 1, dy: 0},   // izquierda, derecha
                {dx: 0, dy: -1}, {dx: 0, dy: 1}    // arriba, abajo
            ];

            for (const offset of adjacentOffsets) {
                const adjX = this.tileX + offset.dx;
                const adjY = this.tileY + offset.dy;
                
                // Verificar que esté dentro de los límites del mapa
                if (adjX >= 0 && adjY >= 0) { // Los límites superiores se verifican en el registry
                    tiles.push(new EconomicTile(
                        adjX, 
                        adjY, 
                        'illumination', 
                        this.brightness * 0.5, // Efecto reducido en casillas adyacentes
                        { 
                            type: 'ambient_light',
                            source: `neon_${this.tileX}_${this.tileY}`
                        }
                    ));
                }
            }
        }

        return tiles;
    }

    /**
     * Implementación de IEconomyModifier: verificar si está activo
     */
    isActive() {
        return this.isWorking && !this.destroyed;
    }

    /**
     * Implementación de IEconomyModifier: lógica de tick económico
     */
    onEconomicTick(tick) {
        // Simular fluctuación de brillo (efecto parpadeo realista)
        if (this.isWorking) {
            // Pequeña variación aleatoria en el brillo
            const flickerAmount = (Math.random() - 0.5) * 0.1;
            this.brightness = Math.max(0.7, Math.min(1.0, this.brightness + flickerAmount));
            
            // Posibilidad muy baja de avería
            if (Math.random() < 0.001) {
                this.breakDown();
            }
        }
    }

    /**
     * Implementación de IEconomyModifier: información de debug
     */
    getDebugInfo() {
        return {
            type: 'NeonSign',
            active: this.isActive(),
            tilesCount: this.getEconomicTiles().length,
            brightness: Math.round(this.brightness * 100) + '%',
            working: this.isWorking,
            position: `${this.tileX},${this.tileY}`,
            energyConsumption: this.energyConsumption
        };
    }

    /**
     * Lógica específica del objeto: avería de la señal
     */
    breakDown() {
        this.isWorking = false;
        this.brightness = 0;
        this.label.setText(this.name + " (AVERIADA)");
        this.baseSprite.setTint(0x444444); // Oscurecer visualmente
        
        if (this.scene && this.scene.log) {
            this.scene.log(`La ${this.name} en (${this.tileX},${this.tileY}) se ha averiado!`);
        }
    }

    /**
     * Reparar la señal de neón
     */
    repair() {
        this.isWorking = true;
        this.brightness = 1.0;
        this.label.setText(this.name);
        this.baseSprite.clearTint();
        
        if (this.scene && this.scene.log) {
            this.scene.log(`La ${this.name} en (${this.tileX},${this.tileY}) ha sido reparada.`);
        }
    }

    /**
     * Sobrescribir onClick para mostrar información específica
     */
    onClick() {
        super.onClick();
        if (this.scene && this.scene.log) {
            const tiles = this.getEconomicTiles();
            this.scene.log(`${this.name}: Brillo ${Math.round(this.brightness * 100)}%, ${tiles.length} casillas económicas, Estado: ${this.isWorking ? "Funcionando" : "Averiada"}`);
        }
    }

    /**
     * Lógica de tick del objeto (heredado de ParkEntity)
     */
    tick() {
        // La lógica económica se maneja en onEconomicTick
        // Aquí podríamos añadir otras lógicas específicas del objeto
    }
}

// Nota: NeonSign hereda de ParkEntity e implementa IEconomyModifier mediante composición
// No necesitamos mixin complejo, solo implementamos la interfaz

export { NeonSign };