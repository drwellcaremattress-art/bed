import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Box, Layers, Maximize2, Minimize2, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';

export type TimberPresetId = 'teak' | 'mahogany';
type CameraPresetId = 'hero' | 'headboard' | 'slats' | 'joinery';

interface TimberProfile {
  id: TimberPresetId;
  label: string;
  tamilName: string;
  baseHex: string;
  grainHex: string;
  highlightHex: string;
  roughness: number;
}

const TIMBER_PROFILES: Record<TimberPresetId, TimberProfile> = {
  teak: {
    id: 'teak',
    label: 'Teak Wood',
    tamilName: 'Burma Thekku',
    baseHex: '#9C662B',
    grainHex: '#593310',
    highlightHex: '#C48A45',
    roughness: 0.48,
  },
  mahogany: {
    id: 'mahogany',
    label: 'Mahogany Wood',
    tamilName: 'Indian Mahogany',
    baseHex: '#6E2B20',
    grainHex: '#38120B',
    highlightHex: '#9A4837',
    roughness: 0.42,
  },
};

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  hero: { label: '3/4 Frame', pos: [2.75, 1.85, 3.05], target: [0, 0.42, -0.05] },
  headboard: { label: 'Headboard', pos: [0.25, 1.35, 2.75], target: [0, 0.72, -0.85] },
  slats: { label: 'Slats Top', pos: [0.05, 3.35, 1.15], target: [0, 0.35, 0] },
  joinery: { label: 'Corner Joint', pos: [1.65, 0.95, 1.85], target: [0.75, 0.32, 0.92] },
};

// Pre-allocated math helpers outside animation loop (zero GC)
const _tempObj = new THREE.Object3D();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

