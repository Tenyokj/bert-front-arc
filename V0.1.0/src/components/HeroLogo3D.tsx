"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CYCLE_DURATION = 13; // seconds
const ASSEMBLE_DURATION = 1.3;
const HOLD_DURATION = 5.0;
const MORPH_DURATION = 1.3;
const DISPERSE_DURATION = 0.4;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function sampleImagePoints(
  img: HTMLImageElement,
  opts: { step: number; threshold: number; scale: number }
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx)
    return {
      points: [] as THREE.Vector3[],
      colors: [] as THREE.Color[],
    };

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const points: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const step = opts.step;
  const scale = opts.scale;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha > opts.threshold) {
        const nx = (x - width / 2) / width;
        const ny = (height / 2 - y) / height;
        points.push(new THREE.Vector3(nx * scale, ny * scale, 0));

        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const base = new THREE.Color("#3b82f6");
        const accent = new THREE.Color("#ef4444");
        const useAccent = r > b && r > g * 0.9;
        colors.push(useAccent ? accent.clone() : base.clone());
      }
    }
  }

  return { points, colors };
}

function toArray(points: THREE.Vector3[], count: number) {
  if (points.length === count) return points;
  const result: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    result.push(points[i % points.length].clone());
  }
  return result;
}

function toColorArray(colors: THREE.Color[], count: number) {
  if (colors.length === count) return colors;
  const result: THREE.Color[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length].clone());
  }
  return result;
}

function centerPoints(points: THREE.Vector3[]) {
  const center = new THREE.Vector3();
  for (const p of points) center.add(p);
  center.multiplyScalar(1 / points.length);
  for (const p of points) p.sub(center);
  return points;
}

