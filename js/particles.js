// Animación simple de fuego
const c = document.getElementById("fuego");
const ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

let partículas = [];

function crearPartícula() {
  partículas.push({
    x: Math.random() * c.width,
    y: c.height + 10,
    size: Math.random() * 3 + 2,
    speed: Math.random() * 1 + 0.5,
    color: `rgba(255, ${Math.random()*150}, 0, 0.8)`
  });
}

function animar() {
  ctx.clearRect(0, 0, c.width, c.height);

  for (let p of partículas) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    p.y -= p.speed;
    if (p.y < -10) {
      partículas.splice(partículas.indexOf(p), 1);
    }
  }

  if (partículas.length < 200) crearPartícula();
  requestAnimationFrame(animar);
}

animar();
