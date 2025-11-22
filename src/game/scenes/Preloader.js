import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        // Add a loading bar
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

        // Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload ()
    {
        // The Preloader will run after the MainScene is done.
        // Set the base path for assets
        this.load.setBaseURL('./');

        // Load terrain textures
        this.load.image('grass', 'assets/textures/terrain/grass.png');
        this.load.image('blocked', 'assets/textures/terrain/blocked.png');

        // Load attraction textures
        this.load.image('rollercoaster', 'assets/textures/attractions/rollercoaster.png');

        // Load service textures
        this.load.image('restroom', 'assets/textures/services/restroom.png');

        // Load shop textures (placeholder for now since folder is empty)
        // We'll create a fallback texture for shops
        
        // Create a fallback shop texture programmatically
        this.load.image('background', 'assets/bg.png'); // Keep existing background if it exists
    }

    create ()
    {
        // Create a fallback shop texture since the shops folder is empty
        if (!this.textures.exists('shop_fallback')) {
            const graphics = this.add.graphics();
            
            // Shop base (brown building)
            graphics.fillStyle(0x8B4513);
            graphics.fillRect(0, 0, 64, 64);
            
            // Shop roof (red)
            graphics.fillStyle(0xCC3333);
            graphics.fillTriangle(32, 5, 5, 25, 59, 25);
            
            // Shop windows
            graphics.fillStyle(0x87CEEB);
            graphics.fillRect(10, 30, 15, 20);
            graphics.fillRect(39, 30, 15, 20);
            
            // Shop door
            graphics.fillStyle(0x654321);
            graphics.fillRect(27, 35, 10, 20);
            
            // Shop sign
            graphics.fillStyle(0xFFFFFF);
            graphics.fillRect(5, 52, 54, 8);
            
            graphics.generateTexture('shop_fallback', 64, 64);
            graphics.destroy();
        }

        // Create loading complete message
        const loadingText = this.add.text(512, 350, 'Texturas cargadas correctamente!', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Wait a moment then start the main scene
        this.time.delayedCall(1000, () => {
            this.scene.start('MainScene');
        });
    }
}