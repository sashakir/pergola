const fs = require("fs");

const mm = 1 / 1000;

const materials = {
  wood: { name: "warm_wood", kd: [0.58, 0.31, 0.15] },
  darkWood: { name: "end_grain_dark", kd: [0.32, 0.17, 0.08] },
  poly: { name: "clear_polycarbonate", kd: [0.65, 0.9, 1.0], d: 0.35 },
  concrete: { name: "concrete_slab", kd: [0.72, 0.70, 0.66] },
  deck: { name: "terrace_deck", kd: [0.74, 0.56, 0.30] },
  metal: { name: "galvanized_metal", kd: [0.55, 0.57, 0.58] },
};

const obj = [];
let vertexCount = 0;

const roofLength = 6000;
const roofCenterX = -588;
const rafterBottomLength = (6000 - 3 * 145) / 2;
const rafterTopLength = rafterBottomLength + 145 * 2;

function v(x, y, z) {
  return [x * mm, y * mm, z * mm];
}

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function mul(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function norm(a) {
  const len = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / len, a[1] / len, a[2] / len];
}

function addBox(name, centerMm, sizeMm, materialName, axes) {
  const c = v(centerMm[0], centerMm[1], centerMm[2]);
  const sx = sizeMm[0] * mm / 2;
  const sy = sizeMm[1] * mm / 2;
  const sz = sizeMm[2] * mm / 2;
  const ax = axes?.x || [1, 0, 0];
  const ay = axes?.y || [0, 1, 0];
  const az = axes?.z || [0, 0, 1];
  const ux = mul(norm(ax), sx);
  const uy = mul(norm(ay), sy);
  const uz = mul(norm(az), sz);
  const signs = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  obj.push(`o ${name}`);
  obj.push(`usemtl ${materialName}`);
  for (const s of signs) {
    const p = add(add(add(c, mul(ux, s[0])), mul(uy, s[1])), mul(uz, s[2]));
    obj.push(`v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}`);
  }
  const b = vertexCount + 1;
  const faces = [
    [b, b + 1, b + 2, b + 3],
    [b + 4, b + 7, b + 6, b + 5],
    [b, b + 4, b + 5, b + 1],
    [b + 1, b + 5, b + 6, b + 2],
    [b + 2, b + 6, b + 7, b + 3],
    [b + 3, b + 7, b + 4, b],
  ];
  for (const f of faces) obj.push(`f ${f.join(" ")}`);
  vertexCount += 8;
}

function yAtZ(z) {
  // Open/front side z=-1250 is high, closed/back side z=1250 is low.
  return 2500 - 0.08 * z;
}

function addRafter(name, xCenterMm, centerYmm, centerZmm, lengthMm, bottomLengthMm, heightMm, widthMm, materialName) {
  const angle = Math.atan2(200, lengthMm);
  const along = norm([0, -Math.sin(angle), Math.cos(angle)]);
  const up = norm([0, Math.cos(angle), Math.sin(angle)]);
  const xAxis = [1, 0, 0];
  const cut = (lengthMm - bottomLengthMm) / 2;
  const halfW = widthMm / 2;
  const halfH = heightMm / 2;
  const halfL = lengthMm / 2;
  const center = v(xCenterMm, centerYmm, centerZmm);
  const profile = [
    [-halfL + cut, -halfH],
    [halfL - cut, -halfH],
    [halfL, halfH],
    [-halfL, halfH],
  ];
  const verts = [];
  for (const x of [-halfW, halfW]) {
    for (const [z, y] of profile) {
      verts.push(add(add(add(center, mul(xAxis, x * mm)), mul(along, z * mm)), mul(up, y * mm)));
    }
  }

  obj.push(`o ${name}`);
  obj.push(`usemtl ${materialName}`);
  for (const p of verts) obj.push(`v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}`);
  const b = vertexCount + 1;
  const faces = [
    [b, b + 1, b + 2, b + 3],
    [b + 4, b + 7, b + 6, b + 5],
    [b, b + 4, b + 5, b + 1],
    [b + 1, b + 5, b + 6, b + 2],
    [b + 2, b + 6, b + 7, b + 3],
    [b + 3, b + 7, b + 4, b],
  ];
  for (const f of faces) obj.push(`f ${f.join(" ")}`);
  vertexCount += 8;
}

