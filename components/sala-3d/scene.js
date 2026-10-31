import * as THREE from 'three';
import { createNpcCharacter, createPlayerCharacter } from './characters.js';

export const NEAR_DISTANCE = 2.5;

const ROOM = { halfX: 7, halfZ: 6, wallHeight: 3.6, wallThickness: 0.2 };
const PLAYER_RADIUS = 0.35;
const PLAYER_SPEED = 3.2;
const NPC_RADIUS = 0.45;
const NPC_POSITION = new THREE.Vector3(0.2, 0, -1.6);
const NPC_DEFAULT_YAW = 0;
const NPC_FACE_DISTANCE = 5;
const NPC_LABEL_HEIGHT = 2.15;
const PLAYER_LABEL_HEIGHT = 2.15;
const CAMERA_OFFSET = new THREE.Vector3(0, 5.2, 6.6);
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const dampAngle = (current, target, lambda, dt) => current + wrapAngle(target - current) * (1 - Math.exp(-lambda * dt));

function isEditable(target) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
  );
}

function mesh(geometry, color, { cast = true, receive = true, roughness = 0.8 } = {}) {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 }));
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

const box = (w, h, d, color, opts) => mesh(new THREE.BoxGeometry(w, h, d), color, opts);

// ---------- Mobiliario ----------

function buildDesk() {
  const desk = new THREE.Group();
  const wood = 0x7a5233;
  const top = box(2.6, 0.08, 1.1, wood);
  top.position.y = 0.76;
  desk.add(top);
  for (const [x, z] of [[-1.2, -0.48], [1.2, -0.48], [-1.2, 0.48], [1.2, 0.48]]) {
    const leg = box(0.08, 0.72, 0.08, 0x5e3f27);
    leg.position.set(x, 0.36, z);
    desk.add(leg);
  }
  const drawers = box(0.7, 0.5, 0.95, 0x6a4529);
  drawers.position.set(0.85, 0.5, 0);
  desk.add(drawers);
  const laptopBase = box(0.5, 0.03, 0.35, 0x40454d);
  laptopBase.position.set(-0.5, 0.815, 0.05);
  const laptopScreen = box(0.5, 0.33, 0.025, 0x23272e);
  laptopScreen.position.set(-0.5, 0.995, -0.12);
  laptopScreen.rotation.x = -0.18;
  desk.add(laptopBase, laptopScreen);
  return desk;
}

function buildChair() {
  const chair = new THREE.Group();
  const seat = box(0.5, 0.06, 0.5, 0x37507a);
  seat.position.y = 0.46;
  const back = box(0.5, 0.5, 0.05, 0x37507a);
  back.position.set(0, 0.74, -0.22);
  chair.add(seat, back);
  for (const [x, z] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) {
    const leg = box(0.05, 0.43, 0.05, 0x2c2f36);
    leg.position.set(x, 0.215, z);
    chair.add(leg);
  }
  return chair;
}

function buildPlant() {
  const plant = new THREE.Group();
  const pot = mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.45, 20), 0xb5683f);
  pot.position.y = 0.225;
  const soil = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 20), 0x3a2a1e, { cast: false });
  soil.position.y = 0.44;
  const stem = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 8), 0x4a5a2e);
  stem.position.y = 0.72;
  plant.add(pot, soil, stem);
  const leafGeo = new THREE.SphereGeometry(0.26, 14, 12);
  for (const [x, y, z, s, c] of [
    [0, 1.15, 0, 1.15, 0x2f7d46],
    [0.2, 0.9, 0.08, 0.8, 0x3a8f52],
    [-0.2, 0.95, -0.06, 0.85, 0x2a6e3f],
    [0.02, 0.8, -0.2, 0.7, 0x3a8f52],
    [-0.05, 0.78, 0.22, 0.7, 0x2a6e3f],
  ]) {
    const leaf = mesh(leafGeo, c);
    leaf.position.set(x, y, z);
    leaf.scale.setScalar(s);
    plant.add(leaf);
  }
  return plant;
}

// ---------- Colisiones (círculos y cajas alineadas a los ejes, en el plano XZ) ----------

