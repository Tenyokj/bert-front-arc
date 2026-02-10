"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ParticleTextProps = {
  text?: string;
  width?: number;
  height?: number;
};

function sampleTextPoints(text: string, width: number, height: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [] as THREE.Vector3[];

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.floor(height * 0.9)}px "Sora", sans-serif`;
  ctx.fillText(text, width / 2, height / 2);

  const { data } = ctx.getImageData(0, 0, width, height);
  const points: THREE.Vector3[] = [];
  const step = 3;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha > 20) {
        const nx = (x - width / 2) / width;
        const ny = (height / 2 - y) / height;
        points.push(new THREE.Vector3(nx * 40.2, ny * 4.2, 0));
      }
    }
  }

  return points;
}

function buildRandomPoints(count: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const r = 1 + Math.random() * 0.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pts.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    );
  }
  return pts;
}

export default function ParticleText({ text = "BERT", width = 280, height = 90 }: ParticleTextProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let scene: THREE.Scene | null = new THREE.Scene();
    let camera: THREE.PerspectiveCamera | null = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 11.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mount = mountRef.current;
    if (!mount) return;
    mount.appendChild(renderer.domElement);

    let geometry: THREE.BufferGeometry | null = new THREE.BufferGeometry();
    let material: THREE.PointsMaterial | null = new THREE.PointsMaterial({
      color: new THREE.Color("#38bdf8"),
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    let points: THREE.Points | null = new THREE.Points(geometry, material);
    scene.add(points);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const light = new THREE.PointLight(0x60a5fa, 1.4, 8);
    light.position.set(1.4, 0.4, 2.5);
    scene.add(light);

    let targetPoints: THREE.Vector3[] = [];
    let randomPoints: THREE.Vector3[] = [];
    let delays: Float32Array | null = null;
    let startTime = performance.now();

    const resize = () => {
      if (!mount || !camera) return;
      const { width: w, height: h } = mount.getBoundingClientRect();
      renderer.setSize(w, h);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    };

    const setup = () => {
      targetPoints = sampleTextPoints(text, width, height);
      const count = Math.max(400, targetPoints.length);
      while (targetPoints.length < count) {
        targetPoints.push(targetPoints[targetPoints.length % targetPoints.length].clone());
      }
      randomPoints = buildRandomPoints(count);
      delays = new Float32Array(count);
      for (let i = 0; i < count; i++) delays[i] = Math.random() * 0.35;

      const positionArray = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positionArray[i * 3] = randomPoints[i].x;
        positionArray[i * 3 + 1] = randomPoints[i].y;
        positionArray[i * 3 + 2] = randomPoints[i].z;
      }

      geometry?.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));
      geometry?.computeBoundingSphere();

      resize();
      animate();
    };

    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!geometry || !targetPoints.length) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const assemble = 1.2;
      const hold = 2.0;
      const disperse = 1.2;
      const rest = 1.0;
      const cycle = assemble + hold + disperse + rest;
      const t = elapsed % cycle;

      let from = randomPoints;
      let to = targetPoints;
      let phaseProgress = 0;

      if (t < assemble) {
        from = randomPoints;
        to = targetPoints;
        phaseProgress = t / assemble;
      } else if (t < assemble + hold) {
        from = targetPoints;
        to = targetPoints;
        phaseProgress = 1;
      } else if (t < assemble + hold + disperse) {
        from = targetPoints;
        to = randomPoints;
        phaseProgress = (t - assemble - hold) / disperse;
      } else {
        from = randomPoints;
        to = randomPoints;
        phaseProgress = 1;
      }

      const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const array = positionAttr.array as Float32Array;

      for (let i = 0; i < targetPoints.length; i++) {
        const delay = delays ? delays[i] : 0;
        const local = Math.min(1, Math.max(0, (phaseProgress - delay) / (1 - delay)));
        const eased = easeInOut(local);
        const fx = THREE.MathUtils.lerp(from[i].x, to[i].x, eased);
        const fy = THREE.MathUtils.lerp(from[i].y, to[i].y, eased);
        const fz = THREE.MathUtils.lerp(from[i].z, to[i].z, eased);
        array[i * 3] = fx;
        array[i * 3 + 1] = fy;
        array[i * 3 + 2] = fz;
      }

      positionAttr.needsUpdate = true;

      renderer.render(scene!, camera!);
    };

    setup();
    window.addEventListener("resize", resize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      geometry?.dispose();
      material?.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      scene = null;
      camera = null;
      geometry = null;
      material = null;
      points = null;
    };
  }, [text, width, height]);

  return <div ref={mountRef} style={{ width, height }} />;
}