function addLongCutBeam(name, centerXmm, centerYmm, centerZmm, lengthMm, heightMm, widthMm, materialName) {
  const cut = heightMm;
  const halfL = lengthMm / 2;
  const halfH = heightMm / 2;
  const halfW = widthMm / 2;
  const center = v(centerXmm, centerYmm, centerZmm);
  const xAxis = [1, 0, 0];
  const yAxis = [0, 1, 0];
  const zAxis = [0, 0, 1];
  const profile = [
    [-halfL + cut, -halfH],
    [halfL - cut, -halfH],
    [halfL, halfH],
    [-halfL, halfH],
  ];
  const verts = [];
  for (const z of [-halfW, halfW]) {
    for (const [x, y] of profile) {
      verts.push(add(add(add(center, mul(xAxis, x * mm)), mul(yAxis, y * mm)), mul(zAxis, z * mm)));
    }
  }

  obj.push(`o ${name}`);
  obj.push(`usemtl ${materialName}`);
  for (const p of verts) obj.push(`v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}`);
  const b = vertexCount + 1;
  const faces = [
    [b, b + 1, b + 2, b + 3],
    [b + 4, b + 7, b + 6, b + 5],
    [b, b + 4, b + 5, b + 1],
    [b + 1, b + 5, b + 6, b + 2],
    [b + 2, b + 6, b + 7, b + 3],
    [b + 3, b + 7, b + 4, b],
  ];
  for (const f of faces) obj.push(`f ${f.join(" ")}`);
  vertexCount += 8;
}

function clipPolygon(poly, inside, intersect) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const aIn = inside(a);
    const bIn = inside(b);
    if (aIn && bIn) out.push(b);
    else if (aIn && !bIn) out.push(intersect(a, b));
    else if (!aIn && bIn) out.push(intersect(a, b), b);
  }
  return out;
}

function kneeBraceProfile(leg, width) {
  return [
    [0, -leg],
    [0, -leg + width],
    [leg - width, 0],
    [leg, 0],
  ];
}

function cleanPolygon(poly) {
  const cleaned = [];
  for (const p of poly) {
    const last = cleaned[cleaned.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.001) cleaned.push(p);
  }
  if (cleaned.length > 1) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 0.001) cleaned.pop();
  }
  return cleaned;
}

function addKneeBrace(name, cornerX, cornerZ, inwardX, inwardZ, plane, materialName) {
  const leg = 760;
  const width = 190;
  const thickness = 45;
  const beamBottomY = yAtZ(cornerZ) - 145 + (cornerZ > 0 ? 200 : 0);
  const profile = kneeBraceProfile(leg, width);
  const verts = [];
  for (const side of [-thickness / 2, thickness / 2]) {
    for (const [h, v2] of profile) {
      if (plane === "long") {
        verts.push(v(cornerX + inwardX * (70 + h), beamBottomY + v2, cornerZ + side));
      } else {
        verts.push(v(cornerX + side, beamBottomY + v2, cornerZ + inwardZ * (70 + h)));
      }
    }
  }
  obj.push(`o ${name}`);
  obj.push(`usemtl ${materialName}`);
  for (const p of verts) obj.push(`v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}`);
  const b = vertexCount + 1;
  const n = profile.length;
  obj.push(`f ${Array.from({ length: n }, (_, i) => b + i).join(" ")}`);
  obj.push(`f ${Array.from({ length: n }, (_, i) => b + n + (n - 1 - i)).join(" ")}`);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    obj.push(`f ${b + i} ${b + j} ${b + n + j} ${b + n + i}`);
  }
  vertexCount += verts.length;
}

