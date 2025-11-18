import Phaser from 'phaser';
import { Attraction } from '../entities/Attraction.js';
import { Shop } from '../entities/Shop.js';
import { Restroom } from '../entities/Restroom.js'; 
import { GridManager } from '../grid_system/main.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../globals.js';
import { CostReduce } from '../entities/objects/CostReduce.js';
import { IncomeBoost } from '../entities/objects/IncomeBoost.js';
import { BuildDiscount } from '../entities/objects/BuildDiscount.js';
import { UnlockTile } from '../entities/objects/UnlockTile.js';
import { AttractionPremium } from '../entities/objects/AttractionPremium.js';
import { AutoMaintenance } from '../entities/objects/AutoMaintenance.js';
// ==========================================
// ESCENA PRINCIPAL (CONTROLADOR)
// ==========================================

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.gridManager = null;
        this.money = 1000;
        this.entities = []; // Lista de todas las entidades activas
        this.cursorObj = null; // El objeto fantasma para construir
        this.currentBuildType = null; // 'attraction', 'shop', etc.

        // Bonuses configurables
        this.shopIncomeBonus = 0;
        this.buildDiscount = 1.0;
        this.attractionBonusMultiplier = 1.0;
        this.breakChance = 0.001;

        // Items disponibles
        this.items = [
            new CostReduce(this),
            new IncomeBoost(this),
            new BuildDiscount(this),
            new UnlockTile(this),
            new AttractionPremium(this),
            new AutoMaintenance(this)
        ];

        // Items comprados
        this.purchasedItems = [];

        // Opciones de construcción
        this.buildOptions = [
            { name: 'Montaña Rusa', cost: 500, type: 'attraction' },
            { name: 'Tienda de Burgers', cost: 200, type: 'shop' },
            { name: 'Aseo / Urinario', cost: 100, type: 'restroom' }
        ];

        // Referencias a botones de construcción
        this.buildButtons = [];
    }

    create() {
        // Generar seed aleatorio para el mapa
        const seed = Math.floor(Math.random() * 1000000).toString();
        localStorage.setItem('mapSeed', seed);
        // Inicializar Grid Manager
        this.gridManager = new GridManager(MAP_WIDTH, MAP_HEIGHT, seed);

        // Dibujar Grid visual (suelo)
        this.createGridVisuals();

        // Input del Mouse
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerdown', this.onPointerDown, this);

        // Loop de simulación del parque (cada 1 segundo)
        this.time.addEvent({ delay: 1000, callback: this.simulationTick, callbackScope: this, loop: true });
        
        // Referencia global para acceso desde UI HTML
        window.gameScene = this;
        window.selectBuildMode = (type) => this.selectBuildMode(type);
        window.buyItem = (id) => this.buyItem(id);

        // Crear menú de items
        this.createItemsMenu();

        // Crear menú de construcción
        this.createBuildMenu();
    }

    createGridVisuals() {
        this.gridSprites = [];
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.2);

        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.gridSprites[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Determinar color basado en el estado de la tile
                let color = 0x228b22; // Verde para vacío
                if (this.gridManager.grid[y][x] === 'blocked') {
                    color = 0x666666; // Gris para bloqueado
                }
                // Suelo base
                const sprite = this.add.rectangle(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, color).setOrigin(0).setStrokeStyle(1, 0x000000, 0.1);
                this.gridSprites[y][x] = sprite;
            }
        }
    }

    // --- Sistema de Interacción y Construcción ---

    selectBuildMode(type) {
        this.currentBuildType = type;
        
        // Limpiar cursor anterior
        if (this.cursorObj) this.cursorObj.destroy();

        // Crear "fantasma" visual según tipo
        let color = 0xffffff;
        let w = 1, h = 1;

        // Factory simple para configuración visual del cursor
        if (type === 'attraction') { w = 2; h = 2; color = 0xff5733; }
        else if (type === 'shop') { color = 0x33ff57; }
        else if (type === 'restroom') { color = 0x3388ff; }

        this.cursorObj = this.add.rectangle(0, 0, w * TILE_SIZE, h * TILE_SIZE, color, 0.5).setOrigin(0);
    }

    onPointerMove(pointer) {
        if (!this.currentBuildType || !this.cursorObj) return;

        // Snapping al Grid
        const tx = Math.floor(pointer.x / TILE_SIZE);
        const ty = Math.floor(pointer.y / TILE_SIZE);

        this.cursorObj.x = tx * TILE_SIZE;
        this.cursorObj.y = ty * TILE_SIZE;

        // Feedback visual de validez
        const w = (this.currentBuildType === 'attraction') ? 2 : 1;
        const h = (this.currentBuildType === 'attraction') ? 2 : 1;

        const isValid = this.gridManager.canPlace(tx, ty, w, h);
        this.cursorObj.fillColor = isValid ? this.cursorObj.fillColor : 0xff0000; // Rojo si no se puede
    }

    onPointerDown(pointer) {
        // Si estamos construyendo
        if (this.currentBuildType) {
            const tx = Math.floor(pointer.x / TILE_SIZE);
            const ty = Math.floor(pointer.y / TILE_SIZE);

            this.attemptBuild(tx, ty);
        }
    }

    attemptBuild(tx, ty) {
        let entity = null;

        // Factory Method para instanciar la clase correcta
        switch (this.currentBuildType) {
            case 'attraction': entity = new Attraction(this, 0, 0); break;
            case 'shop': entity = new Shop(this, 0, 0); break;
            case 'restroom': entity = new Restroom(this, 0, 0); break;
        }

        if (!entity) return;

        // Aplicar descuento
        const discountedCost = Math.floor(entity.cost * this.buildDiscount);

        // 1. Validar fondos
        if (this.money < discountedCost) {
            alert("Fondos insuficientes");
            entity.destroy();
            return;
        }

        // 2. Intentar colocar en el Grid Manager
        if (this.gridManager.placeEntity(entity, tx, ty)) {
            // Éxito
            this.money -= discountedCost;
            this.entities.push(entity);
            this.updateUI();
            
            // Opcional: Salir modo construcción tras construir
            // this.currentBuildType = null; 
            // if (this.cursorObj) this.cursorObj.destroy();
        } else {
            // Fallo (ocupado o fuera de límites)
            entity.destroy(); // Limpiar el objeto temporal
        }
    }

    // --- Ciclo de Juego (Simulación) ---

    simulationTick() {
        // Ejecutar tick de items comprados
        this.purchasedItems.forEach(item => item.tick());

        // Polimorfismo: Iteramos sobre todas las entidades sin importar su tipo concreto
        this.entities.forEach(entity => {
            entity.tick(); // Cada entidad ejecuta su propia lógica

            // Lógica global del parque (recolectar dinero de tiendas)
            if (entity instanceof Shop) {
                const baseIncome = 5 + this.shopIncomeBonus;
                const bonus = this.calculateNeighborBonus(entity.tileX, entity.tileY);
                this.money += baseIncome + bonus;
            }
        });
        this.updateUI();
        this.updateDebugPanel();
    }

    updateDebugPanel() {
        // Actualizar modificadores globales
        const modifiersDiv = document.getElementById('debug-modifiers');
        if (modifiersDiv) {
            modifiersDiv.innerHTML = `
                <div><strong>Modificadores Globales:</strong></div>
                <div>Shop Income Bonus: <span style="color: #33ff57">+${this.shopIncomeBonus}</span></div>
                <div>Build Discount: <span style="color: #3388ff">${Math.round((1 - this.buildDiscount) * 100)}%</span></div>
                <div>Attraction Multiplier: <span style="color: #ff5733">x${this.attractionBonusMultiplier}</span></div>
                <div>Break Chance: <span style="color: #ffcc00">${(this.breakChance * 100).toFixed(2)}%</span></div>
            `;
        }

        // Actualizar tabla de entidades (Tiendas)
        const tbody = document.querySelector('#debug-entities tbody');
        if (tbody) {
            tbody.innerHTML = '';
            let totalIncome = 0;
            
            this.entities.forEach(entity => {
                if (entity instanceof Shop) {
                    const base = 5 + this.shopIncomeBonus;
                    const bonus = this.calculateNeighborBonus(entity.tileX, entity.tileY);
                    const total = base + bonus;
                    totalIncome += total;

                    const row = `
                        <tr>
                            <td>${entity.name}</td>
                            <td>${entity.tileX},${entity.tileY}</td>
                            <td>${base}</td>
                            <td>${bonus}</td>
                            <td>${total}</td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML('beforeend', row);
                }
            });
            
            // Fila de total
            if (this.entities.some(e => e instanceof Shop)) {
                const totalRow = `
                    <tr style="font-weight:bold; background: #444;">
                        <td colspan="4" style="text-align: right; padding-right: 5px;">TOTAL:</td>
                        <td>${totalIncome}</td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', totalRow);
            } else {
                 tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #888;">Sin tiendas</td></tr>';
            }
        }
    }

    calculateNeighborBonus(tx, ty) {
        let attractions = 0, shops = 0, restrooms = 0;

        // Direcciones: arriba, abajo, izquierda, derecha
        const directions = [
            { dx: 0, dy: -1 }, // arriba
            { dx: 0, dy: 1 },  // abajo
            { dx: -1, dy: 0 }, // izquierda
            { dx: 1, dy: 0 }   // derecha
        ];

        directions.forEach(dir => {
            const nx = tx + dir.dx;
            const ny = ty + dir.dy;

            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                const neighbor = this.gridManager.grid[ny][nx];
                if (neighbor instanceof Attraction) attractions++;
                else if (neighbor instanceof Shop) shops++;
                else if (neighbor instanceof Restroom) restrooms++;
            }
        });

        // Calcular bonus: atracciones dan más beneficio, con multiplicador
        const bonus = (attractions * 2 * this.attractionBonusMultiplier) + shops * 1 + restrooms * 0.5;
        return Math.floor(bonus); // Redondear hacia abajo para mantener enteros
    }

    updateUI() {
        document.getElementById('stats').innerText = `Dinero: $${this.money} | Edificios: ${this.entities.length}`;
    }

    buyItem(id) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;

        if (this.money < item.cost) {
            alert("Fondos insuficientes");
            return;
        }

        this.money -= item.cost;
        // Crear instancia para purchasedItems
        const purchasedItem = new item.constructor(this);
        this.purchasedItems.push(purchasedItem);
        this.updateUI();
        alert(`Comprado: ${item.name}`);
    }

    unlockRandomTile() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.gridManager.grid[y][x] === 'blocked') {
                    this.gridManager.grid[y][x] = null;
                    this.gridSprites[y][x].setFillStyle(0x228b22);
                    return; // Desbloquear solo una
                }
            }
        }
        alert("No hay tiles bloqueadas para desbloquear");
    }

    createItemsMenu() {
        const menu = document.getElementById('items-menu');
        this.items.forEach(item => {
            const button = document.createElement('button');
            button.innerText = `${item.name} ($${item.cost})`;
            button.title = item.description;
            button.onclick = () => window.buyItem(item.id);
            menu.appendChild(button);
        });
    }

    createBuildMenu() {
        const menu = document.getElementById('build-menu');
        menu.innerHTML = ''; // Limpiar
        this.buildButtons = [];
        this.buildOptions.forEach(option => {
            const button = document.createElement('button');
            const discountedCost = Math.floor(option.cost * this.buildDiscount);
            button.innerText = `${option.name} ($${discountedCost})`;
            button.onclick = () => this.selectBuildMode(option.type);
            menu.appendChild(button);
            this.buildButtons.push({ button, option });
        });
    }

    updateBuildMenu() {
        this.buildButtons.forEach(({ button, option }) => {
            const discountedCost = Math.floor(option.cost * this.buildDiscount);
            button.innerText = `${option.name} ($${discountedCost})`;
        });
    }
}

// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: MAP_WIDTH * TILE_SIZE,
    height: MAP_HEIGHT * TILE_SIZE,
    parent: 'phaser-game',
    backgroundColor: '#2d2d2d',
    scene: [MainScene]
};

const StartGame = (parent) => {
    const gameConfig = { ...config, parent };
    return new Phaser.Game(gameConfig);
}

export default StartGame;

