const canvas = document.getElementById('game');
const scoreEl = document.getElementById('score-val');
const ctx = canvas.getContext('2d');

let width = 800;
let height = 600;
let flies = [];
let score = 0;

const FROG = {
    x: 0,
    y: 0,
    radius: 48,
    mouthOffsetY: -10,
};

function resize() {
    const rect = document.getElementById('content').getBoundingClientRect();
    width = Math.max(400, Math.floor(rect.width));
    height = Math.max(300, Math.floor(rect.height));
    canvas.width = width;
    canvas.height = height;
    FROG.x = width / 2;
    FROG.y = height - 80;
}

class Fly {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 14 + Math.random() * 8;
        this.vx = (Math.random() - 0.5) * 2.4;
        this.vy = (Math.random() - 0.5) * 2.4;
        this.alive = true;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < this.radius) { this.x = this.radius; this.vx *= -1; }
        if (this.x > width - this.radius) { this.x = width - this.radius; this.vx *= -1; }
        if (this.y < this.radius) { this.y = this.radius; this.vy *= -1; }
        if (this.y > height - 180) { this.y = height - 180; this.vy *= -1; }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // body
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // wings
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.3, -this.radius * 0.6, this.radius * 0.5, this.radius * 0.25, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.radius * 0.3, -this.radius * 0.55, this.radius * 0.5, this.radius * 0.25, 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// tongue animation state
let tongue = {
    active: false,
    targetFly: null,
    progress: 0, // 0..1 extend, then retract
    extending: true,
    speed: 0.06,
};

function spawnFly() {
    const x = 40 + Math.random() * (width - 80);
    const y = 40 + Math.random() * (height / 2);
    flies.push(new Fly(x, y));
}

function spawnInitial(count = 6) {
    flies = [];
    for (let i = 0; i < count; i++) spawnFly();
}

function drawFrog(ctx) {
    // body
    ctx.save();
    ctx.translate(FROG.x, FROG.y);
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(0, 0, FROG.radius + 8, FROG.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-22, -28, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(22, -28, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-22, -24, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, -24, 6, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -6, 28, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
}

function drawTongue(ctx) {
    if (!tongue.active || !tongue.targetFly) return;
    const fx = FROG.x;
    const fy = FROG.y + FROG.mouthOffsetY;
    const tx = tongue.targetFly.x;
    const ty = tongue.targetFly.y;
    // current tip based on progress
    const px = fx + (tx - fx) * tongue.progress;
    const py = fy + (ty - fy) * tongue.progress;
    ctx.save();
    // tongue body
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 8 * (1 - Math.abs(0.5 - tongue.progress));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    // slight curve control
    const cx = fx + (tx - fx) * 0.5;
    const cy = fy - 80 * Math.max(0, 1 - tongue.progress);
    ctx.quadraticCurveTo(cx, cy, px, py);
    ctx.stroke();
    // tip
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function update(dt) {
    for (const f of flies) {
        if (f.alive) f.update();
    }

    if (tongue.active && tongue.targetFly) {
        if (tongue.extending) {
            tongue.progress += tongue.speed;
            if (tongue.progress >= 1) {
                tongue.progress = 1;
                tongue.extending = false;
                // catch the fly
                if (tongue.targetFly.alive) {
                    tongue.targetFly.alive = false;
                    score += 1;
                    scoreEl.textContent = score;
                }
            }
        } else {
            tongue.progress -= tongue.speed;
            if (tongue.progress <= 0) {
                tongue.progress = 0;
                tongue.active = false;
                tongue.targetFly = null;
                tongue.extending = true;
            }
        }
    }

    // remove dead flies after some time and respawn
    flies = flies.filter(f => {
        if (!f.alive) return false;
        return true;
    });

    while (flies.length < 5) spawnFly();
}

let lastTime = performance.now();
function loop(t) {
    const dt = (t - lastTime) / 1000;
    lastTime = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.clearRect(0, 0, width, height);
    // subtle shadow under frog
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(FROG.x, FROG.y + 36, FROG.radius * 0.9, 18, 0, 0, Math.PI * 2); ctx.fill();
    // flies
    for (const f of flies) f.draw(ctx);
    // frog
    drawFrog(ctx);
    // tongue
    drawTongue(ctx);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    // find topmost fly under click
    let found = null;
    for (const f of flies) {
        const dx = mx - f.x;
        const dy = my - f.y;
        if (Math.sqrt(dx * dx + dy * dy) <= f.radius + 6) {
            found = f;
            break;
        }
    }
    if (found && !tongue.active) {
        tongue.active = true;
        tongue.targetFly = found;
        tongue.progress = 0;
        tongue.extending = true;
    }
});

window.addEventListener('resize', () => {
    resize();
});

// init
resize();
spawnInitial(6);
lastTime = performance.now();
requestAnimationFrame(loop);