function addSceneGeometry() {
  obj.push("mtllib pergola_final_model.mtl");
  addBox("concrete_slab_2500x6500", [0, -115, 0], [6500, 150, 2500], materials.concrete.name);
  addBox("terrace_deck_surface", [0, 20, 0], [6500, 40, 2500], materials.deck.name);

  const xs = [-3180, -588, 2004];
  const zs = [-1180, 1180];
  for (const x of xs) {
    for (const z of zs) {
      const h = yAtZ(z);
      addBox(`glulam_post_140x140_${x}_${z}`, [x, h / 2, z], [140, h, 140], materials.wood.name);
      addBox(`metal_post_base_${x}_${z}`, [x, 45, z], [190, 50, 190], materials.metal.name);
    }
  }

  // Long side beams, following the roof slope.
  for (const z of zs) {
    addBox(`double_long_beam_outer_${z}`, [roofCenterX, yAtZ(z) - 72, z], [roofLength, 145, 45], materials.wood.name);
  }

  // Rafters across width, sloped to the closed long wall.
  const slopeAxisZ = norm([0, -200, rafterTopLength]);
  const yAxis = norm([0, 1, 0]);
  const leftInnerRafterX = -3180 + 70 + 22.5;
  const rightInnerRafterX = 2004 - 70 - 22.5;
  const rafterXs = [
    roofCenterX - roofLength / 2,
    leftInnerRafterX,
    ...Array.from({ length: 6 }, (_, i) => leftInnerRafterX + (i + 1) * ((rightInnerRafterX - leftInnerRafterX) / 7)),
    rightInnerRafterX,
    roofCenterX + roofLength / 2,
  ];
  for (let i = 0; i < rafterXs.length; i++) {
    const x = rafterXs[i];
    addRafter(`rafter_45x145_${i + 1}`, x, 2500, 0, rafterTopLength, rafterBottomLength, 145, 45, materials.wood.name);
  }

  addBox("clear_polycarbonate_roof", [roofCenterX, 2590, 0], [roofLength, 18, rafterTopLength], materials.poly.name, {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: slopeAxisZ,
  });

  // Long privacy wall: 20x95 boards, 70 mm gaps, nearly from deck to beam.
  for (let i = 0; i < 14; i++) {
    const y = 47.5 + i * 165;
    addBox(`long_privacy_slat_${i + 1}`, [roofCenterX, y, 1110], [5184, 95, 20], materials.wood.name);
  }

  // Short privacy wall at the end without path.
  for (let i = 0; i < 14; i++) {
    const y = 47.5 + i * 165;
    addBox(`short_privacy_slat_${i + 1}`, [-3110, y, 0], [20, 95, 2220], materials.wood.name);
  }

  // Classic 45-degree upper corner braces: two per corner, eight total.
  for (const x of [-3180, 2004]) {
    for (const z of [-1180, 1180]) {
      const inwardX = x < 0 ? 1 : -1;
      const inwardZ = z < 0 ? 1 : -1;
      addKneeBrace(`upper_corner_brace_long_760_${x}_${z}`, x, z, inwardX, inwardZ, "long", materials.wood.name);
      addKneeBrace(`upper_corner_brace_cross_760_${x}_${z}`, x, z, inwardX, inwardZ, "cross", materials.wood.name);
    }
  }
}

function writeMtl() {
  const lines = [];
  for (const m of Object.values(materials)) {
    lines.push(`newmtl ${m.name}`);
    lines.push(`Kd ${m.kd.join(" ")}`);
    lines.push("Ka 0.1 0.1 0.1");
    lines.push("Ks 0.08 0.08 0.08");
    if (m.d) {
      lines.push(`d ${m.d}`);
      lines.push("illum 2");
    }
    lines.push("");
  }
  fs.writeFileSync("pergola_final_model.mtl", lines.join("\n"));
}

