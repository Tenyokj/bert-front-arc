"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./attractor.module.css";

const trajectory = `
  uniform float uTime;
  attribute vec3 aFlow;
  varying vec3 vColor;
  varying float vAlpha;
  vec3 flowPosition() {
    float t = fract(uTime * (0.055 + aFlow.x * 0.025) + aFlow.x - aFlow.z * 0.005);
    float r = mix(5.2, 0.8, pow(t, 0.75));
    float a = aFlow.y + t * 7.8 + uTime * 0.045;
    vColor = mix(vec3(0.20,0.57,1.0), vec3(0.70,0.38,1.0), aFlow.x);
    vColor = mix(vColor, vec3(1.0,0.45,0.62), pow(aFlow.x, 5.0));
    vAlpha = smoothstep(0.0,0.15,t) * (1.0 - smoothstep(0.85,1.0,t)) * (1.0 - aFlow.z / 19.0);
    return vec3(cos(a)*r, sin(a)*r, sin(a*2.0 + aFlow.x*8.0)*0.12*r);
  }
`;

export default function PoolAttractorCanvas({ paused }: { paused: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controller = useRef<((value: boolean) => void) | null>(null);
  const [state, setState] = useState("loading");
  useEffect(() => { controller.current?.(paused); }, [paused]);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { setState("fallback"); return; }
    let disposed = false;
    let frame = 0;
    let visible = false;
    let manuallyPaused = paused;
    let contextLost = false;
    let elapsed = 0;
    let last = 0;
    let pointerX = 0, pointerY = 0;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 1.3, 9.5); camera.lookAt(0, 0, 0);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.75));
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);
    const disk = new THREE.Group(); disk.rotation.x = -.45; disk.rotation.z = -.22; scene.add(disk);
    const uniform = { uTime: { value: 4.5 } };
    const segments = 18, trails = 110;
    const flows = new Float32Array(trails * segments * 2 * 3);
    for (let trail = 0; trail < trails; trail++) for (let segment = 0; segment < segments; segment++) for (let end = 0; end < 2; end++) {
      const offset = ((trail * segments + segment) * 2 + end) * 3;
      flows[offset] = (trail * 0.61803398875) % 1;
      flows[offset + 1] = (trail % 11) / 11 * Math.PI * 2;
      flows[offset + 2] = segment + end;
    }
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(flows.length), 3));
    trailGeometry.setAttribute("aFlow", new THREE.BufferAttribute(flows, 3));
    const trailMaterial = new THREE.ShaderMaterial({ uniforms: uniform, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `${trajectory} void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(flowPosition(),1.0); }`,
      fragmentShader: "varying vec3 vColor; varying float vAlpha; void main(){gl_FragColor=vec4(vColor,vAlpha*0.46);}",
    });
    const ribbons = new THREE.LineSegments(trailGeometry, trailMaterial); ribbons.frustumCulled = false; disk.add(ribbons);
    const heads = new Float32Array(trails * 3);
    for (let i = 0; i < trails; i++) { heads[i * 3] = (i * .61803398875) % 1; heads[i * 3 + 1] = (i % 11) / 11 * Math.PI * 2; }
    const headGeometry = new THREE.BufferGeometry(); headGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(heads.length), 3)); headGeometry.setAttribute("aFlow", new THREE.BufferAttribute(heads, 3));
    const headMaterial = new THREE.ShaderMaterial({ uniforms: uniform, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `${trajectory} void main(){vec4 p=modelViewMatrix*vec4(flowPosition(),1.0);gl_Position=projectionMatrix*p;gl_PointSize=4.0*(8.0/-p.z);}`,
      fragmentShader: "varying vec3 vColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-0.5);gl_FragColor=vec4(vColor,(1.0-smoothstep(0.08,0.5,d))*vAlpha);}",
    });
    const particles = new THREE.Points(headGeometry, headMaterial); particles.frustumCulled = false; disk.add(particles);
    const coreGeometry = new THREE.SphereGeometry(.76, 40, 28);
    const coreMaterial = new THREE.ShaderMaterial({ uniforms: uniform,
      vertexShader: "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader: "uniform float uTime;varying vec3 n;varying vec3 v;void main(){float f=pow(1.0-max(dot(n,v),0.0),2.4);vec3 glow=mix(vec3(0.25,0.46,1.0),vec3(0.75,0.36,1.0),sin(uTime*.2)*.5+.5);gl_FragColor=vec4(vec3(0.025,0.035,0.085)+glow*f*1.8,1.0);}",
    });
    scene.add(new THREE.Mesh(coreGeometry, coreMaterial));
    const ringGeometry = new THREE.TorusGeometry(1.02, .012, 8, 160);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x9d9aff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.rotation.x = .8; ring.rotation.y = -.3; scene.add(ring);
    const haloGeometry = new THREE.PlaneGeometry(5.5, 5.5);
    const haloMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec2 vUv;void main(){float d=length(vUv-.5);float a=exp(-d*d*34.0)*.23;gl_FragColor=vec4(mix(vec3(.2,.37,1.),vec3(.65,.2,.9),vUv.x),a);}",
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial); halo.position.z = -.9; scene.add(halo);
    function render() {
      if (disposed || contextLost) return;
      disk.rotation.y += (pointerX * .10 - disk.rotation.y) * .04;
      camera.position.y += (1.3 + pointerY * .2 - camera.position.y) * .04;
      camera.lookAt(0, 0, 0);
      uniform.uTime.value = elapsed + 4.5;
      renderer.render(scene, camera);
      mount!.dataset.frame = String(Math.round(elapsed * 100));
    }
    function animate(now: number) {
      frame = 0;
      if (disposed || contextLost || !visible || document.hidden || manuallyPaused || media.matches) return;
      if (!last || now - last >= 1000 / 30) { elapsed += last ? Math.min((now - last) / 1000, .08) : 0; last = now; render(); }
      frame = requestAnimationFrame(animate);
    }
    function reconcile() {
      if (frame) cancelAnimationFrame(frame); frame = 0; last = 0;
      const stopped = manuallyPaused || media.matches;
      setState(contextLost ? "fallback" : stopped ? "paused" : "running");
      render();
      if (!disposed && !contextLost && visible && !document.hidden && !stopped) frame = requestAnimationFrame(animate);
    }
    controller.current = (value) => { manuallyPaused = value; reconcile(); };
    const resize = new ResizeObserver(() => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    }); resize.observe(mount);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reconcile(); }, { rootMargin: "50px" }); visibility.observe(mount);
    const pointer = (event: PointerEvent) => { const box = mount.getBoundingClientRect(); pointerX = (event.clientX - box.left) / box.width - .5; pointerY = (event.clientY - box.top) / box.height - .5; };
    const leave = () => { pointerX = 0; pointerY = 0; };
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; reconcile(); };
    mount.addEventListener("pointermove", pointer, { passive: true }); mount.addEventListener("pointerleave", leave);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", reconcile); media.addEventListener("change", reconcile);
    reconcile();
    return () => {
      disposed = true; controller.current = null; if (frame) cancelAnimationFrame(frame);
      resize.disconnect(); visibility.disconnect(); document.removeEventListener("visibilitychange", reconcile); media.removeEventListener("change", reconcile);
      mount.removeEventListener("pointermove", pointer); mount.removeEventListener("pointerleave", leave); renderer.domElement.removeEventListener("webglcontextlost", lost);
      for (const resource of [trailGeometry, trailMaterial, headGeometry, headMaterial, coreGeometry, coreMaterial, ringGeometry, ringMaterial, haloGeometry, haloMaterial]) resource.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
    // The renderer lives for one mount; the controller effect handles the pause button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={mountRef} className={styles.canvas} data-attractor-state={state}>{state === "fallback" && <div className={styles.fallback} />}</div>;
}
