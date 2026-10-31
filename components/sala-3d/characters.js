import * as THREE from 'three';

// Personajes humanoides hechos solo con primitivas de three.js.
// Los modelos miran hacia +Z cuando rotation.y vale 0.

const material = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02 });

function boxMesh(w, h, d, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Medidas base (unidades ~ metros)
const HIP_Y = 0.8;
const TORSO_H = 0.6;
const SHOULDER_Y = 0.52;
const SHOULDER_X = 0.35;
const NECK_Y = 0.6;
const ARM_LEN = 0.58;
const LEG_LEN = 0.8;
export const CHARACTER_HEIGHT = 1.78;

export class Humanoid {
  /**
   * @param {{ skin: number, shirt: number, pants: number, hair: number, shoes?: number }} colors
   */
  constructor({ skin, shirt, pants, hair, shoes = 0x2a2a2e }) {
    const skinMat = material(skin);
    const shirtMat = material(shirt);
    const pantsMat = material(pants);
    const hairMat = material(hair);
    const shoeMat = material(shoes);
    const eyeMat = material(0x14161a);

    this.group = new THREE.Group();

    // Torso (pivote en la cadera para poder inclinarlo)
    this.torsoPivot = new THREE.Group();
    this.torsoPivot.position.y = HIP_Y;
    this.torso = boxMesh(0.52, TORSO_H, 0.28, shirtMat);
    this.torso.position.y = TORSO_H / 2;
    this.torsoPivot.add(this.torso);

    // Cabeza
    this.headPivot = new THREE.Group();
    this.headPivot.position.y = NECK_Y;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), skinMat);
    head.scale.set(1, 1.1, 1);
    head.position.y = 0.18;
    head.castShadow = true;
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hairCap.scale.set(1, 1.1, 1.02);
    hairCap.position.set(0, 0.2, -0.01);
    hairCap.castShadow = true;
    const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.06, 0.2, 0.145);
    eyeR.position.set(0.06, 0.2, 0.145);
    this.headPivot.add(head, hairCap, eyeL, eyeR);
    this.torsoPivot.add(this.headPivot);

    // Brazos (pivote en el hombro)
    this.armL = this.#makeArm(skinMat, shirtMat, -1);
    this.armR = this.#makeArm(skinMat, shirtMat, 1);
    this.torsoPivot.add(this.armL, this.armR);

    // Piernas (pivote en la cadera)
    this.legL = this.#makeLeg(pantsMat, shoeMat, -1);
    this.legR = this.#makeLeg(pantsMat, shoeMat, 1);

    this.group.add(this.torsoPivot, this.legL, this.legR);

    // Estado de animación
    this.walkPhase = 0;
    this.walkBlend = 0;
    this.breathPhase = Math.random() * Math.PI * 2;
    this.severity = 0; // valor mostrado (suavizado), 0 a 5
    this.severityTarget = 0;
  }

  #makeArm(skinMat, shirtMat, side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * SHOULDER_X, SHOULDER_Y, 0);
    const sleeve = boxMesh(0.15, ARM_LEN * 0.55, 0.17, shirtMat);
    sleeve.position.y = -ARM_LEN * 0.275;
    const forearm = boxMesh(0.13, ARM_LEN * 0.45, 0.15, skinMat);
    forearm.position.y = -ARM_LEN * 0.775;
    pivot.add(sleeve, forearm);
    return pivot;
  }

  #makeLeg(pantsMat, shoeMat, side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.14, HIP_Y, 0);
    const leg = boxMesh(0.2, LEG_LEN - 0.06, 0.22, pantsMat);
    leg.position.y = -(LEG_LEN - 0.06) / 2;
    const shoe = boxMesh(0.21, 0.07, 0.31, shoeMat);
    shoe.position.set(0, -LEG_LEN + 0.035, 0.04);
    pivot.add(leg, shoe);
    return pivot;
  }

  /** Severidad objetivo de 0 a 5; la mostrada se interpola en update(). */
  setSeverity(value) {
    this.severityTarget = Math.min(5, Math.max(0, Number.isFinite(value) ? value : 0));
  }

  /**
   * @param {number} dt segundos
   * @param {{ moving?: boolean, reducedMotion?: boolean }} [state]
   */
  update(dt, { moving = false, reducedMotion = false } = {}) {
    this.severity = damp(this.severity, this.severityTarget, 2.5, dt);
    const s = clamp01(this.severity / 5);
    const motion = reducedMotion ? 0.3 : 1;

    // Caminar: balanceo de brazos y piernas
    this.walkBlend = damp(this.walkBlend, moving ? 1 : 0, 10, dt);
    if (moving) this.walkPhase += dt * 9;
    const swing = Math.sin(this.walkPhase) * 0.75 * this.walkBlend * motion;

    // Respiración: más rápida y algo más marcada con severidad alta
    const breathHz = 0.22 + 0.5 * s;
    this.breathPhase += dt * Math.PI * 2 * breathHz;
    const breath = Math.sin(this.breathPhase) * (0.012 + 0.012 * s) * motion;

    // Postura según severidad: cabeza más baja, hombros encogidos, ligera encorvadura
    const armBase = -0.14 * s;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = armBase - swing * 0.9;
    this.armR.rotation.x = armBase + swing * 0.9;
    this.armL.rotation.z = 0.04 + 0.1 * s;
    this.armR.rotation.z = -(0.04 + 0.1 * s);
    const shoulderUp = 0.05 * s + breath * 1.5;
    const shoulderX = SHOULDER_X - 0.035 * s;
    this.armL.position.set(-shoulderX, SHOULDER_Y + shoulderUp, 0);
    this.armR.position.set(shoulderX, SHOULDER_Y + shoulderUp, 0);

    this.torsoPivot.rotation.x = 0.12 * s;
    this.torso.scale.set(1 + breath * 0.8, 1 + breath * 1.6, 1 + breath * 0.8);
    this.headPivot.position.y = NECK_Y - 0.075 * s + breath * 1.2;
    this.headPivot.rotation.x = 0.38 * s;

    // Pequeño rebote vertical al caminar
    this.group.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.035 * this.walkBlend * motion;
  }
}

export function createPlayerCharacter() {
  return new Humanoid({ skin: 0xe0ac8a, shirt: 0x2f7bd0, pants: 0x2b3345, hair: 0x2b1d14 });
}

export function createNpcCharacter() {
  return new Humanoid({ skin: 0xc68a63, shirt: 0xc2503f, pants: 0x4a4a52, hair: 0xd8d2c4, shoes: 0x3a2a20 });
}
