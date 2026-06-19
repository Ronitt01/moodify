"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * GalaxyField — a GPU-driven particle galaxy used as the hero backdrop.
 *
 * "Your music universe." A spiral disc of ~26k points where ALL motion
 * (rotation, bob, cursor-repulsion) happens in the vertex shader, so the
 * CPU stays idle and it holds 60fps. The cursor parts the disc — a real
 * world-space repulsion void, like the reference.
 *
 * Pro-hygiene: capped DPR, IntersectionObserver + tab-visibility pausing,
 * prefers-reduced-motion static fallback, ResizeObserver, and full disposal
 * of geometry / material / renderer on unmount.
 */
export function GalaxyField({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    // ---- Renderer -----------------------------------------------------------
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // WebGL unavailable — bail silently; the CSS glow underneath remains.
      return;
    }

    const getSize = () => ({
      w: mount.clientWidth || window.innerWidth,
      h: mount.clientHeight || window.innerHeight,
    });

    let { w, h } = getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0); // transparent — page ink shows through
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    // ---- Scene / camera -----------------------------------------------------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 100);
    camera.position.set(0, 2.7, 4.3);
    camera.lookAt(0, -0.25, 0);

    // ---- Galaxy generation (CPU, once) -------------------------------------
    const COUNT = isCoarse || w < 720 ? 13000 : 26000;
    const RADIUS = 5.2;
    const BRANCHES = 5;
    const RANDOMNESS = 0.55;
    const RAND_POWER = 2.7;

    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT); // per-particle phase
    const radii = new Float32Array(COUNT); // normalized distance for shader spin

    const inside = new THREE.Color("#dcd3ff"); // lavender-white core
    const outside = new THREE.Color("#6C5CE7"); // electric periwinkle arms
    const ember = new THREE.Color("#ff9d5c"); // warm gold stardust

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.6) * RADIUS; // denser core
      const branch = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
      const spin = r * 0.86;

      const rand = (axis: number) =>
        Math.pow(Math.random(), RAND_POWER) *
        (Math.random() < 0.5 ? 1 : -1) *
        RANDOMNESS *
        (axis === 1 ? 0.45 : 1) * // thin disc on Y
        (r + 0.25);

      positions[i3] = Math.cos(branch + spin) * r + rand(0);
      positions[i3 + 1] = rand(1) * 0.6;
      positions[i3 + 2] = Math.sin(branch + spin) * r + rand(2);

      // Color: lerp core→arm by radius, sprinkle warm gold flecks.
      const mixed = inside.clone().lerp(outside, Math.min(r / RADIUS, 1));
      if (Math.random() < 0.09) mixed.lerp(ember, 0.55);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;

      // Brighter, larger points near the core for the white nucleus.
      const coreBoost = 1 - Math.min(r / RADIUS, 1);
      scales[i] = 0.35 + Math.random() * 1.0 + coreBoost * 1.4;
      seeds[i] = Math.random() * Math.PI * 2;
      radii[i] = Math.min(r / RADIUS, 1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));

    // ---- Shader material ----------------------------------------------------
    const uniforms = {
      uTime: { value: 0 },
      uSize: { value: 26 * dpr },
      uRepel: { value: new THREE.Vector3(999, 999, 999) },
      uRepelRadius: { value: 1.25 },
      uRepelStrength: { value: 1.15 },
      uOpacity: { value: 0 }, // fade-in on mount
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uSize;
        uniform vec3  uRepel;
        uniform float uRepelRadius;
        uniform float uRepelStrength;

        attribute vec3  aColor;
        attribute float aScale;
        attribute float aSeed;
        attribute float aRadius;

        varying vec3  vColor;
        varying float vCore;

        void main() {
          vec3 pos = position;

          // Differential rotation — inner ring spins faster (Keplerian feel).
          float speed = 0.06 + (1.0 - aRadius) * 0.20;
          float a = uTime * speed;
          float s = sin(a);
          float c = cos(a);
          pos.xz = mat2(c, -s, s, c) * pos.xz;

          // Gentle vertical shimmer.
          pos.y += sin(uTime * 0.6 + aSeed) * 0.04;

          // Cursor repulsion in world space — particles part around the pointer.
          vec2 toCursor = pos.xz - uRepel.xz;
          float d = length(toCursor);
          float push = smoothstep(uRepelRadius, 0.0, d) * uRepelStrength;
          pos.xz += normalize(toCursor + 1e-4) * push;
          pos.y  += push * 0.35;

          vColor = aColor;
          vCore = 1.0 - aRadius;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Perspective size attenuation.
          gl_PointSize = uSize * aScale * (1.0 / -mvPosition.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying vec3  vColor;
        varying float vCore;

        void main() {
          // Soft, glowing circular point.
          float d = distance(gl_PointCoord, vec2(0.5));
          float glow = 0.05 / d - 0.1;
          glow = clamp(glow, 0.0, 1.0);

          // Lift the nucleus toward white where points pile up.
          vec3 col = mix(vColor, vec3(1.0), vCore * 0.55 * glow);
          gl_FragColor = vec4(col, glow * uOpacity);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ---- Interaction (cursor → world-space repulsion + parallax) -----------
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ndc = new THREE.Vector2(0, 0);
    const hit = new THREE.Vector3(999, 999, 999);
    const targetRepel = new THREE.Vector3(999, 999, 999);
    const pointer = new THREE.Vector2(0, 0); // for parallax (-1..1)
    let pointerActive = false;

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      ndc.set(x * 2 - 1, -(y * 2) + 1);
      pointer.set(ndc.x, ndc.y);
      pointerActive = true;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        targetRepel.copy(hit);
      }
    };
    const onPointerLeave = () => {
      pointerActive = false;
      targetRepel.set(999, 999, 999);
    };

    if (!prefersReduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    // ---- Resize -------------------------------------------------------------
    const onResize = () => {
      const next = getSize();
      w = next.w;
      h = next.h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ---- Visibility / in-view pausing --------------------------------------
    let inView = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !prefersReduced && raf === 0) loop();
      },
      { threshold: 0 }
    );
    io.observe(mount);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView && !prefersReduced && raf === 0) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ---- Render loop --------------------------------------------------------
    const clock = new THREE.Clock();
    let raf = 0;

    const render = () => {
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;

      // Smoothly ease the repulsion point + opacity fade-in.
      uniforms.uRepel.value.lerp(targetRepel, 0.12);
      uniforms.uOpacity.value = Math.min(uniforms.uOpacity.value + 0.02, 1);

      // Subtle camera parallax toward the pointer.
      if (!prefersReduced) {
        const px = pointerActive ? pointer.x : 0;
        const py = pointerActive ? pointer.y : 0;
        camera.position.x += (px * 0.5 - camera.position.x) * 0.04;
        camera.position.y += (2.7 + py * 0.35 - camera.position.y) * 0.04;
        camera.lookAt(0, -0.25, 0);
      }
      renderer.render(scene, camera);
    };

    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    if (prefersReduced) {
      // Static, accessible frame — render a couple of steps so it's settled.
      uniforms.uOpacity.value = 1;
      uniforms.uTime.value = 2.0;
      render();
    } else {
      loop();
    }

    // ---- Cleanup ------------------------------------------------------------
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}

export default GalaxyField;
