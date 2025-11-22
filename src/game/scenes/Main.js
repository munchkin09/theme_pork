import Phaser from 'phaser';
import { Attraction } from '../../entities/Attraction.js';
import { Shop } from '../../entities/Shop.js';
import { Restroom } from '../../entities/Restroom.js'; 
import { GridManager } from '../../grid_system/main.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../../globals.js';
import { CostReduce } from '../../entities/objects/CostReduce.js';
import { IncomeBoost } from '../../entities/objects/IncomeBoost.js';
import { BuildDiscount } from '../../entities/objects/BuildDiscount.js';
import { UnlockTile } from '../../entities/objects/UnlockTile.js';
import { AttractionPremium } from '../../entities/objects/AttractionPremium.js';
import { AutoMaintenance } from '../../entities/objects/AutoMaintenance.js';
// ==========================================
// ESCENA PRINCIPAL (CONTROLADOR)
// ==========================================

class MainScene extends Phaser.Scene {

    timer;
    totalTime = 12; // 2 minutos 
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

        // Lógica de fin de juego
        this.targetMoney = 800; // Objetivo de dinero
        this.gameEnded = false;
    }

    create() {
        // Generar seed aleatorio para el mapa
        const seed = Math.floor(Math.random() * 1000000).toString();
        localStorage.setItem('mapSeed', seed);
        // Inicializar Grid Manager (ahora maneja la visualización con Tilemaps)
        this.gridManager = new GridManager(this, MAP_WIDTH, MAP_HEIGHT, seed);
        
        // Loop de simulación (economía) - cada 1 segundo
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimerUI,
            callbackScope: this,
            loop: true
        });

        // Input del Mouse
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerdown', this.onPointerDown, this);

        // Referencia global para acceso desde UI HTML
        window.gameScene = this;
        window.selectBuildMode = (type) => this.selectBuildMode(type);
        window.buyItem = (id) => this.buyItem(id);

        // Crear menú de items
        this.createItemsMenu();

        // Crear menú de construcción
        this.createBuildMenu();
    }

    update(time, _) {
        if(this.gameEnded === true) return;
        if(this.totalTime <= 0) {
            this.endGame();
            return;
        }
        if (!this.lastTickTime) this.lastTickTime = 0;
        if (time - this.lastTickTime >= 1000) {
            this.simulationTick();
            this.updateDebugPanel();
            this.updateBuildMenu();
            this.lastTickTime = time;
        }
        this.updateUI();
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
            this.log("Fondos insuficientes para construir.");
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
        if (this.gameEnded === true) return;

        // Ejecutar tick de items comprados
        this.purchasedItems.forEach(item => item.tick());

        // Polimorfismo: Iteramos sobre todas las entidades sin importar su tipo concreto
        this.entities.forEach(entity => {
            entity.tick(); // Cada entidad ejecuta su propia lógica

            // Lógica global del parque (recolectar dinero de tiendas)
            if (entity instanceof Shop) {
                const baseIncome = 5 + Math.floor(this.shopIncomeBonus);
                const bonus = this.calculateNeighborBonus(entity.tileX, entity.tileY);
                this.money += baseIncome + bonus;
                this.log(`La tienda ${entity.name} generó $${baseIncome + bonus} (Base: $${baseIncome}, Bonus: $${bonus})`);
            }
        });
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
                const neighbor = this.gridManager.getEntityAt(nx, ny);
                if (neighbor instanceof Attraction) attractions++;
                else if (neighbor instanceof Shop) shops++;
                else if (neighbor instanceof Restroom) restrooms++;
            }
        });

        // Calcular bonus: atracciones dan más beneficio, con multiplicador
        const bonus = (attractions * 3 * this.attractionBonusMultiplier) + (shops * 2.0) + (restrooms * 1.0);
        return Math.floor(bonus); // Redondear hacia abajo para mantener enteros
    }

    updateTimerUI() {
        if (!this.timer) return;

        const minutes = Math.floor(this.totalTime / 60);
        const seconds = Math.floor(this.totalTime % 60);
        this.totalTime--;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.innerText = `Tiempo: ${timeString}`;
            // Alerta visual cuando queda poco tiempo
            if (this.totalTime <= 10) {
                timerElement.style.color = '#ff0000';
            } else {
                timerElement.style.color = '#FFC107';
            }
        }
    }

    endGame() {
        this.gameEnded = true;

        this.time.removeEvent(this.timer);
        this.updateTimerUI(); // Asegurar que muestre 0:00
        if (this.money >= this.targetMoney) {
            this.log(`¡NIVEL SUPERADO! Has conseguido $${this.money} (Objetivo: $${this.targetMoney})`);
        } else {
            this.log(`¡TIEMPO AGOTADO! Te has quedado con $${this.money} (Objetivo: $${this.targetMoney}). Inténtalo de nuevo.`);
        }
    }

    updateUI() {
        document.getElementById('stats').innerText = `Dinero: $${this.money} | Edificios: ${this.entities.length}`;
        document.getElementById('goal').innerText = `Objetivo: $${this.targetMoney}`;
    }

    log(message) {
        const consoleDiv = document.getElementById('game-console');
        if (consoleDiv) {
            const msgElement = document.createElement('div');
            msgElement.innerText = `> ${message}`;
            consoleDiv.appendChild(msgElement);
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
    }

    buyItem(id) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;

        if (this.money < item.cost) {
            this.log("Fondos insuficientes para comprar item.");
            return;
        }

        this.money -= item.cost;
        // Crear instancia para purchasedItems
        const purchasedItem = new item.constructor(this);
        this.purchasedItems.push(purchasedItem);
        this.updateUI();
        this.log(`Comprado: ${item.name}`);
    }

    unlockRandomTile() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.gridManager.isBlocked(x, y)) {
                    this.gridManager.unlockTile(x, y);
                    this.log("Terreno desbloqueado.");
                    return; // Desbloquear solo una
                }
            }
        }
        this.log("No hay tiles bloqueadas para desbloquear.");
    }

    createItemsMenu() {
        const menu = document.getElementById('items-menu');
        const tooltip = document.getElementById('custom-tooltip');

        this.items.forEach(item => {
            const button = document.createElement('button');
            button.innerText = `${item.name} ($${item.cost})`;
            // button.title = item.description; // Reemplazado por tooltip personalizado
            
            button.onmouseenter = () => {
                tooltip.style.display = 'block';
                tooltip.innerText = item.description;
            };
            button.onmousemove = (e) => {
                tooltip.style.left = (e.pageX + 15) + 'px';
                tooltip.style.top = (e.pageY + 15) + 'px';
            };
            button.onmouseleave = () => {
                tooltip.style.display = 'none';
            };

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

export { MainScene };