function createProceduralWoodTextures(
  profile: TimberProfile,
  maxAnisotropy: number
): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const width = 512;
  const height = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  ctx.fillStyle = profile.baseHex;
  ctx.fillRect(0, 0, width, height);

  rCtx.fillStyle = '#888888';
  rCtx.fillRect(0, 0, width, height);

  // Procedural cathedral wood grain & heartwood fibers
  for (let y = 0; y < height; y += 2) {
    const wave = Math.sin(y * 0.045) * 14 + Math.cos(y * 0.017) * 26;
    const band = Math.sin((y + wave) * 0.14);
    ctx.strokeStyle = band > 0.25 ? profile.grainHex : profile.highlightHex;
    ctx.globalAlpha = band > 0.25 ? 0.22 : 0.14;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 32) {
      const offset = Math.sin(x * 0.015 + y * 0.04) * 5;
      ctx.lineTo(x, y + offset);
    }
    ctx.stroke();

    rCtx.strokeStyle = band > 0.25 ? '#b4b4b4' : '#6c6c6c';
    rCtx.globalAlpha = 0.28;
    rCtx.lineWidth = 1.5;
    rCtx.beginPath();
    rCtx.moveTo(0, y);
    for (let x = 0; x <= width; x += 32) {
      const offset = Math.sin(x * 0.015 + y * 0.04) * 5;
      rCtx.lineTo(x, y + offset);
    }
    rCtx.stroke();
  }

  // Fine longitudinal timber pores
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = profile.grainHex;
  for (let i = 0; i < 420; i++) {
    const px = (i * 73) % width;
    const py = (i * 137) % height;
    const len = 18 + (i % 42);
    ctx.fillRect(px, py, len, 1);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5
  );
  grad.addColorStop(0, 'rgba(28, 22, 16, 0.34)');
  grad.addColorStop(0.55, 'rgba(28, 22, 16, 0.12)');
  grad.addColorStop(1, 'rgba(28, 22, 16, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function WoodBed3DViewer() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [timberId, setTimberId] = useState<TimberPresetId>('teak');
  const [explodeRatio, setExplodeRatio] = useState<number>(0);
  const [autoMotion, setAutoMotion] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('hero');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Mutable refs so React controls drive Three.js smoothly without remounting the canvas
  const explodeTargetRef = useRef(0);
  const autoMotionRef = useRef(true);
  const timberSetterRef = useRef<((id: TimberPresetId) => void) | null>(null);
  const zoomRef = useRef<((scale: number) => void) | null>(null);
  const camTransitionRef = useRef<{
    active: boolean;
    pos: [number, number, number];
    target: [number, number, number];
  }>({
    active: false,
    pos: CAMERA_PRESETS.hero.pos,
    target: CAMERA_PRESETS.hero.target,
  });

  useEffect(() => {
    explodeTargetRef.current = explodeRatio;
  }, [explodeRatio]);

  useEffect(() => {
    autoMotionRef.current = autoMotion;
  }, [autoMotion]);

  useEffect(() => {
    timberSetterRef.current?.(timberId);
  }, [timberId]);

  const handleSelectCameraPreset = (presetId: CameraPresetId) => {
    setCameraPreset(presetId);
    const preset = CAMERA_PRESETS[presetId];
    camTransitionRef.current = {
      active: true,
      pos: preset.pos,
      target: preset.target,
    };
  };

  const handleResetView = () => {
    setExplodeRatio(0);
    setAutoMotion(true);
    handleSelectCameraPreset('hero');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Mandatory studio environment reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // 3-Point Studio Lighting + Warm/Cool Contrast
    const hemiLight = new THREE.HemisphereLight(0xf6f8fc, 0xa88c70, 0.72);
    hemiLight.position.set(0, 8, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.75);
    keyLight.position.set(3.8, 5.4, 3.6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffe6c7, 0.75);
    rimLight.position.set(-3.2, 3.0, -3.6);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const studioSoftbox = new THREE.RectAreaLight(0xfff8ee, 2.2, 3.4, 1.8);
      studioSoftbox.position.set(0, 3.4, 1.2);
      studioSoftbox.lookAt(0, 0.4, 0);
      scene.add(studioSoftbox);
    }

    // Radial contact shadow grounding directly over the room backdrop (no opaque box floor)
    const shadowTex = createContactShadowTexture();
    const shadowPlaneGeo = new THREE.PlaneGeometry(2.75, 3.35);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.003;
    scene.add(shadowPlane);

    // Materials (Wood Frame + Darker End-Grain + Brushed Brass Mortise Pins)
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    let activeTextures = createProceduralWoodTextures(TIMBER_PROFILES.teak, maxAnisotropy);

    const primaryWoodMat = new THREE.MeshStandardMaterial({
      map: activeTextures.map,
      roughnessMap: activeTextures.roughnessMap,
      roughness: TIMBER_PROFILES.teak.roughness,
      metalness: 0.04,
    });

    const slatWoodMat = new THREE.MeshStandardMaterial({
      map: activeTextures.map,
      roughnessMap: activeTextures.roughnessMap,
      color: new THREE.Color(0xebd9c3),
      roughness: 0.72, // >= 0.24 roughness delta vs oiled frame
      metalness: 0.02,
    });

    const brassPinMat = new THREE.MeshPhysicalMaterial({
      color: 0xc9a255,
      metalness: 0.92,
      roughness: 0.2,
      clearcoat: 0.4,
    });

    // Composite Solid Wood Bed Frame Hierarchy (NO mattress — pure solid timber)
    // Dimensions in meters (approx Queen 60" x 78" -> 1.56m W x 2.02m L)
    const bedRoot = new THREE.Group();
    scene.add(bedRoot);

    const disposables: Array<{ dispose: () => void }> = [
      shadowTex,
      shadowPlaneGeo,
      shadowPlaneMat,
      primaryWoodMat,
      slatWoodMat,
      brassPinMat,
    ];

    const W = 1.56;
    const L = 2.04;
    const railH = 0.14;
    const railThick = 0.055;
    const legSize = 0.085;
    const deckY = 0.31;

    // 1. Headboard Assembly (Pillars grounded at y=0 + Beveled Crown Arch + 9 Vertical Stiles)
    const headboardGroup = new THREE.Group();
    bedRoot.add(headboardGroup);

    const hbPostGeo = new THREE.BoxGeometry(legSize, 1.08, legSize);
    disposables.push(hbPostGeo);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(hbPostGeo, primaryWoodMat);
      post.position.set(sx * (W / 2 - legSize / 2), 1.08 / 2, -L / 2 + legSize / 2);
      post.castShadow = !isSoftwareGl;
      post.receiveShadow = !isSoftwareGl;
      headboardGroup.add(post);

      // Lathe-turned Chettinad finial cap on headboard pillars
      const finialPts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.042, 0.0),
        new THREE.Vector2(0.044, 0.022),
        new THREE.Vector2(0.024, 0.045),
        new THREE.Vector2(0.032, 0.072),
        new THREE.Vector2(0.012, 0.095),
        new THREE.Vector2(0.0, 0.105),
      ];
      const finialGeo = new THREE.LatheGeometry(finialPts, 18);
      disposables.push(finialGeo);
      const finial = new THREE.Mesh(finialGeo, primaryWoodMat);
      finial.position.set(sx * (W / 2 - legSize / 2), 1.08, -L / 2 + legSize / 2);
      finial.castShadow = !isSoftwareGl;
      headboardGroup.add(finial);
    }

    // Beveled Chettinad Crown Rail (ExtrudeGeometry)
    const crownShape = new THREE.Shape();
    const spanW = W - legSize * 2;
    crownShape.moveTo(-spanW / 2, 0);
    crownShape.lineTo(spanW / 2, 0);
    crownShape.lineTo(spanW / 2, 0.09);
    crownShape.quadraticCurveTo(0, 0.175, -spanW / 2, 0.09);
    crownShape.closePath();

    const crownGeo = new THREE.ExtrudeGeometry(crownShape, {
      depth: 0.048,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
    });
    crownGeo.center();
    disposables.push(crownGeo);
    const crownMesh = new THREE.Mesh(crownGeo, primaryWoodMat);
    crownMesh.position.set(0, 0.99, -L / 2 + legSize / 2);
    crownMesh.castShadow = !isSoftwareGl;
    crownMesh.receiveShadow = !isSoftwareGl;
    headboardGroup.add(crownMesh);

    const hbLowerRailGeo = new THREE.BoxGeometry(spanW, 0.075, 0.045);
    disposables.push(hbLowerRailGeo);
    const hbLowerRail = new THREE.Mesh(hbLowerRailGeo, primaryWoodMat);
    hbLowerRail.position.set(0, 0.44, -L / 2 + legSize / 2);
    hbLowerRail.castShadow = !isSoftwareGl;
    headboardGroup.add(hbLowerRail);

    // 9 Vertical Solid Timber Stiles in Headboard
    const stileGeo = new THREE.BoxGeometry(0.042, 0.48, 0.028);
    disposables.push(stileGeo);
    for (let i = -4; i <= 4; i++) {
      const stile = new THREE.Mesh(stileGeo, primaryWoodMat);
      stile.position.set(i * 0.145, 0.69, -L / 2 + legSize / 2);
      stile.castShadow = !isSoftwareGl;
      headboardGroup.add(stile);
    }

    // 2. Footboard Assembly (Front legs grounded at y=0 + lower timber beam)
    const footboardGroup = new THREE.Group();
    bedRoot.add(footboardGroup);

    const fbPostGeo = new THREE.BoxGeometry(legSize, 0.46, legSize);
    disposables.push(fbPostGeo);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(fbPostGeo, primaryWoodMat);
      post.position.set(sx * (W / 2 - legSize / 2), 0.46 / 2, L / 2 - legSize / 2);
      post.castShadow = !isSoftwareGl;
      post.receiveShadow = !isSoftwareGl;
      footboardGroup.add(post);
    }

    const fbRailGeo = new THREE.BoxGeometry(spanW, railH, railThick);
    disposables.push(fbRailGeo);
    const fbRail = new THREE.Mesh(fbRailGeo, primaryWoodMat);
    fbRail.position.set(0, deckY, L / 2 - legSize / 2);
    fbRail.castShadow = !isSoftwareGl;
    fbRail.receiveShadow = !isSoftwareGl;
    footboardGroup.add(fbRail);

    // 3. Left & Right 8/4 Solid Side Rails + Inner Slat Cleats
    const sideRailGroupL = new THREE.Group();
    const sideRailGroupR = new THREE.Group();
    bedRoot.add(sideRailGroupL, sideRailGroupR);

    const sideRailLen = L - legSize * 2;
    const sideRailGeo = new THREE.BoxGeometry(railThick, railH, sideRailLen);
    const cleatGeo = new THREE.BoxGeometry(0.03, 0.032, sideRailLen - 0.04);
    disposables.push(sideRailGeo, cleatGeo);

    for (const [grp, sx] of [
      [sideRailGroupL, -1],
      [sideRailGroupR, 1],
    ] as const) {
      const rail = new THREE.Mesh(sideRailGeo, primaryWoodMat);
      rail.position.set(sx * (W / 2 - legSize / 2), deckY, 0);
      rail.castShadow = !isSoftwareGl;
      rail.receiveShadow = !isSoftwareGl;
      grp.add(rail);

      const cleat = new THREE.Mesh(cleatGeo, primaryWoodMat);
      cleat.position.set(sx * (W / 2 - legSize / 2 - railThick / 2 - 0.014), deckY - 0.025, 0);
      grp.add(cleat);
    }

    // 4. Center Hardwood Spine & Dual Support Legs (y=0)
    const centerSpineGroup = new THREE.Group();
    bedRoot.add(centerSpineGroup);

    const spineGeo = new THREE.BoxGeometry(0.065, 0.085, sideRailLen);
    const centerLegGeo = new THREE.BoxGeometry(0.055, deckY - 0.055, 0.055);
    disposables.push(spineGeo, centerLegGeo);

    const spineMesh = new THREE.Mesh(spineGeo, primaryWoodMat);
    spineMesh.position.set(0, deckY - 0.035, 0);
    spineMesh.castShadow = !isSoftwareGl;
    centerSpineGroup.add(spineMesh);

    for (const sz of [-0.45, 0.45]) {
      const cLeg = new THREE.Mesh(centerLegGeo, primaryWoodMat);
      cLeg.position.set(0, (deckY - 0.055) / 2, sz);
      cLeg.castShadow = !isSoftwareGl;
      centerSpineGroup.add(cLeg);
    }

    // 5. InstancedMesh: 14 Exposed Solid Wood Slats (Zero Mattress!)
    const SLAT_COUNT = 14;
    const slatWidth = W - legSize - 0.04;
    const slatGeo = new THREE.BoxGeometry(slatWidth, 0.022, 0.072);
    disposables.push(slatGeo);
    const slatsInstanced = new THREE.InstancedMesh(slatGeo, slatWoodMat, SLAT_COUNT);
    slatsInstanced.castShadow = !isSoftwareGl;
    slatsInstanced.receiveShadow = !isSoftwareGl;
    slatsInstanced.frustumCulled = false;
    bedRoot.add(slatsInstanced);

    // 6. InstancedMesh: 8 Brushed Brass Mortise-Tenon Corner Pins
    const PIN_COUNT = 8;
    const pinGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.065, 12);
    pinGeo.rotateZ(Math.PI / 2);
    disposables.push(pinGeo);
    const pinsInstanced = new THREE.InstancedMesh(pinGeo, brassPinMat, PIN_COUNT);
    pinsInstanced.frustumCulled = false;
    bedRoot.add(pinsInstanced);

    const updateInstances = (explodeAmt: number) => {
      const startZ = -sideRailLen / 2 + 0.085;
      const stepZ = (sideRailLen - 0.17) / (SLAT_COUNT - 1);
      for (let i = 0; i < SLAT_COUNT; i++) {
        const lift = explodeAmt * (0.26 + Math.sin((i / (SLAT_COUNT - 1)) * Math.PI) * 0.16);
        _tempObj.position.set(0, deckY + 0.004 + lift, startZ + i * stepZ);
        _tempObj.rotation.set(0, 0, 0);
        _tempObj.updateMatrix();
        slatsInstanced.setMatrixAt(i, _tempObj.matrix);
      }
      slatsInstanced.instanceMatrix.needsUpdate = true;

      const pinCoords: Array<[number, number, number, number]> = [
        [-W / 2 + legSize / 2, deckY + 0.03, -L / 2 + legSize / 2, -1],
        [-W / 2 + legSize / 2, deckY - 0.03, -L / 2 + legSize / 2, -1],
        [W / 2 - legSize / 2, deckY + 0.03, -L / 2 + legSize / 2, 1],
        [W / 2 - legSize / 2, deckY - 0.03, -L / 2 + legSize / 2, 1],
        [-W / 2 + legSize / 2, deckY + 0.03, L / 2 - legSize / 2, -1],
        [-W / 2 + legSize / 2, deckY - 0.03, L / 2 - legSize / 2, -1],
        [W / 2 - legSize / 2, deckY + 0.03, L / 2 - legSize / 2, 1],
        [W / 2 - legSize / 2, deckY - 0.03, L / 2 - legSize / 2, 1],
      ];
      for (let i = 0; i < PIN_COUNT; i++) {
        const [px, py, pz, dirX] = pinCoords[i];
        _tempObj.position.set(px + dirX * (0.015 + explodeAmt * 0.24), py, pz);
        _tempObj.rotation.set(0, 0, 0);
        _tempObj.updateMatrix();
        pinsInstanced.setMatrixAt(i, _tempObj.matrix);
      }
      pinsInstanced.instanceMatrix.needsUpdate = true;
    };
    updateInstances(0);

    // Timber switcher callback
    timberSetterRef.current = (nextId: TimberPresetId) => {
      const prof = TIMBER_PROFILES[nextId];
      const oldMap = activeTextures.map;
      const oldRough = activeTextures.roughnessMap;
      activeTextures = createProceduralWoodTextures(prof, maxAnisotropy);
      primaryWoodMat.map = activeTextures.map;
      primaryWoodMat.roughnessMap = activeTextures.roughnessMap;
      primaryWoodMat.roughness = prof.roughness;
      primaryWoodMat.needsUpdate = true;

      slatWoodMat.map = activeTextures.map;
      slatWoodMat.roughnessMap = activeTextures.roughnessMap;
      slatWoodMat.needsUpdate = true;

      oldMap.dispose();
      oldRough.dispose();
    };

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 1.65;
    controls.maxDistance = 5.4;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minPolarAngle = 0.25;

    const onControlStart = () => {
      camTransitionRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    zoomRef.current = (scale: number) => {
      camTransitionRef.current.active = false;
      const offset = camera.position.clone().sub(controls.target);
      const nextLen = THREE.MathUtils.clamp(offset.length() * scale, controls.minDistance, controls.maxDistance);
      offset.setLength(nextLen);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const startTimeMs = performance.now();
    let prevTimeMs = startTimeMs;
    let currentExplode = 0;
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const delta = Math.min((nowMs - prevTimeMs) / 1000, 0.1);
      const elapsed = (nowMs - startTimeMs) / 1000;
      prevTimeMs = nowMs;

      // Gentle motion-graphic presentation rotation when enabled
      if (autoMotionRef.current && !camTransitionRef.current.active) {
        bedRoot.rotation.y = Math.sin(elapsed * 0.35) * 0.28;
      }

      // Smooth exponential damping for Exploded Joinery view
      currentExplode = THREE.MathUtils.damp(currentExplode, explodeTargetRef.current, 6, delta);
      headboardGroup.position.z = -currentExplode * 0.42;
      footboardGroup.position.z = currentExplode * 0.42;
      sideRailGroupL.position.x = -currentExplode * 0.36;
      sideRailGroupR.position.x = currentExplode * 0.36;
      centerSpineGroup.position.y = -currentExplode * 0.08;
      updateInstances(currentExplode);

      // Smooth camera preset damping
      if (camTransitionRef.current.active) {
        _targetCamPos.set(...camTransitionRef.current.pos);
        _targetLookAt.set(...camTransitionRef.current.target);
        const alpha = 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(_targetCamPos, alpha);
        controls.target.lerp(_targetLookAt, alpha);
        if (
          camera.position.distanceTo(_targetCamPos) < 0.02 &&
          controls.target.distanceTo(_targetLookAt) < 0.02
        ) {
          camTransitionRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      activeTextures.map.dispose();
      activeTextures.roughnessMap.dispose();
      envTex.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full select-none flex flex-col gap-3">
      {/* Top Essential Bar: Wood Label + 3D / Exploded Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs font-medium text-[#4B4237]">
          <span className="font-semibold text-[#18181B]">
            {TIMBER_PROFILES[timberId].label}
          </span>{' '}
          ({TIMBER_PROFILES[timberId].tamilName}) · Drag to orbit
        </p>

        <div className="inline-flex items-center rounded-full bg-[#FAF6EE]/90 backdrop-blur-sm p-0.5 border border-[#E2D6C5] shadow-xs">
          <button
            type="button"
            onClick={() => setExplodeRatio(0)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              explodeRatio < 0.1
                ? 'bg-[#1F3A2E] text-white'
                : 'text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            <Box className="w-3 h-3" aria-hidden="true" />
            <span>3D View</span>
          </button>
          <button
            type="button"
            onClick={() => setExplodeRatio(explodeRatio >= 0.1 ? 0 : 0.75)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              explodeRatio >= 0.1
                ? 'bg-[#1F3A2E] text-white'
                : 'text-[#57534E] hover:text-[#18181B]'
            }`}
          >
            <Layers className="w-3 h-3" aria-hidden="true" />
            <span>Exploded Joinery</span>
          </button>
        </div>
      </div>

      {/* Frameless 3D Canvas */}
      <div
        className={`relative w-full ${
          expanded ? 'h-[480px] lg:h-[560px]' : 'h-[360px] sm:h-[430px]'
        }`}
      >
        <div ref={mountRef} className="w-full h-full" />

        {/* Right-Side Vertical Floating Controls */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => zoomRef.current?.(0.84)}
            aria-label="Zoom in"
            className="w-8 h-8 rounded-full bg-[#FAF6EE]/90 backdrop-blur-sm border border-[#E2D6C5] text-[#18181B] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => zoomRef.current?.(1.18)}
            aria-label="Zoom out"
            className="w-8 h-8 rounded-full bg-[#FAF6EE]/90 backdrop-blur-sm border border-[#E2D6C5] text-[#18181B] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset 3D view"
            className="w-8 h-8 rounded-full bg-[#FAF6EE]/90 backdrop-blur-sm border border-[#E2D6C5] text-[#18181B] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? 'Collapse viewport' : 'Expand viewport'}
            className="w-8 h-8 rounded-full bg-[#FAF6EE]/90 backdrop-blur-sm border border-[#E2D6C5] text-[#18181B] flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        </div>

        {contextLost && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
            <p className="font-serif text-xl font-semibold text-[#18181B]">
              3D Timber Viewport Paused
            </p>
            <p className="text-xs text-[#57534E] mt-1">
              WebGL context paused by browser. Browse our solid wood frames below.
            </p>
          </div>
        )}
      </div>

      {/* Essential Bottom Controls (Wood + Motion + Presets) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.values(TIMBER_PROFILES) as TimberProfile[]).map((prof) => {
            const active = timberId === prof.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setTimberId(prof.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  active
                    ? 'border-[#1F3A2E] bg-[#1F3A2E] text-white shadow-xs'
                    : 'border-[#E2D6C5] bg-[#FAF6EE]/90 backdrop-blur-sm text-[#18181B] hover:bg-white'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: prof.baseHex }}
                  aria-hidden="true"
                />
                <span>{prof.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setAutoMotion((prev) => !prev)}
            aria-label={autoMotion ? 'Pause 3D rotation' : 'Play 3D rotation'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2D6C5] bg-[#FAF6EE]/90 backdrop-blur-sm text-xs font-medium text-[#18181B] hover:bg-white cursor-pointer"
          >
            {autoMotion ? <Pause className="w-3 h-3" aria-hidden="true" /> : <Play className="w-3 h-3 fill-current" aria-hidden="true" />}
            <span>{autoMotion ? 'Pause' : 'Play'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => {
            const active = cameraPreset === presetKey;
            return (
              <button
                key={presetKey}
                type="button"
                onClick={() => handleSelectCameraPreset(presetKey)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#FAF6EE]/95 text-[#18181B] font-semibold border border-[#DDD2C1] shadow-xs'
                    : 'text-[#4B4237] hover:text-[#18181B] hover:bg-[#FAF6EE]/60'
                }`}
              >
                {CAMERA_PRESETS[presetKey].label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