function resolveCollisions(pos, radius, obstacles) {
  for (let pass = 0; pass < 3; pass++) {
    for (const o of obstacles) {
      if (o.type === 'circle') {
        let dx = pos.x - o.x;
        let dz = pos.z - o.z;
        const min = radius + o.r;
        const d2 = dx * dx + dz * dz;
        if (d2 >= min * min) continue;
        if (d2 === 0) dx = 1;
        const d = Math.sqrt(dx * dx + dz * dz);
        pos.x = o.x + (dx / d) * min;
        pos.z = o.z + (dz / d) * min;
      } else {
        const cx = clamp(pos.x, o.minX, o.maxX);
        const cz = clamp(pos.z, o.minZ, o.maxZ);
        const dx = pos.x - cx;
        const dz = pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= radius * radius) continue;
        if (d2 > 0) {
          const d = Math.sqrt(d2);
          pos.x = cx + (dx / d) * radius;
          pos.z = cz + (dz / d) * radius;
        } else {
          // El centro quedó dentro de la caja: salir por el lado más cercano
          const exits = [
            [pos.x - o.minX, -1, 0],
            [o.maxX - pos.x, 1, 0],
            [pos.z - o.minZ, 0, -1],
            [o.maxZ - pos.z, 0, 1],
          ].sort((a, b) => a[0] - b[0])[0];
          pos.x += exits[1] * (exits[0] + radius);
          pos.z += exits[2] * (exits[0] + radius);
        }
      }
    }
    pos.x = clamp(pos.x, -ROOM.halfX + radius, ROOM.halfX - radius);
    pos.z = clamp(pos.z, -ROOM.halfZ + radius, ROOM.halfZ - radius);
  }
}

/**
 * Crea la escena 3D dentro de `container`.
 * @param {HTMLElement} container
 * @param {{ npcSeverity?: number, onFrame?: (info: object) => void }} options
 */
/**
 * @param {HTMLElement} container
 * @param {{ npcSeverity?: number, onFrame?: (frame: { near: boolean, width: number, height: number, anchor: { x: number, y: number, visible: boolean }, playerAnchor: { x: number, y: number, visible: boolean } }) => void }} [options]
 */
