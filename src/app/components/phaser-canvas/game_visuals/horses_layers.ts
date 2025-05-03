// src/app/components/phaser-canvas/game_visuals/horses_layers.ts
import Phaser from 'phaser';
import type { Horse } from '@app/game/ongoing-race.service';
import type { Observable, Subscription } from 'rxjs';

export interface HorseAnimConfig {
    index: number;
    x: number;
    y: number;
    rate: number;
    scale?: number;
    frames?: number[];
    luminosity?: number;
}

class HorseLayer {
    public sprite: Phaser.GameObjects.Sprite;
    public readonly config: HorseAnimConfig;
    private animKey: string;

    constructor(
        private scene: Phaser.Scene,
        config: HorseAnimConfig
    ) {
        this.config = config;
        const {
            x,
            y,
            rate,
            scale = 0.33,
            frames = [0, 1, 2, 3, 4, 5, 6, 7, 8],
            luminosity
        } = config;

        this.animKey = `horse_${rate}`;

        if (!this.scene.anims.exists(this.animKey)) {
            this.scene.anims.create({
                key: this.animKey,
                frames: this.scene.anims.generateFrameNumbers('horseSpriteSheet', { frames }),
                frameRate: rate,
                repeat: -1
            });
        }

        this.sprite = this.scene.add
            .sprite(x, y, 'horse')
            .setScale(scale);

        if (luminosity !== undefined) {
            const color = Phaser.Display.Color
                .HSLToColor(0, 0, luminosity)
                .color;
            this.sprite.setTint(color);
        }

        this.sprite.play(this.animKey);
    }
}

export class Horses {
    private layers: HorseLayer[] = [];
    private sub!: Subscription;

    private configs: HorseAnimConfig[] = [
        { index: 1,  x: 400, y: 160, rate: 17, luminosity: 0.76 },
        { index: 8,  x: 400, y: 170, rate: 14, luminosity: 0.84 },
        { index: 3,  x: 400, y: 180, rate: 16, luminosity: 0.92 },
        { index: 14, x: 400, y: 190, rate: 15, luminosity: 1.00 },
    ];

    constructor(
        private scene: Phaser.Scene,
        private horses$: Observable<Horse[]>
    ) {}

    preload(): void {
        this.scene.load.spritesheet(
            'horseSpriteSheet',
            'assets/game-img/sprite-sheet/horse-sprite-sheet-0.png',
            { frameWidth: 575, frameHeight: 434 }
        );
    }

    create(): void {
        this.layers = this.configs.map(cfg => new HorseLayer(this.scene, cfg));
        this.sub = this.horses$.subscribe(horses => this.positionSprites(horses));
    }

    update(_time: number, _delta: number): void {}

    private positionSprites(horses: Horse[]) {
        const maxPos = Math.max(...horses.map(h => h.position ?? 0));
        for (let layer of this.layers) {
            const idx   = layer.config.index;
            const horse = horses.find(h => h.index === idx);
            if (!horse || horse.position == null) {
                continue;
            }
            const baseX  = layer.config.x;
            const deltaX = (horse.position - maxPos) * 0.2;
            layer.sprite.x = baseX + deltaX;
        }
    }

    destroy(): void {
        this.sub.unsubscribe();
    }
}