function writeHtml() {
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Финальная пергола 6 стоек - балки 6 м</title>
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; font-family: Arial, sans-serif; background: #f6f3ec; }
    #info { position: fixed; left: 16px; top: 16px; background: rgba(255,255,255,.86); padding: 12px 14px; border: 1px solid #ddd; border-radius: 8px; color: #263238; max-width: 360px; }
    #info h1 { margin: 0 0 6px; font-size: 17px; }
    #info p { margin: 4px 0; font-size: 13px; line-height: 1.35; }
    #error { display: none; position: fixed; left: 16px; bottom: 16px; right: 16px; background: #fff3f0; border: 1px solid #c45a44; color: #5a1f14; padding: 12px 14px; border-radius: 8px; font-size: 14px; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.164.1/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.164.1/examples/jsm/"
      }
    }
  </script>
</head>
<body>
<div id="info">
  <h1>Финальный вариант: 6 стоек, балки 6 м</h1>
  <p>6 клееных стоек 140x140, две приватные стенки 20x95 с зазором 70 мм.</p>
  <p>Стропила 45x145: верх ${rafterTopLength} мм, низ ${rafterBottomLength} мм, 2 штуки из доски 6000 мм.</p>
  <p>Прозрачный поликарбонат, уклон назад к длинной закрытой стенке.</p>
  <p>Левая кнопка: сдвиг, колесо/трекпад: вращение, Ctrl+колесо: масштаб.</p>
</div>
<div id="error"></div>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6f3ec);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(5.5, 4.2, 5.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
controls.enableRotate = false;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.update();
renderer.domElement.style.touchAction = "none";

function moveCamera(deltaTheta, deltaPhi, zoomFactor = 1) {
  const target = controls.target;
  const offset = camera.position.clone().sub(target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta += deltaTheta;
  spherical.phi += deltaPhi;
  spherical.radius *= zoomFactor;
  spherical.phi = Math.max(0.18, Math.min(Math.PI - 0.18, spherical.phi));
  spherical.radius = Math.max(1.8, Math.min(18, spherical.radius));
  camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
  camera.lookAt(target);
  controls.update();
}

renderer.domElement.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (event.ctrlKey) {
    moveCamera(0, 0, Math.exp(event.deltaY * 0.0015));
  } else {
    moveCamera(event.deltaX * 0.006, event.deltaY * 0.006);
  }
}, { passive: false });

let lastTouchAngle = null;
let lastTouchDistance = null;

function touchMetrics(event) {
  const a = event.touches[0];
  const b = event.touches[1];
  const dx = b.clientX - a.clientX;
  const dy = b.clientY - a.clientY;
  return {
    angle: Math.atan2(dy, dx),
    distance: Math.hypot(dx, dy),
  };
}

renderer.domElement.addEventListener("touchstart", (event) => {
  if (event.touches.length === 2) {
    event.preventDefault();
    const metrics = touchMetrics(event);
    lastTouchAngle = metrics.angle;
    lastTouchDistance = metrics.distance;
  }
}, { passive: false });

renderer.domElement.addEventListener("touchmove", (event) => {
  if (event.touches.length === 2 && lastTouchAngle !== null && lastTouchDistance !== null) {
    event.preventDefault();
    const metrics = touchMetrics(event);
    const deltaAngle = metrics.angle - lastTouchAngle;
    const zoomFactor = lastTouchDistance / Math.max(20, metrics.distance);
    moveCamera(-deltaAngle, 0, zoomFactor);
    lastTouchAngle = metrics.angle;
    lastTouchDistance = metrics.distance;
  }
}, { passive: false });

renderer.domElement.addEventListener("touchend", (event) => {
  if (event.touches.length < 2) {
    lastTouchAngle = null;
    lastTouchDistance = null;
  }
}, { passive: false });

