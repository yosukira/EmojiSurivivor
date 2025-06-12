class MainScene extends Phaser.Scene {
    constructor() {
        super('main');
    }
    preload() {
        this.load.image('player', 'assets/playerR.png');
    }
    create() {
        this.player = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.speed = 200;
    }
    update(time, delta) {
        const dir = new Phaser.Math.Vector2(0, 0);
        if (this.cursors.left.isDown || this.wasd.A.isDown) dir.x -= 1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) dir.x += 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) dir.y -= 1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) dir.y += 1;
        if (dir.lengthSq() > 0) {
            dir.normalize();
            this.player.x += dir.x * this.speed * delta / 1000;
            this.player.y += dir.y * this.speed * delta / 1000;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    canvas: document.getElementById('gameCanvas'),
    scene: MainScene
};

window.addEventListener('load', () => {
    window.phaserGame = new Phaser.Game(config);
});
