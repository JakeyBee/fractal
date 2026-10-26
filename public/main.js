const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    draw();
}

function draw() {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = `${16 * dpr}px monospace`;
    ctx.fillText(`${canvas.width} x ${canvas.height}`, 20 * dpr, 40 * dpr);
}

window.addEventListener('resize', resize);
resize();