scene.add(new THREE.HemisphereLight(0xffffff, 0x8d7f6d, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-3, 7, 4);
sun.castShadow = true;
scene.add(sun);

const matWood = new THREE.MeshStandardMaterial({ color: 0x93562f, roughness: 0.55 });
const matDeck = new THREE.MeshStandardMaterial({ color: 0xc49a4c, roughness: 0.7 });
const matConcrete = new THREE.MeshStandardMaterial({ color: 0xb8b4aa, roughness: 0.85 });
const matMetal = new THREE.MeshStandardMaterial({ color: 0x8c9193, roughness: 0.35, metalness: 0.45 });
const matPoly = new THREE.MeshPhysicalMaterial({ color: 0xbdeeff, transparent: true, opacity: 0.35, roughness: 0.08, transmission: 0.25 });
const roofLength = ${roofLength};
const roofCenterX = ${roofCenterX};
const rafterTopLength = ${rafterTopLength};
const rafterBottomLength = ${rafterBottomLength};

function box(name, x, y, z, sx, sy, sz, mat, rotX = 0) {
  const g = new THREE.BoxGeometry(sx / 1000, sy / 1000, sz / 1000);
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.position.set(x / 1000, y / 1000, z / 1000);
  m.rotation.x = rotX;
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function yAtZ(z) { return 2500 - 0.08 * z; }

function clipPolygon2(poly, inside, intersect) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const aIn = inside(a);
    const bIn = inside(b);
    if (aIn && bIn) out.push(b);
    else if (aIn && !bIn) out.push(intersect(a, b));
    else if (!aIn && bIn) out.push(intersect(a, b), b);
  }
  return out;
}

function kneeBraceProfile2(leg, width) {
  return [
    [0, -leg],
    [0, -leg + width],
    [leg - width, 0],
    [leg, 0],
  ];
}

function cleanPolygon2(poly) {
  const cleaned = [];
  for (const p of poly) {
    const last = cleaned[cleaned.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.001) cleaned.push(p);
  }
  if (cleaned.length > 1) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 0.001) cleaned.pop();
  }
  return cleaned;
}

