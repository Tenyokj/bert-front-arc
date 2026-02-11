"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const RING_POINTS = 3000;
const FLOW_POINTS = 1700;

type FlowState = {
  start: THREE.Vector3;
  target: THREE.Vector3;
  t: number;
  speed: number;
};

function createPixelTexture() {
  const size = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function FundingPoolHero() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.imageRendering = "pixelated";
    const pixelTexture = createPixelTexture();

    scene.add(new THREE.AmbientLight(0xffffff, 0.74));
    const key = new THREE.PointLight(0x22d3ee, 1.2, 15);
    key.position.set(0, 1.2, 4.5);
    scene.add(key);
    const warm = new THREE.PointLight(0xfacc15, 0.95, 15);
    warm.position.set(0, -1.4, 4.2);
    scene.add(warm);

    const ringGeometry = new THREE.BufferGeometry();
    const ringPos = new Float32Array(RING_POINTS * 3);
    const ringBase = new Float32Array(RING_POINTS * 3);
    const ringColor = new Float32Array(RING_POINTS * 3);
    const c1 = new THREE.Color("#facc15");
    const c2 = new THREE.Color("#16a34a");

    for (let i = 0; i < RING_POINTS; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 1.25;
      const jitter = (Math.random() - 0.5) * 0.12;
      const x = Math.cos(theta) * radius + jitter;
      const y = Math.sin(theta) * radius + jitter;
      const z = (Math.random() - 0.5) * 0.5;

      ringPos[i * 3] = x;
      ringPos[i * 3 + 1] = y;
      ringPos[i * 3 + 2] = z;
      ringBase[i * 3] = x;
      ringBase[i * 3 + 1] = y;
      ringBase[i * 3 + 2] = z;

      const color = i % 4 === 0 ? c2 : c1;
      ringColor[i * 3] = color.r;
      ringColor[i * 3 + 1] = color.g;
      ringColor[i * 3 + 2] = color.b;
    }

    ringGeometry.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
    ringGeometry.setAttribute("color", new THREE.BufferAttribute(ringColor, 3));
    const ringMaterial = new THREE.PointsMaterial({
      size: 1.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 1,
      depthWrite: true,
      vertexColors: true,
      blending: THREE.NormalBlending,
      map: pixelTexture,
      alphaTest: 0.9,
    });
    const ringPoints = new THREE.Points(ringGeometry, ringMaterial);
    scene.add(ringPoints);

    const coreGeometry = new THREE.BufferGeometry();
    const coreCount = 900;
    const corePos = new Float32Array(coreCount * 3);
    const coreCol = new Float32Array(coreCount * 3);
    for (let i = 0; i < coreCount; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.72;
      corePos[i * 3] = Math.cos(t) * r;
      corePos[i * 3 + 1] = Math.sin(t) * r;
      corePos[i * 3 + 2] = (Math.random() - 0.5) * 0.28;
      const cc = i % 3 === 0 ? c2 : c1;
      coreCol[i * 3] = cc.r;
      coreCol[i * 3 + 1] = cc.g;
      coreCol[i * 3 + 2] = cc.b;
    }
    coreGeometry.setAttribute("position", new THREE.BufferAttribute(corePos, 3));
    coreGeometry.setAttribute("color", new THREE.BufferAttribute(coreCol, 3));
    const coreMaterial = new THREE.PointsMaterial({
      size: 0.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 1,
      depthWrite: true,
      vertexColors: true,
      blending: THREE.NormalBlending,
      map: pixelTexture,
      alphaTest: 0.9,
    });
    const corePoints = new THREE.Points(coreGeometry, coreMaterial);
    scene.add(corePoints);

    const flowGeometry = new THREE.BufferGeometry();
    const flowPos = new Float32Array(FLOW_POINTS * 3);
    const flowCol = new Float32Array(FLOW_POINTS * 3);
    const flowStates: FlowState[] = [];
    for (let i = 0; i < FLOW_POINTS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const start = new THREE.Vector3(side * (4.7 + Math.random() * 2.2), (Math.random() - 0.5) * 4.5, -1.6 + Math.random() * 0.8);
      const target = new THREE.Vector3((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.3, -0.2 + Math.random() * 0.3);
      flowStates.push({ start, target, t: Math.random(), speed: 0.004 + Math.random() * 0.0065 });
      flowPos[i * 3] = start.x;
      flowPos[i * 3 + 1] = start.y;
      flowPos[i * 3 + 2] = start.z;
      const fc = i % 3 === 0 ? c2 : c1;
      flowCol[i * 3] = fc.r;
      flowCol[i * 3 + 1] = fc.g;
      flowCol[i * 3 + 2] = fc.b;
    }
    flowGeometry.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
    flowGeometry.setAttribute("color", new THREE.BufferAttribute(flowCol, 3));
    const flowMaterial = new THREE.PointsMaterial({
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 1,
      depthWrite: true,
      vertexColors: true,
      blending: THREE.NormalBlending,
      map: pixelTexture,
      alphaTest: 0.9,
    });
    const flowPoints = new THREE.Points(flowGeometry, flowMaterial);
    scene.add(flowPoints);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      const ringAttr = ringGeometry.getAttribute("position") as THREE.BufferAttribute;
      const ringArr = ringAttr.array as Float32Array;
      for (let i = 0; i < RING_POINTS; i++) {
        const idx = i * 3;
        const bx = ringBase[idx];
        const by = ringBase[idx + 1];
        ringArr[idx] = bx + Math.sin(t * 0.7 + by) * 0.015;
        ringArr[idx + 1] = by + Math.cos(t * 0.55 + bx) * 0.015;
        ringArr[idx + 2] = ringBase[idx + 2];
      }
      ringAttr.needsUpdate = true;

      const flowAttr = flowGeometry.getAttribute("position") as THREE.BufferAttribute;
      const flowArr = flowAttr.array as Float32Array;
      for (let i = 0; i < FLOW_POINTS; i++) {
        const f = flowStates[i];
        f.t += f.speed;
        if (f.t >= 1) {
          const side = Math.random() > 0.5 ? -1 : 1;
          f.start.set(side * (4.7 + Math.random() * 2.2), (Math.random() - 0.5) * 4.5, -1.6 + Math.random() * 0.8);
          f.target.set((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.3, -0.2 + Math.random() * 0.3);
          f.t = 0;
          f.speed = 0.004 + Math.random() * 0.0065;
        }
        const ease = 1 - Math.pow(1 - f.t, 3);
        // Quantize positions a bit to preserve a crisp pixel-particle look.
        flowArr[i * 3] = Math.round(THREE.MathUtils.lerp(f.start.x, f.target.x, ease) * 180) / 180;
        flowArr[i * 3 + 1] = Math.round(THREE.MathUtils.lerp(f.start.y, f.target.y, ease) * 180) / 180;
        flowArr[i * 3 + 2] = Math.round(THREE.MathUtils.lerp(f.start.z, f.target.z, ease) * 180) / 180;
      }
      flowAttr.needsUpdate = true;

      ringPoints.rotation.z += 0.0008;
      corePoints.rotation.z -= 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      flowGeometry.dispose();
      flowMaterial.dispose();
      pixelTexture?.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section className="relative min-h-[78vh] overflow-hidden rounded-3xl border border-white/10 bg-[#2a2d3b]">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="relative z-10 flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-100">Funding Pool</p>
        <h1 className="mt-4 font-[var(--font-display)] text-5xl leading-none text-white drop-shadow-[0_0_24px_rgba(56,189,248,0.42)] md:text-8xl">
          184,500,000 BTK
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-100/90 md:text-lg">Total balance currently available for DAO grant distribution.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400">
            Deposit
          </button>
          <button className="rounded-lg border border-white/35 bg-black/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-cyan-300/70">
            View Pool Activity
          </button>
        </div>
      </div>
    </section>
  );
}
