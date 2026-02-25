const HEARTS = ['♥', '❤', '♡'];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function spawnHeart(layer: HTMLElement, zone: 'left' | 'right'): void {
  const el = document.createElement('span');

  const left = zone === 'left'
    ? rand(1, 14)
    : rand(86, 99);

  const size     = rand(10, 20);
  const opacity  = rand(0.25, 0.55);
  const duration = rand(8, 16);
  const delay    = rand(0, 8);
  const dx       = rand(-20, 20);
  const char     = HEARTS[Math.floor(Math.random() * HEARTS.length)];

  el.textContent = char;
  el.style.cssText = `
    position: absolute;
    left: ${left}%;
    bottom: -2em;
    font-size: ${size}px;
    opacity: 0;
    --o: ${opacity};
    --dx: ${dx}px;
    animation: floatHeart ${duration}s ${delay}s ease-in-out forwards;
    pointer-events: none;
    user-select: none;
    color: #C9184A;
  `;

  el.addEventListener('animationend', () => {
    el.remove();
    const respawn = rand(200, 1500);
    setTimeout(() => spawnHeart(layer, zone), respawn);
  }, { once: true });

  layer.appendChild(el);
}

export function initHearts(): void {
  const layer = document.getElementById('hearts-layer');
  if (!layer) return;

  // 5 left, 5 right — staggered via CSS delay already randomised in spawnHeart
  for (let i = 0; i < 5; i++) spawnHeart(layer, 'left');
  for (let i = 0; i < 5; i++) spawnHeart(layer, 'right');
}