function kneeBrace(name, cornerX, cornerZ, inwardX, inwardZ, plane, mat) {
  const leg = 760;
  const width = 190;
  const thickness = 45;
  const beamBottomY = yAtZ(cornerZ) - 145 + (cornerZ > 0 ? 200 : 0);
  const profile = kneeBraceProfile2(leg, width);
  const verts = [];
  for (const side of [-thickness / 2, thickness / 2]) {
    for (const [h, v] of profile) {
      if (plane === "long") {
        verts.push(new THREE.Vector3((cornerX + inwardX * (70 + h)) / 1000, (beamBottomY + v) / 1000, (cornerZ + side) / 1000));
      } else {
        verts.push(new THREE.Vector3((cornerX + side) / 1000, (beamBottomY + v) / 1000, (cornerZ + inwardZ * (70 + h)) / 1000));
      }
    }
  }
  const n = profile.length;
  const positions = new Float32Array(verts.flatMap((p) => [p.x, p.y, p.z]));
  const indices = [];
  for (let i = 1; i < n - 1; i++) indices.push(0, i, i + 1);
  for (let i = 1; i < n - 1; i++) indices.push(n, n + i + 1, n + i);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(i, j, n + j, i, n + j, n + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function rafter(name, x, y, z, length, bottomLength, height, width, mat) {
  const angle = Math.atan2(200, length);
  const along = new THREE.Vector3(0, -Math.sin(angle), Math.cos(angle)).normalize();
  const up = new THREE.Vector3(0, Math.cos(angle), Math.sin(angle)).normalize();
  const right = new THREE.Vector3(1, 0, 0);
  const center = new THREE.Vector3(x / 1000, y / 1000, z / 1000);
  const halfW = width / 2000;
  const halfH = height / 2000;
  const halfL = length / 2000;
  const cut = (length - bottomLength) / 2000;
  const profile = [
    [-halfL + cut, -halfH],
    [halfL - cut, -halfH],
    [halfL, halfH],
    [-halfL, halfH],
  ];
  const verts = [];
  for (const sx of [-halfW, halfW]) {
    for (const [lz, ly] of profile) {
      verts.push(center.clone().add(right.clone().multiplyScalar(sx)).add(along.clone().multiplyScalar(lz)).add(up.clone().multiplyScalar(ly)));
    }
  }
  const positions = new Float32Array(verts.flatMap((p) => [p.x, p.y, p.z]));
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 7, 6, 4, 6, 5,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function longCutBeam(name, x, y, z, length, height, width, mat) {
  const center = new THREE.Vector3(x / 1000, y / 1000, z / 1000);
  const halfL = length / 2000;
  const halfH = height / 2000;
  const halfW = width / 2000;
  const cut = height / 1000;
  const profile = [
    [-halfL + cut, -halfH],
    [halfL - cut, -halfH],
    [halfL, halfH],
    [-halfL, halfH],
  ];
  const verts = [];
  for (const sz of [-halfW, halfW]) {
    for (const [lx, ly] of profile) {
      verts.push(center.clone().add(new THREE.Vector3(lx, ly, sz)));
    }
  }
  const positions = new Float32Array(verts.flatMap((p) => [p.x, p.y, p.z]));
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 7, 6, 4, 6, 5,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

box("concrete slab", 0, -115, 0, 6500, 150, 2500, matConcrete);
box("terrace deck", 0, 20, 0, 6500, 40, 2500, matDeck);

const xs = [-3180, -588, 2004];
const zs = [-1180, 1180];
for (const x of xs) for (const z of zs) {
  const h = yAtZ(z);
  box("glulam post 140x140", x, h / 2, z, 140, h, 140, matWood);
  box("metal base", x, 45, z, 190, 50, 190, matMetal);
}

for (const z of zs) {
  box("long beam outer", roofCenterX, yAtZ(z) - 72, z, roofLength, 145, 45, matWood);
}

const roofAngle = Math.atan2(200, rafterTopLength);
const leftInnerRafterX = -3180 + 70 + 22.5;
const rightInnerRafterX = 2004 - 70 - 22.5;
const rafterXs = [
  roofCenterX - roofLength / 2,
  leftInnerRafterX,
  ...Array.from({ length: 6 }, (_, i) => leftInnerRafterX + (i + 1) * ((rightInnerRafterX - leftInnerRafterX) / 7)),
  rightInnerRafterX,
  roofCenterX + roofLength / 2,
];
for (let i = 0; i < rafterXs.length; i++) {
  const x = rafterXs[i];
  rafter("rafter", x, 2500, 0, rafterTopLength, rafterBottomLength, 145, 45, matWood);
}
box("clear polycarbonate", roofCenterX, 2590, 0, roofLength, 18, rafterTopLength, matPoly, roofAngle);

for (let i = 0; i < 14; i++) {
  const y = 47.5 + i * 165;
  box("long privacy slat", roofCenterX, y, 1110, 5184, 95, 20, matWood);
  box("short privacy slat", -3110, y, 0, 20, 95, 2220, matWood);
}

for (const x of [-3180, 2004]) {
  for (const z of [-1180, 1180]) {
    const inwardX = x < 0 ? 1 : -1;
    const inwardZ = z < 0 ? 1 : -1;
    kneeBrace("upper corner brace long 760", x, z, inwardX, inwardZ, "long", matWood);
    kneeBrace("upper corner brace cross 760", x, z, inwardX, inwardZ, "cross", matWood);
  }
}

const grid = new THREE.GridHelper(8, 16, 0x777777, 0xd8d1c3);
grid.position.y = -0.195;
scene.add(grid);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
<script>
window.addEventListener("error", (event) => {
  const el = document.getElementById("error");
  el.style.display = "block";
  el.textContent = "3D-сцена не загрузилась: " + event.message + ". Проверь интернет: этот HTML подтягивает Three.js с unpkg.com.";
});
window.addEventListener("unhandledrejection", (event) => {
  const el = document.getElementById("error");
  el.style.display = "block";
  el.textContent = "3D-сцена не загрузилась: " + event.reason + ". Проверь интернет: этот HTML подтягивает Three.js с unpkg.com.";
});
</script>
</body>
</html>`;
  fs.writeFileSync("pergola_final_6posts_6m.html", html);
}

addSceneGeometry();
writeMtl();
fs.writeFileSync("pergola_final_model.obj", obj.join("\n"));
writeHtml();