export function createScene(container, { npcSeverity = 0, onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = 'scene-canvas';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14171d);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);

  // ---- Luces ----
  scene.add(new THREE.AmbientLight(0xfff3e0, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 24;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  // ---- Sala ----
  // Más grande que la sala: a pantalla completa la cámara alcanza a ver detrás de la pared sur
  const floor = mesh(new THREE.PlaneGeometry(80, 80), 0xa57e55, { cast: false });
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const rug = mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.02, 40), 0x3d6b73, { cast: false });
  rug.position.set(0.2, 0.011, 0.6);
  scene.add(rug);

  const walls = {};
  const wallColor = 0xe6dfd2;
  const t = ROOM.wallThickness;
  const h = ROOM.wallHeight;
  const defs = {
    north: [ROOM.halfX * 2 + t * 2, h, t, 0, h / 2, -ROOM.halfZ - t / 2],
    south: [ROOM.halfX * 2 + t * 2, h, t, 0, h / 2, ROOM.halfZ + t / 2],
    west: [t, h, ROOM.halfZ * 2, -ROOM.halfX - t / 2, h / 2, 0],
    east: [t, h, ROOM.halfZ * 2, ROOM.halfX + t / 2, h / 2, 0],
  };
  for (const [name, [w, hh, d, x, y, z]] of Object.entries(defs)) {
    const wall = box(w, hh, d, wallColor);
    wall.position.set(x, y, z);
    scene.add(wall);
    walls[name] = wall;
  }

  const desk = buildDesk();
  desk.position.set(2.5, 0, -4.4);
  const chairBehind = buildChair();
  chairBehind.position.set(2.5, 0, -5.35);
  const chairFront = buildChair();
  chairFront.position.set(2.5, 0, -3.15);
  chairFront.rotation.y = Math.PI;
  const plant = buildPlant();
  plant.position.set(-6.2, 0, -5.2);
  scene.add(desk, chairBehind, chairFront, plant);

  const obstacles = [
    { type: 'box', minX: 2.5 - 1.3, maxX: 2.5 + 1.3, minZ: -4.4 - 0.55, maxZ: -4.4 + 0.55 },
    { type: 'circle', x: 2.5, z: -5.35, r: 0.38 },
    { type: 'circle', x: 2.5, z: -3.15, r: 0.38 },
    { type: 'circle', x: -6.2, z: -5.2, r: 0.42 },
    { type: 'circle', x: NPC_POSITION.x, z: NPC_POSITION.z, r: NPC_RADIUS },
  ];

  // ---- Personajes ----
  const player = createPlayerCharacter();
  const playerPos = new THREE.Vector3(2, 0, 3.8);
  let playerYaw = Math.PI; // mirando hacia el fondo de la sala
  player.group.position.copy(playerPos);
  player.group.rotation.y = playerYaw;
  scene.add(player.group);

  const npc = createNpcCharacter();
  npc.group.position.copy(NPC_POSITION);
  let npcYaw = NPC_DEFAULT_YAW;
  npc.group.rotation.y = npcYaw;
  npc.setSeverity(npcSeverity);
  npc.severity = npc.severityTarget; // sin transición inicial
  scene.add(npc.group);

  // ---- Entrada de teclado ----
  const keys = new Set();
  let interacting = false;

  const onKeyDown = (e) => {
    if (!MOVE_KEYS.has(e.code)) return;
    if (interacting || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    keys.add(e.code);
    e.preventDefault();
  };
  const onKeyUp = (e) => keys.delete(e.code);
  const clearKeys = () => keys.clear();
  const onVisibility = () => {
    if (document.hidden) clearKeys();
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);
  document.addEventListener('visibilitychange', onVisibility);

  // ---- Movimiento reducido ----
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reducedQuery.matches;
  const onReducedChange = (e) => {
    reducedMotion = e.matches;
  };
  reducedQuery.addEventListener('change', onReducedChange);

  // ---- Tamaño ----
  let width = 1;
  let height = 1;
  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  // ---- Bucle ----
  const camPos = new THREE.Vector3().copy(playerPos).add(CAMERA_OFFSET);
  const camLook = new THREE.Vector3(playerPos.x, 1.2, playerPos.z);
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const wanted = new THREE.Vector3();
  const lookWanted = new THREE.Vector3();

  camera.position.copy(camPos);
  camera.lookAt(camLook);

  function update(dt) {
    // Dirección de movimiento relativa a la cámara
    let moving = false;
    if (!interacting && keys.size > 0) {
      const fwd = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const str = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      if (fwd !== 0 || str !== 0) {
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.set(-forward.z, 0, forward.x);
        move.set(0, 0, 0).addScaledVector(forward, fwd).addScaledVector(right, str).normalize();
        const before = playerPos.clone();
        playerPos.addScaledVector(move, PLAYER_SPEED * dt);
        resolveCollisions(playerPos, PLAYER_RADIUS, obstacles);
        moving = playerPos.distanceTo(before) > PLAYER_SPEED * dt * 0.15;
        playerYaw = dampAngle(playerYaw, Math.atan2(move.x, move.z), 14, dt);
      }
    }

    const dx = NPC_POSITION.x - playerPos.x;
    const dz = NPC_POSITION.z - playerPos.z;
    const distance = Math.hypot(dx, dz);

    if (interacting && !moving) {
      playerYaw = dampAngle(playerYaw, Math.atan2(dx, dz), 8, dt);
    }
    player.group.position.x = playerPos.x;
    player.group.position.z = playerPos.z;
    player.group.rotation.y = playerYaw;
    player.update(dt, { moving, reducedMotion });

    // El NPC gira hacia el jugador cuando está cerca
    const npcTarget = distance < NPC_FACE_DISTANCE ? Math.atan2(-dx, -dz) : NPC_DEFAULT_YAW;
    npcYaw = dampAngle(npcYaw, npcTarget, 4, dt);
    npc.group.rotation.y = npcYaw;
    npc.update(dt, { moving: false, reducedMotion });

    // Cámara en tercera persona con seguimiento suave
    wanted.copy(playerPos).add(CAMERA_OFFSET);
    lookWanted.set(playerPos.x, 1.2, playerPos.z);
    const k = 1 - Math.exp(-6 * dt);
    camPos.lerp(wanted, k);
    camLook.lerp(lookWanted, k);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // Ocultar la pared que queda entre la cámara y la sala
    walls.south.visible = camPos.z <= ROOM.halfZ;
    walls.north.visible = camPos.z >= -ROOM.halfZ;
    walls.east.visible = camPos.x <= ROOM.halfX;
    walls.west.visible = camPos.x >= -ROOM.halfX;

    if (onFrame) {
      const aPantalla = (x, y, z) => {
        anchor.set(x, y, z).project(camera);
        return {
          x: (anchor.x * 0.5 + 0.5) * width,
          y: (-anchor.y * 0.5 + 0.5) * height,
          visible: anchor.z < 1,
        };
      };
      onFrame({
        near: distance < NEAR_DISTANCE,
        width,
        height,
        anchor: aPantalla(NPC_POSITION.x, NPC_LABEL_HEIGHT - npc.severity * 0.03, NPC_POSITION.z),
        playerAnchor: aPantalla(playerPos.x, PLAYER_LABEL_HEIGHT, playerPos.z),
      });
    }
  }

  let rafId = 0;
  let last = performance.now();
  let disposed = false;
  const frame = (now) => {
    if (disposed) return;
    rafId = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    renderer.render(scene, camera);
  };
  rafId = requestAnimationFrame(frame);

  return {
    /** Ajusta el lienzo cuando cambia el tamaño de su contenedor. */
    resize,
    /** Severidad de 0 a 5; el NPC la alcanza con una transición suave. */
    setSeverity(value) {
      npc.setSeverity(value);
    },
    /** Bloquea el movimiento (conversación abierta) y limpia las teclas pulsadas. */
    setInteracting(value) {
      interacting = Boolean(value);
      clearKeys();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedQuery.removeEventListener('change', onReducedChange);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) m.dispose();
        }
      });
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