function buildRandomPoints(count: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const r = 0.9 + Math.random() * 0.5;
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

export default function HeroLogo3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let scene: THREE.Scene | null = new THREE.Scene();
    let camera: THREE.PerspectiveCamera | null = new THREE.PerspectiveCamera(
      50,
      1,
      0.1,
      100
    );
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const mount = mountRef.current;
    if (!mount) return;
    mount.appendChild(renderer.domElement);

    let geometry: THREE.BufferGeometry | null = new THREE.BufferGeometry();
    let material: THREE.PointsMaterial | null = new THREE.PointsMaterial({
      color: new THREE.Color("#e2e8f0"),
      size: 0.02,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    let points: THREE.Points | null = new THREE.Points(geometry, material);
    scene.add(points);

    const glowLight = new THREE.PointLight(0x38bdf8, 1.2, 8);
    glowLight.position.set(1.2, 1.2, 2.5);
    scene.add(glowLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    let positionsA: THREE.Vector3[] = [];
    let positionsB: THREE.Vector3[] = [];
    let colorsA: THREE.Color[] = [];
    let colorsB: THREE.Color[] = [];
    let randomPositions: THREE.Vector3[] = [];
    let delays: Float32Array | null = null;
    let startTime = performance.now();

    const resize = () => {
      if (!mount || !camera) return;
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
    };

    const setup = async () => {
      const [bertImg, btkImg] = await Promise.all([
        loadImage("/bert-logo.png"),
        loadImage("/btk-logo.png"),
      ]);

      const ptsA = sampleImagePoints(bertImg, {
        step: 2,
        threshold: 30,
        scale: 6.3,
      });
      const ptsB = sampleImagePoints(btkImg, {
        step: 4,
        threshold: 30,
        scale: 6.3,
      });

      const count = Math.max(ptsA.points.length, ptsB.points.length);
      positionsA = centerPoints(toArray(ptsA.points, count));
      positionsB = centerPoints(toArray(ptsB.points, count));
      colorsA = toColorArray(ptsA.colors, count);
      colorsB = toColorArray(ptsB.colors, count);
      randomPositions = centerPoints(buildRandomPoints(count));
      delays = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        delays[i] = Math.random() * 0.35;
      }

      const positionArray = new Float32Array(count * 3);
      const colorArray = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positionArray[i * 3] = randomPositions[i].x;
        positionArray[i * 3 + 1] = randomPositions[i].y;
        positionArray[i * 3 + 2] = randomPositions[i].z;

        colorArray[i * 3] = colorsA[i].r;
        colorArray[i * 3 + 1] = colorsA[i].g;
        colorArray[i * 3 + 2] = colorsA[i].b;
      }

      geometry?.setAttribute(
        "position",
        new THREE.BufferAttribute(positionArray, 3)
      );
      geometry?.setAttribute(
        "color",
        new THREE.BufferAttribute(colorArray, 3)
      );
      geometry?.computeBoundingSphere();

      resize();
      animate();
    };

    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!geometry || !positionsA.length || !positionsB.length) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const t = elapsed % CYCLE_DURATION;

      let from: THREE.Vector3[] = randomPositions;
      let to: THREE.Vector3[] = positionsA;
      let phaseProgress = 0;
      let size = 0.02;
      let color = new THREE.Color("#60a5fa");

      if (t < ASSEMBLE_DURATION) {
        from = randomPositions;
        to = positionsA;
        phaseProgress = t / ASSEMBLE_DURATION;
        size = 0.024;
      } else if (t < ASSEMBLE_DURATION + HOLD_DURATION) {
        from = positionsA;
        to = positionsA;
        phaseProgress = 1;
        size = 0.02;
        color = new THREE.Color("#38bdf8");
      } else if (t < ASSEMBLE_DURATION + HOLD_DURATION + MORPH_DURATION) {
        from = positionsA;
        to = positionsB;
        phaseProgress =
          (t - ASSEMBLE_DURATION - HOLD_DURATION) / MORPH_DURATION;
        size = 0.022;
        color = new THREE.Color("#f43f5e");
      } else if (
        t <
        ASSEMBLE_DURATION + HOLD_DURATION + MORPH_DURATION + HOLD_DURATION
      ) {
        from = positionsB;
        to = positionsB;
        phaseProgress = 1;
        size = 0.02;
        color = new THREE.Color("#fb7185");
      } else {
        from = positionsB;
        to = randomPositions;
        phaseProgress =
          (t -
            (ASSEMBLE_DURATION + HOLD_DURATION + MORPH_DURATION + HOLD_DURATION)) /
          DISPERSE_DURATION;
        size = 0.018;
        color = new THREE.Color("#e2e8f0");
      }

      const positionAttr =
        geometry.getAttribute("position") as THREE.BufferAttribute;
      const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
      const array = positionAttr.array as Float32Array;
      const colorArray = colorAttr.array as Float32Array;

      for (let i = 0; i < positionsA.length; i++) {
        const delay = delays ? delays[i] : 0;
        const local = Math.min(1, Math.max(0, (phaseProgress - delay) / (1 - delay)));
        const eased = easeInOut(local);
        const fx = THREE.MathUtils.lerp(from[i].x, to[i].x, eased);
        const fy = THREE.MathUtils.lerp(from[i].y, to[i].y, eased);
        const fz = THREE.MathUtils.lerp(from[i].z, to[i].z, eased);
        array[i * 3] = fx;
        array[i * 3 + 1] = fy;
        array[i * 3 + 2] = fz;

        const fromColor =
          from === positionsA ? colorsA[i] : from === positionsB ? colorsB[i] : new THREE.Color("#cbd5f5");
        const toColor =
          to === positionsA ? colorsA[i] : to === positionsB ? colorsB[i] : new THREE.Color("#cbd5f5");
        const cr = THREE.MathUtils.lerp(fromColor.r, toColor.r, eased);
        const cg = THREE.MathUtils.lerp(fromColor.g, toColor.g, eased);
        const cb = THREE.MathUtils.lerp(fromColor.b, toColor.b, eased);
        colorArray[i * 3] = cr;
        colorArray[i * 3 + 1] = cg;
        colorArray[i * 3 + 2] = cb;
      }

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      material!.size = size;
      material!.color = color;

      if (points) {
        points.rotation.y += 0.003;
        points.rotation.x = 0;
      }

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
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),transparent_60%)] blur-2xl" />
      <div
        ref={mountRef}
        className="h-[60vw] w-[60vw] max-h-[900px] max-w-[900px] min-h-[520px] min-w-[520px]"
      />
    </div>
  );
}
