import * as THREE from 'three';
import { InteractiveObjectId } from '../types';
import { soundscape } from '../utils/audio';

export interface SceneCallbacks {
  onHoverObject: (id: InteractiveObjectId | null, position2D?: { x: number; y: number }) => void;
  onSelectObject: (id: InteractiveObjectId) => void;
  onControllerDragStart: () => void;
  onControllerDragEnd: () => void;
  onChairDragStart: () => void;
  onChairDragEnd: () => void;
  onMouseDragStart?: () => void;
  onMouseDragEnd?: () => void;
  onMouseDrag?: (normX: number, normY: number) => void;
  onMonitorPowerToggle: (isPowered: boolean) => void;
  onPCPowerToggle: (isPowered: boolean) => void;
}

export class Evoke3DExperience {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;

  // Three.js core
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  // Scroll Progress (0 to 1)
  private scrollProgress = 0;

  // Camera Orbit State
  private targetSpherical = { radius: 3.4, phi: 1.22, theta: 0.38 };
  private currentSpherical = { radius: 3.4, phi: 1.22, theta: 0.38 };
  private targetLookAt = new THREE.Vector3(0, 0.95, 0);
  private currentLookAt = new THREE.Vector3(0, 0.95, 0);

  private isPointerDown = false;
  private pointerStart = { x: 0, y: 0 };
  private sphericalStart = { phi: 1.22, theta: 0.38 };
  private mouseParallax = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Mode: normal orbit, monitor zoom, or reveal
  public mode: 'orbit' | 'monitor' | 'reveal' = 'orbit';

  // Raycasting & Interaction
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-999, -999);
  private interactiveMeshes: Map<THREE.Object3D, InteractiveObjectId> = new Map();
  private hoveredId: InteractiveObjectId | null = null;

  // ----------------------------------------------------
  // CONTROLLER DRAGGING (3D physical dragging & placing)
  // ----------------------------------------------------
  public isDraggingController = false;
  private controllerGroup!: THREE.Group;
  private controllerRestPos = new THREE.Vector3(-0.35, 0.89, 0.32);
  private controllerRestRot = new THREE.Euler(-0.08, 0.28, 0.05);
  private controllerDragPos = new THREE.Vector3();
  private controllerVelocity = new THREE.Vector3();
  private deskDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.89);

  // ----------------------------------------------------
  // CHAIR DRAGGING, 360° SPIN & INERTIA
  // ----------------------------------------------------
  public isDraggingChair = false;
  private chairRoot!: THREE.Group;
  private chairSeatGroup!: THREE.Group;
  private chairPos = new THREE.Vector3(0, 0, 0.72);
  private chairTargetPos = new THREE.Vector3(0, 0, 0.72);
  private chairVelocity = new THREE.Vector3(0, 0, 0);
  private chairFloorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private chairDragOffset = new THREE.Vector3();
  private chairSwivelAngle = 0; // 0 faces directly towards the desk
  private chairTargetSwivel = 0;
  private chairSpinVelocity = 0;
  private chairDragStartCoord = { x: 0, y: 0 };
  private chairDragStartSwivel = 0;

  // ----------------------------------------------------
  // MOUSE DRAGGING & LIVE MONITOR CURSOR
  // ----------------------------------------------------
  public isDraggingMouse = false;
  private mouseGroup!: THREE.Group;
  private mouseMesh!: THREE.Mesh;
  public monitorCursorX = 512;
  public monitorCursorY = 256;

  // ----------------------------------------------------
  // HEADSET & SONIC PULSE
  // ----------------------------------------------------
  private headsetGroup!: THREE.Group;
  private sonicRings: THREE.Mesh[] = [];
  private headsetWobble = 0;

  // ----------------------------------------------------
  // PC RIG & ON/OFF STATE
  // ----------------------------------------------------
  public isPCPowered = true;
  private pcFanGroup!: THREE.Group;
  private pcCoolantLight!: THREE.PointLight;
  private pcPowerLedMesh!: THREE.Mesh;
  private pcFanSpeed = 0.08;
  private pcTargetFanSpeed = 0.08;

  // ----------------------------------------------------
  // MONITOR & PHYSICAL POWER BUTTON
  // ----------------------------------------------------
  public isMonitorPowered = true;
  private monitorScreenMesh!: THREE.Mesh;
  private monitorCanvas!: HTMLCanvasElement;
  private monitorCtx!: CanvasRenderingContext2D;
  private monitorTexture!: THREE.CanvasTexture;
  private monitorBootProgress = 1.0;
  private monitorStandbyLedMesh!: THREE.Mesh;
  private monitorStandbyLight!: THREE.PointLight;
  private monitorBiasLight!: THREE.PointLight;

  // ----------------------------------------------------
  // KEYBOARD REACTIVE WAVE
  // ----------------------------------------------------
  private keyboardKeyGroup!: THREE.Group;
  private keyboardWaveTime = 0;
  private isKeyboardHovered = false;

  // ----------------------------------------------------
  // ATMOSPHERIC PARTICLES & LIGHTING
  // ----------------------------------------------------
  private dustParticles!: THREE.Points;
  private ambientLight!: THREE.AmbientLight;
  private mauveSpotLight!: THREE.SpotLight;
  private plumFillLight!: THREE.PointLight;
  private rimLight!: THREE.DirectionalLight;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const initialFov = container.clientWidth < 768 || aspect < 1.0 ? 54 : 44;
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 40);
    this.updateCameraPosition();

    // Renderer (Alpha enabled for seamless fixed background video integration)
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Build Environment & Objects (Setup remains 100% untouched)
    this.initLights();
    this.initRoom();
    this.initDesk();
    this.initMonitor();
    this.initController();
    this.initChair();
    this.initHeadset();
    this.initPC();
    this.initKeyboardAndMouse();
    this.initAtmosphere();

    // Bind Interaction Events
    this.bindEvents();

    // Start loop
    this.animate();
  }

  // ========================================================
  // LIGHTING SETUP (Plum, Mauve, Charcoal, Burnt Orange)
  // ========================================================
  private initLights() {
    // 1. Deep Plum Ambient Wash
    this.ambientLight = new THREE.AmbientLight(0x3a102c, 1.15);
    this.scene.add(this.ambientLight);

    // 2. Main Dramatic Mauve Spotlight from above front-left (Key hero light)
    this.mauveSpotLight = new THREE.SpotLight(0xa62b5f, 5.8);
    this.mauveSpotLight.position.set(-1.8, 3.4, 1.8);
    this.mauveSpotLight.target.position.set(0, 0.85, 0);
    this.mauveSpotLight.angle = Math.PI / 3.8;
    this.mauveSpotLight.penumbra = 0.8;
    this.mauveSpotLight.decay = 2;
    this.mauveSpotLight.castShadow = true;
    this.mauveSpotLight.shadow.mapSize.width = 1024;
    this.mauveSpotLight.shadow.mapSize.height = 1024;
    this.mauveSpotLight.shadow.bias = -0.0005;
    this.scene.add(this.mauveSpotLight);
    this.scene.add(this.mauveSpotLight.target);

    // 3. Crisp Rim Light for Chair, Monitor & Desk edge specular glints
    this.rimLight = new THREE.DirectionalLight(0xf4f0ea, 0.95);
    this.rimLight.position.set(2.8, 3.2, 1.8);
    this.scene.add(this.rimLight);

    // 4. Burnt Orange Hardware Specular Accent Light
    const hardwareKeyLight = new THREE.DirectionalLight(0xe66a3a, 1.1);
    hardwareKeyLight.position.set(-2.5, 2.4, -0.6);
    this.scene.add(hardwareKeyLight);

    // 5. Plum Floor & Shadow Filler
    this.plumFillLight = new THREE.PointLight(0x3a102c, 2.6, 7);
    this.plumFillLight.position.set(0, 0.4, 0);
    this.scene.add(this.plumFillLight);

    // 6. Monitor Ambient Bias Light (casts mauve glow behind screen)
    this.monitorBiasLight = new THREE.PointLight(0xa62b5f, 2.8, 4.0);
    this.monitorBiasLight.position.set(0, 1.25, -0.45);
    this.scene.add(this.monitorBiasLight);

    // 7. Burnt Orange Accent LED pin-point
    const accentLed = new THREE.PointLight(0xe66a3a, 1.6, 2.0);
    accentLed.position.set(0.68, 0.98, -0.1);
    this.scene.add(accentLed);
  }

  // ========================================================
  // ROOM & ARCHITECTURE (Grounded Floor for Gaming Battlestation)
  // ========================================================
  private initRoom() {
    // Floor: Dark Charcoal Acoustic Parquet Grounding Platform with edge chamfer
    const floorGeo = new THREE.PlaneGeometry(14, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141216,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.92,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 1.0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Rear Studio Acoustic Wall with vertical acoustic slats
    const wallGeo = new THREE.PlaneGeometry(14, 7);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x161318,
      roughness: 0.85,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 3.5, -2.2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Architectural Slatted Acoustic Panels behind the desk
    const slatGeo = new THREE.BoxGeometry(0.04, 4.2, 0.04);
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x201a24,
      roughness: 0.65,
      metalness: 0.35,
    });
    for (let i = -14; i <= 14; i++) {
      if (Math.abs(i) < 4) continue; // Keep center clear behind monitor
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(i * 0.22, 2.4, -2.16);
      this.scene.add(slat);
    }

    // Architectural Neon Light Strip (Mauve accent bar across back wall)
    const stripGeo = new THREE.BoxGeometry(7.5, 0.015, 0.02);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xa62b5f });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 3.8, -2.15);
    this.scene.add(strip);
  }

  // ========================================================
  // ESPORTS WORKSTATION DESK
  // ========================================================
  private initDesk() {
    const deskGroup = new THREE.Group();

    // Tabletop: Chamfered Charcoal Phenolic Resin
    const topGeo = new THREE.BoxGeometry(2.0, 0.065, 0.95);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x18151a,
      roughness: 0.45,
      metalness: 0.6,
    });
    const tabletop = new THREE.Mesh(topGeo, topMat);
    tabletop.position.set(0, 0.84, 0);
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    deskGroup.add(tabletop);

    // Dual Steel T-Legs
    const legGeo = new THREE.BoxGeometry(0.07, 0.84, 0.65);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b22,
      roughness: 0.3,
      metalness: 0.85,
    });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.84, 0.42, 0);
    leftLeg.castShadow = true;
    deskGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.84, 0.42, 0);
    rightLeg.castShadow = true;
    deskGroup.add(rightLeg);

    // Pro Speed Deskpad (Microfiber with Mauve Edge Stitch)
    const matGeo = new THREE.BoxGeometry(1.3, 0.008, 0.55);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x151217,
      roughness: 0.9,
      metalness: 0.1,
    });
    const deskMat = new THREE.Mesh(matGeo, matMat);
    deskMat.position.set(0, 0.878, 0.08);
    deskMat.receiveShadow = true;
    deskGroup.add(deskMat);

    // Stitched Border on Mat (Mauve)
    const borderGeo = new THREE.BoxGeometry(1.32, 0.006, 0.57);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xa62b5f,
      roughness: 0.4,
      metalness: 0.6,
    });
    const matBorder = new THREE.Mesh(borderGeo, borderMat);
    matBorder.position.set(0, 0.875, 0.08);
    deskGroup.add(matBorder);

    // Subtle Desk Engraving: "WHAT'S NEXT?"
    const deskCanvas = document.createElement('canvas');
    deskCanvas.width = 512;
    deskCanvas.height = 128;
    const dCtx = deskCanvas.getContext('2d')!;
    dCtx.clearRect(0, 0, 512, 128);
    dCtx.font = 'bold 26px "Space Grotesk", sans-serif';
    dCtx.fillStyle = 'rgba(244, 240, 234, 0.28)';
    dCtx.textAlign = 'center';
    dCtx.letterSpacing = '8px';
    dCtx.fillText('WHAT’S NEXT?', 256, 75);

    const deskTexture = new THREE.CanvasTexture(deskCanvas);
    const engraveGeo = new THREE.PlaneGeometry(0.35, 0.09);
    const engraveMat = new THREE.MeshBasicMaterial({
      map: deskTexture,
      transparent: true,
      opacity: 0.75,
    });
    const engraveMesh = new THREE.Mesh(engraveGeo, engraveMat);
    engraveMesh.rotation.x = -Math.PI / 2;
    engraveMesh.position.set(0, 0.884, 0.3);
    deskGroup.add(engraveMesh);

    // Make desk pad interactive (triggers keyboard light ripples)
    this.registerInteractive(deskMat, 'keyboard');
    this.scene.add(deskGroup);
  }

  // ========================================================
  // ULTRA-WIDE CURVED GAMING MONITOR & PHYSICAL POWER BUTTON
  // ========================================================
  private initMonitor() {
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 0.875, -0.18);

    // Monitor Arm / Stand
    const baseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.02, 32);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b22,
      roughness: 0.35,
      metalness: 0.8,
    });
    const standBase = new THREE.Mesh(baseGeo, standMat);
    standBase.position.set(0, 0.01, -0.15);
    monitorGroup.add(standBase);

    const armGeo = new THREE.BoxGeometry(0.04, 0.42, 0.05);
    const standArm = new THREE.Mesh(armGeo, standMat);
    standArm.position.set(0, 0.22, -0.16);
    standArm.rotation.x = 0.08;
    monitorGroup.add(standArm);

    // Monitor Outer Bezel Frame
    const centerBezelGeo = new THREE.BoxGeometry(0.94, 0.46, 0.04);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x171519,
      roughness: 0.4,
      metalness: 0.7,
    });
    const centerBezel = new THREE.Mesh(centerBezelGeo, bezelMat);
    centerBezel.position.set(0, 0.38, 0);
    centerBezel.castShadow = true;
    monitorGroup.add(centerBezel);

    // Lower Chin Bar (for visible controls)
    const chinGeo = new THREE.BoxGeometry(0.94, 0.035, 0.045);
    const chinMat = new THREE.MeshStandardMaterial({
      color: 0x1c1920,
      roughness: 0.3,
      metalness: 0.75,
    });
    const chinMesh = new THREE.Mesh(chinGeo, chinMat);
    chinMesh.position.set(0, 0.165, 0.005);
    monitorGroup.add(chinMesh);

    // ----------------------------------------------------
    // VISIBLE PHYSICAL POWER BUTTON ON LOWER RIGHT BEZEL
    // ----------------------------------------------------
    const pBtnGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.014, 20);
    const pBtnMat = new THREE.MeshStandardMaterial({
      color: 0x2e2532,
      metalness: 0.8,
      roughness: 0.25,
    });
    const powerButtonMesh = new THREE.Mesh(pBtnGeo, pBtnMat);
    powerButtonMesh.rotation.x = Math.PI / 2;
    powerButtonMesh.position.set(0.38, 0.165, 0.026);
    monitorGroup.add(powerButtonMesh);

    // Standby / Active LED Diode next to Power Button
    const ledGeo = new THREE.SphereGeometry(0.004, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xa62b5f });
    this.monitorStandbyLedMesh = new THREE.Mesh(ledGeo, ledMat);
    this.monitorStandbyLedMesh.position.set(0.41, 0.165, 0.027);
    monitorGroup.add(this.monitorStandbyLedMesh);

    this.monitorStandbyLight = new THREE.PointLight(0xa62b5f, 0.8, 0.35);
    this.monitorStandbyLight.position.set(0.41, 0.165, 0.035);
    monitorGroup.add(this.monitorStandbyLight);

    // Dynamic High-Res Screen Texture
    this.monitorCanvas = document.createElement('canvas');
    this.monitorCanvas.width = 1024;
    this.monitorCanvas.height = 512;
    this.monitorCtx = this.monitorCanvas.getContext('2d')!;
    this.monitorTexture = new THREE.CanvasTexture(this.monitorCanvas);
    this.drawMonitorScreen(0);

    const screenGeo = new THREE.PlaneGeometry(0.89, 0.41);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.monitorTexture,
    });
    this.monitorScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.monitorScreenMesh.position.set(0, 0.38, 0.021);
    monitorGroup.add(this.monitorScreenMesh);

    // Register interactions:
    // Clicking power button toggles power state!
    this.registerInteractive(powerButtonMesh, 'monitor_power');
    this.registerInteractive(this.monitorStandbyLedMesh, 'monitor_power');

    // Clicking screen or bezel zooms camera into the display!
    this.registerInteractive(this.monitorScreenMesh, 'monitor');
    this.registerInteractive(centerBezel, 'monitor');
    this.registerInteractive(chinMesh, 'monitor');

    this.scene.add(monitorGroup);
  }

  private drawMonitorScreen(time: number) {
    const ctx = this.monitorCtx;
    const w = this.monitorCanvas.width;
    const h = this.monitorCanvas.height;

    if (!this.isMonitorPowered && this.monitorBootProgress <= 0.01) {
      // Screen is completely OFF: Dark glass with ambient specular sheen
      ctx.fillStyle = '#0a090b';
      ctx.fillRect(0, 0, w, h);

      // Faint glass scanline reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.fillRect(0, h * 0.4, w, 2);

      // Subtle standby text hint
      ctx.fillStyle = 'rgba(230, 106, 58, 0.4)';
      ctx.font = '500 13px "Space Grotesk", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('STANDBY  •  PRESS POWER BUTTON', w - 40, h - 30);

      this.monitorTexture.needsUpdate = true;
      return;
    }

    const bootAlpha = this.monitorBootProgress;

    // Background: Deep charcoal / plum gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#171519');
    bgGrad.addColorStop(0.5, '#201524');
    bgGrad.addColorStop(1, '#171519');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle CRT scanlines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }

    ctx.save();
    ctx.globalAlpha = bootAlpha;

    // Header Status Bar
    ctx.fillStyle = 'rgba(244, 240, 234, 0.55)';
    ctx.font = '600 15px "Space Grotesk", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('EVOKE // OS.01  •  240HZ ULTRA-WIDE  •  LINK: SYNCHRONIZED', 40, 48);

    // Orange live diode
    ctx.fillStyle = '#E66A3A';
    ctx.beginPath();
    ctx.arc(w - 55, 42, 5, 0, Math.PI * 2);
    ctx.fill();

    // Central Brand Creed Animation
    // Center Chevron Mark
    ctx.strokeStyle = '#A62B5F';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 32, h / 2 - 55);
    ctx.lineTo(w / 2, h / 2 - 20);
    ctx.lineTo(w / 2 + 32, h / 2 - 55);
    ctx.stroke();

    // Bold Typography
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F4F0EA';
    ctx.font = '900 52px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('MORE THAN A GAME.', w / 2, h / 2 + 45);

    // Sub-brand Creed
    ctx.fillStyle = '#A62B5F';
    ctx.font = '700 20px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('PLAY.  PROVE.  PROGRESS.', w / 2, h / 2 + 90);

    // Reactive Audio Waveform on monitor footer
    ctx.strokeStyle = 'rgba(166, 43, 95, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 120; x < w - 120; x += 12) {
      const wave = Math.sin(x * 0.04 + time * 4) * Math.cos(x * 0.02) * 18 * bootAlpha;
      ctx.lineTo(x, h - 50 + wave);
    }
    ctx.stroke();

    // Live Tactical Cursor synced with physical mouse dragging!
    if (bootAlpha > 0.1) {
      const cx = this.monitorCursorX;
      const cy = this.monitorCursorY;

      // Reticle Target Ring
      ctx.strokeStyle = 'rgba(230, 106, 58, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx - 15, cy);
      ctx.moveTo(cx + 15, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy - 15);
      ctx.moveTo(cx, cy + 15);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      // Precision Cyber Cursor Arrow
      ctx.fillStyle = '#F4F0EA';
      ctx.shadowColor = '#A62B5F';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + 16);
      ctx.lineTo(cx + 5, cy + 12);
      ctx.lineTo(cx + 9, cy + 20);
      ctx.lineTo(cx + 12, cy + 18);
      ctx.lineTo(cx + 8, cy + 11);
      ctx.lineTo(cx + 13, cy + 11);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Coordinate telemetry tag
      ctx.fillStyle = 'rgba(230, 106, 58, 0.85)';
      ctx.font = '600 11px "Space Grotesk", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `PTR [${Math.round((cx / w) * 100)}%, ${Math.round((cy / h) * 100)}%]`,
        cx + 18,
        cy + 18
      );
    }

    ctx.restore();
    this.monitorTexture.needsUpdate = true;
  }

  // ========================================================
  // PRO ESPORTS CONTROLLER (Physically Draggable in 3D!)
  // ========================================================
  private initController() {
    this.controllerGroup = new THREE.Group();
    this.controllerGroup.position.copy(this.controllerRestPos);
    this.controllerGroup.rotation.copy(this.controllerRestRot);

    // Controller Main Body (Ergonomic sculpt)
    const bodyGeo = new THREE.BoxGeometry(0.18, 0.042, 0.11);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a23,
      roughness: 0.35,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.controllerGroup.add(body);

    // Left & Right Ergonomic Grips
    const gripGeo = new THREE.CylinderGeometry(0.028, 0.038, 0.12, 16);
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x18141b,
      roughness: 0.6,
      metalness: 0.4,
    });

    const leftGrip = new THREE.Mesh(gripGeo, gripMat);
    leftGrip.position.set(-0.09, -0.015, 0.045);
    leftGrip.rotation.z = 0.28;
    leftGrip.rotation.x = 0.3;
    leftGrip.castShadow = true;
    this.controllerGroup.add(leftGrip);

    const rightGrip = new THREE.Mesh(gripGeo, gripMat);
    rightGrip.position.set(0.09, -0.015, 0.045);
    rightGrip.rotation.z = -0.28;
    rightGrip.rotation.x = 0.3;
    rightGrip.castShadow = true;
    this.controllerGroup.add(rightGrip);

    // Thumbsticks (with Mauve stems & Ivory tops)
    const stickStemGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.018, 12);
    const stickCapGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.006, 16);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xa62b5f, metalness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x171519, roughness: 0.8 });

    // Left Stick
    const leftStickStem = new THREE.Mesh(stickStemGeo, stemMat);
    leftStickStem.position.set(-0.045, 0.028, 0.015);
    const leftStickCap = new THREE.Mesh(stickCapGeo, capMat);
    leftStickCap.position.set(-0.045, 0.037, 0.015);
    this.controllerGroup.add(leftStickStem, leftStickCap);

    // Right Stick
    const rightStickStem = new THREE.Mesh(stickStemGeo, stemMat);
    rightStickStem.position.set(0.035, 0.028, 0.03);
    const rightStickCap = new THREE.Mesh(stickCapGeo, capMat);
    rightStickCap.position.set(0.035, 0.037, 0.03);
    this.controllerGroup.add(rightStickStem, rightStickCap);

    // Center Evoke Guide Button (Burnt Orange core ring)
    const guideGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 16);
    const guideMat = new THREE.MeshStandardMaterial({
      color: 0xe66a3a,
      emissive: 0xe66a3a,
      emissiveIntensity: 0.8,
    });
    const guideBtn = new THREE.Mesh(guideGeo, guideMat);
    guideBtn.position.set(0, 0.024, -0.01);
    this.controllerGroup.add(guideBtn);

    // Action Buttons
    const btnGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.005, 12);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xf4f0ea });
    const btnCoords = [
      [0.065, 0.024, -0.015],
      [0.075, 0.024, -0.005],
      [0.055, 0.024, -0.005],
      [0.065, 0.024, 0.005],
    ];
    btnCoords.forEach(([x, y, z]) => {
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set(x, y, z);
      this.controllerGroup.add(btn);
    });

    // Make all parts draggable
    this.registerInteractive(body, 'controller');
    this.registerInteractive(leftGrip, 'controller');
    this.registerInteractive(rightGrip, 'controller');
    this.registerInteractive(guideBtn, 'controller');

    this.scene.add(this.controllerGroup);
  }

  // ========================================================
  // ERGONOMIC ESPORTS GAMING CHAIR (Fully Physically Draggable!)
  // ========================================================
  private initChair() {
    this.chairRoot = new THREE.Group();
    this.chairRoot.position.copy(this.chairPos);

    // Five-Star Base with Caster Wheels
    const baseHubGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.05, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b22,
      roughness: 0.4,
      metalness: 0.8,
    });
    const baseHub = new THREE.Mesh(baseHubGeo, baseMat);
    baseHub.position.set(0, 0.1, 0);
    this.chairRoot.add(baseHub);

    // 5 Star spokes
    const spokeGeo = new THREE.BoxGeometry(0.04, 0.03, 0.32);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spoke = new THREE.Mesh(spokeGeo, baseMat);
      spoke.position.set(Math.sin(angle) * 0.16, 0.09, Math.cos(angle) * 0.16);
      spoke.rotation.y = angle;
      this.chairRoot.add(spoke);

      // Caster wheels at ends
      const wheelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151218, roughness: 0.5 });
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(Math.sin(angle) * 0.3, 0.025, Math.cos(angle) * 0.3);
      wheel.rotation.z = Math.PI / 2;
      this.chairRoot.add(wheel);
    }

    // Hydraulic Gas Cylinder
    const cylGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.38, 16);
    const cylMat = new THREE.MeshStandardMaterial({
      color: 0x2e2531,
      metalness: 0.9,
      roughness: 0.2,
    });
    const cylinder = new THREE.Mesh(cylGeo, cylMat);
    cylinder.position.set(0, 0.28, 0);
    this.chairRoot.add(cylinder);

    // Swiveling Seat & Backrest Assembly Group
    this.chairSeatGroup = new THREE.Group();
    this.chairSeatGroup.position.set(0, 0.46, 0);

    // Seat Cushion
    const seatGeo = new THREE.BoxGeometry(0.48, 0.08, 0.46);
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x1c1720,
      roughness: 0.7,
      metalness: 0.2,
    });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.04, 0);
    seat.castShadow = true;
    this.chairSeatGroup.add(seat);

    // High Ergonomic Backrest (Faces towards the desk)
    const backGeo = new THREE.BoxGeometry(0.44, 0.78, 0.08);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x1c1720,
      roughness: 0.65,
      metalness: 0.2,
    });
    const backrest = new THREE.Mesh(backGeo, backMat);
    backrest.position.set(0, 0.46, 0.19);
    backrest.rotation.x = 0.08;
    backrest.castShadow = true;
    this.chairSeatGroup.add(backrest);

    // Plum Side Bolsters
    const bolsterGeo = new THREE.BoxGeometry(0.06, 0.68, 0.14);
    const bolsterMat = new THREE.MeshStandardMaterial({
      color: 0x3a102c,
      roughness: 0.55,
      metalness: 0.3,
    });
    const leftBolster = new THREE.Mesh(bolsterGeo, bolsterMat);
    leftBolster.position.set(-0.22, 0.44, 0.17);
    leftBolster.rotation.y = -0.2;
    const rightBolster = new THREE.Mesh(bolsterGeo, bolsterMat);
    rightBolster.position.set(0.22, 0.44, 0.17);
    rightBolster.rotation.y = 0.2;
    this.chairSeatGroup.add(leftBolster, rightBolster);

    // Headrest with Embroidered Evoke Crest
    const headrestCanvas = document.createElement('canvas');
    headrestCanvas.width = 256;
    headrestCanvas.height = 128;
    const hCtx = headrestCanvas.getContext('2d')!;
    hCtx.fillStyle = '#1c1720';
    hCtx.fillRect(0, 0, 256, 128);

    hCtx.strokeStyle = '#A62B5F';
    hCtx.lineWidth = 5;
    hCtx.beginPath();
    hCtx.moveTo(100, 35);
    hCtx.lineTo(128, 75);
    hCtx.lineTo(156, 35);
    hCtx.stroke();

    hCtx.fillStyle = '#E66A3A';
    hCtx.beginPath();
    hCtx.arc(128, 26, 4, 0, Math.PI * 2);
    hCtx.fill();

    hCtx.font = 'bold 16px "Space Grotesk", sans-serif';
    hCtx.fillStyle = '#F4F0EA';
    hCtx.textAlign = 'center';
    hCtx.letterSpacing = '4px';
    hCtx.fillText('EVOKE', 128, 105);

    const headrestTex = new THREE.CanvasTexture(headrestCanvas);
    const headrestGeo = new THREE.BoxGeometry(0.28, 0.18, 0.09);
    const headrestMat = new THREE.MeshStandardMaterial({
      color: 0x221a24,
      map: headrestTex,
      roughness: 0.5,
    });
    const headrest = new THREE.Mesh(headrestGeo, headrestMat);
    headrest.position.set(0, 0.85, 0.23);
    this.chairSeatGroup.add(headrest);

    // 4D Armrests extending forward towards the desk
    const armrestGeo = new THREE.BoxGeometry(0.08, 0.03, 0.24);
    const armrestMat = new THREE.MeshStandardMaterial({ color: 0x171519, roughness: 0.5 });
    const leftArm = new THREE.Mesh(armrestGeo, armrestMat);
    leftArm.position.set(-0.28, 0.26, -0.02);
    const rightArm = new THREE.Mesh(armrestGeo, armrestMat);
    rightArm.position.set(0.28, 0.26, -0.02);
    this.chairSeatGroup.add(leftArm, rightArm);

    this.chairRoot.add(this.chairSeatGroup);

    // Register chair parts for dragging and physical movement
    this.registerInteractive(seat, 'chair');
    this.registerInteractive(backrest, 'chair');
    this.registerInteractive(headrest, 'chair');
    this.registerInteractive(leftBolster, 'chair');
    this.registerInteractive(rightBolster, 'chair');
    this.registerInteractive(leftArm, 'chair');
    this.registerInteractive(rightArm, 'chair');

    this.scene.add(this.chairRoot);
  }

  // ========================================================
  // ACOUSTIC HEADSET & DISPLAY STAND (Sonic Pulse Wave)
  // ========================================================
  private initHeadset() {
    const standGroup = new THREE.Group();
    standGroup.position.set(0.64, 0.875, 0.08);

    // Minimalist Stand
    const standBaseGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.015, 24);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b22,
      roughness: 0.35,
      metalness: 0.7,
    });
    const standBase = new THREE.Mesh(standBaseGeo, standMat);
    standBase.position.set(0, 0.008, 0);
    standGroup.add(standBase);

    const poleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.28, 16);
    const pole = new THREE.Mesh(poleGeo, standMat);
    pole.position.set(0, 0.14, 0);
    standGroup.add(pole);

    const hangerGeo = new THREE.BoxGeometry(0.06, 0.012, 0.04);
    const hanger = new THREE.Mesh(hangerGeo, standMat);
    hanger.position.set(0, 0.28, 0);
    standGroup.add(hanger);

    // Hanging Headset
    this.headsetGroup = new THREE.Group();
    this.headsetGroup.position.set(0, 0.23, 0);

    // Curved Headband
    const bandGeo = new THREE.TorusGeometry(0.075, 0.01, 12, 24, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x18141b,
      roughness: 0.5,
      metalness: 0.4,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI;
    band.position.set(0, 0.05, 0);
    this.headsetGroup.add(band);

    // Earcups
    const cupGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.03, 20);
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0x221a25,
      roughness: 0.4,
      metalness: 0.6,
    });
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa62b5f });

    // Left cup
    const leftCup = new THREE.Mesh(cupGeo, cupMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-0.08, 0.02, 0);
    const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 8, 20), ringMat);
    leftRing.position.set(-0.096, 0.02, 0);
    leftRing.rotation.y = Math.PI / 2;
    this.headsetGroup.add(leftCup, leftRing);

    // Right cup
    const rightCup = new THREE.Mesh(cupGeo, cupMat);
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(0.08, 0.02, 0);
    const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 8, 20), ringMat);
    rightRing.position.set(0.096, 0.02, 0);
    rightRing.rotation.y = Math.PI / 2;
    this.headsetGroup.add(rightCup, rightRing);

    standGroup.add(this.headsetGroup);

    // Sonic Pulse Rings (expand on interaction)
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.04 + i * 0.03, 0.046 + i * 0.03, 32);
      const sonicMat = new THREE.MeshBasicMaterial({
        color: 0xa62b5f,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, sonicMat);
      ring.position.set(0.64, 1.1, 0.08);
      ring.rotation.x = Math.PI / 2;
      this.sonicRings.push(ring);
      this.scene.add(ring);
    }

    this.registerInteractive(leftCup, 'headset');
    this.registerInteractive(rightCup, 'headset');
    this.registerInteractive(band, 'headset');

    this.scene.add(standGroup);
  }

  // ========================================================
  // EVOKE APEX LIQUID-COOLED PC TOWER (ON/OFF Interaction)
  // ========================================================
  private initPC() {
    const pcGroup = new THREE.Group();
    pcGroup.position.set(-0.76, 0.875, -0.05);

    // Chassis: Brushed Charcoal
    const caseGeo = new THREE.BoxGeometry(0.24, 0.46, 0.44);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x161418,
      roughness: 0.35,
      metalness: 0.8,
    });
    const pcCase = new THREE.Mesh(caseGeo, caseMat);
    pcCase.position.set(0, 0.23, 0);
    pcCase.castShadow = true;
    pcGroup.add(pcCase);

    // Smoked Tempered Glass Side Panel
    const glassGeo = new THREE.PlaneGeometry(0.42, 0.42);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x221323,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.6,
      ior: 1.5,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0.121, 0.23, 0);
    glass.rotation.y = Math.PI / 2;
    pcGroup.add(glass);

    // GPU Block inside
    const gpuGeo = new THREE.BoxGeometry(0.08, 0.06, 0.26);
    const gpuMat = new THREE.MeshStandardMaterial({
      color: 0x1d1720,
      metalness: 0.9,
      roughness: 0.2,
    });
    const gpu = new THREE.Mesh(gpuGeo, gpuMat);
    gpu.position.set(0, 0.18, 0.02);
    pcGroup.add(gpu);

    // GPU Side Badge "EVOKE"
    const gpuLedGeo = new THREE.BoxGeometry(0.01, 0.015, 0.16);
    const gpuLedMat = new THREE.MeshBasicMaterial({ color: 0xa62b5f });
    const gpuLed = new THREE.Mesh(gpuLedGeo, gpuLedMat);
    gpuLed.position.set(0.042, 0.18, 0.02);
    pcGroup.add(gpuLed);

    // Spinning Front Fans
    this.pcFanGroup = new THREE.Group();
    const fanGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16);
    const fanMat = new THREE.MeshBasicMaterial({ color: 0x3a102c });
    const fan1 = new THREE.Mesh(fanGeo, fanMat);
    fan1.position.set(0, 0.14, 0.21);
    fan1.rotation.x = Math.PI / 2;
    const fan2 = new THREE.Mesh(fanGeo, fanMat);
    fan2.position.set(0, 0.28, 0.21);
    fan2.rotation.x = Math.PI / 2;
    this.pcFanGroup.add(fan1, fan2);
    pcGroup.add(this.pcFanGroup);

    // Internal Liquid Cooling Radiator Glow
    this.pcCoolantLight = new THREE.PointLight(0xa62b5f, 2.8, 1.2);
    this.pcCoolantLight.position.set(0, 0.24, 0);
    pcGroup.add(this.pcCoolantLight);

    // Power LED & Power Switch Button on Top-Front Bevel
    const powerLedGeo = new THREE.BoxGeometry(0.018, 0.018, 0.012);
    const powerLedMat = new THREE.MeshBasicMaterial({ color: 0xe66a3a });
    this.pcPowerLedMesh = new THREE.Mesh(powerLedGeo, powerLedMat);
    this.pcPowerLedMesh.position.set(0.08, 0.44, 0.21);
    pcGroup.add(this.pcPowerLedMesh);

    // Register click to toggle PC Power ON/OFF
    this.registerInteractive(glass, 'pc');
    this.registerInteractive(pcCase, 'pc');
    this.registerInteractive(this.pcPowerLedMesh, 'pc');

    this.scene.add(pcGroup);
  }

  // ========================================================
  // MECHANICAL KEYBOARD & ESPORTS MOUSE
  // ========================================================
  private initKeyboardAndMouse() {
    const kbGroup = new THREE.Group();
    kbGroup.position.set(0, 0.885, 0.12);

    // Keyboard Base
    const kbBaseGeo = new THREE.BoxGeometry(0.38, 0.018, 0.14);
    const kbBaseMat = new THREE.MeshStandardMaterial({
      color: 0x19161c,
      roughness: 0.4,
      metalness: 0.7,
    });
    const kbBase = new THREE.Mesh(kbBaseGeo, kbBaseMat);
    kbBase.position.set(0, 0.009, 0);
    kbBase.castShadow = true;
    kbGroup.add(kbBase);

    // Key Matrix
    this.keyboardKeyGroup = new THREE.Group();
    const keyGeo = new THREE.BoxGeometry(0.018, 0.008, 0.018);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x221a24,
      roughness: 0.6,
      metalness: 0.3,
    });

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 14; c++) {
        const key = new THREE.Mesh(keyGeo, keyMat);
        key.position.set(-0.16 + c * 0.0245, 0.02, -0.048 + r * 0.024);
        this.keyboardKeyGroup.add(key);
      }
    }
    kbGroup.add(this.keyboardKeyGroup);

    // Mousepad surface on desk
    const padGeo = new THREE.BoxGeometry(0.86, 0.004, 0.38);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x131016,
      roughness: 0.85,
      metalness: 0.2,
    });
    const mousepad = new THREE.Mesh(padGeo, padMat);
    mousepad.position.set(0.12, 0.874, 0.13);
    mousepad.receiveShadow = true;
    this.scene.add(mousepad);

    // Mouse
    this.mouseGroup = new THREE.Group();
    this.mouseGroup.position.set(0.30, 0.885, 0.14);

    const mouseGeo = new THREE.BoxGeometry(0.065, 0.025, 0.11);
    const mouseMat = new THREE.MeshStandardMaterial({
      color: 0x1c1720,
      roughness: 0.3,
      metalness: 0.6,
    });
    this.mouseMesh = new THREE.Mesh(mouseGeo, mouseMat);
    this.mouseMesh.position.set(0, 0.012, 0);
    this.mouseMesh.castShadow = true;
    this.mouseGroup.add(this.mouseMesh);

    const wheelGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 16);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0xa62b5f });
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(0, 0.024, -0.025);
    wheel.rotation.z = Math.PI / 2;
    this.mouseGroup.add(wheel);

    this.registerInteractive(kbBase, 'keyboard');
    this.registerInteractive(this.mouseMesh, 'mouse');
    this.registerInteractive(wheel, 'mouse');

    this.scene.add(kbGroup);
    this.scene.add(this.mouseGroup);
  }

  // ========================================================
  // ATMOSPHERIC DUST PARTICLES & HAZE
  // ========================================================
  private initAtmosphere() {
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 6;
      positions[i + 1] = Math.random() * 3.5;
      positions[i + 2] = (Math.random() - 0.5) * 6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa62b5f,
      size: 0.018,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  // ========================================================
  // REGISTRATION & RAYCASTING
  // ========================================================
  private registerInteractive(object: THREE.Object3D, id: InteractiveObjectId) {
    this.interactiveMeshes.set(object, id);
  }

  // ========================================================
  // USER ACTIONS / INTERACTION METHODS
  // ========================================================
  public triggerObjectInteraction(id: InteractiveObjectId) {
    switch (id) {
      case 'monitor_power':
        this.toggleMonitorPower();
        break;

      case 'monitor':
        // Clicking monitor zooms in to inspect the screen
        if (this.mode === 'monitor') {
          this.setMode('orbit');
        } else {
          this.setMode('monitor');
        }
        break;

      case 'chair':
        // Spin chair a complete 360 degrees
        this.spinChair360();
        break;

      case 'mouse':
        soundscape.playClick(1050);
        break;

      case 'headset':
        this.headsetWobble = 1.0;
        this.emitSonicPulse();
        soundscape.playClick(920);
        break;

      case 'pc':
        this.togglePCPower();
        break;

      case 'keyboard':
        this.keyboardWaveTime = 0.01;
        soundscape.playClick(1100);
        break;

      case 'controller':
        soundscape.playClick(750);
        break;
    }

    this.callbacks.onSelectObject(id);
  }

  public spinChair360() {
    this.chairSpinVelocity += Math.PI * 2;
    soundscape.playClick(580);
    this.callbacks.onSelectObject('chair');
  }

  public triggerSonicPulse() {
    this.headsetWobble = 0.9;
    this.emitSonicPulse();
  }

  public toggleMonitorPower() {
    this.isMonitorPowered = !this.isMonitorPowered;
    soundscape.playPowerToggle(this.isMonitorPowered);

    if (this.isMonitorPowered) {
      // Powering ON: Vivid Mauve LED & bias backlight
      (this.monitorStandbyLedMesh.material as THREE.MeshBasicMaterial).color.setHex(0xa62b5f);
      this.monitorStandbyLight.color.setHex(0xa62b5f);
      this.monitorStandbyLight.intensity = 0.9;
      this.monitorBiasLight.intensity = 2.4;
    } else {
      // Powering OFF: Burnt Orange standby LED
      (this.monitorStandbyLedMesh.material as THREE.MeshBasicMaterial).color.setHex(0xe66a3a);
      this.monitorStandbyLight.color.setHex(0xe66a3a);
      this.monitorStandbyLight.intensity = 0.4;
      this.monitorBiasLight.intensity = 0.2;
    }

    this.callbacks.onMonitorPowerToggle(this.isMonitorPowered);
    this.callbacks.onSelectObject('monitor_power');
  }

  public togglePCPower() {
    this.isPCPowered = !this.isPCPowered;
    soundscape.playPowerToggle(this.isPCPowered);

    if (this.isPCPowered) {
      this.pcTargetFanSpeed = 0.08;
      this.pcCoolantLight.intensity = 2.8;
      (this.pcPowerLedMesh.material as THREE.MeshBasicMaterial).color.setHex(0xe66a3a);
    } else {
      this.pcTargetFanSpeed = 0.0;
      this.pcCoolantLight.intensity = 0.0;
      (this.pcPowerLedMesh.material as THREE.MeshBasicMaterial).color.setHex(0x280d18);
    }

    this.callbacks.onPCPowerToggle(this.isPCPowered);
    this.callbacks.onSelectObject('pc');
  }

  private emitSonicPulse() {
    this.sonicRings.forEach((ring, idx) => {
      ring.scale.set(0.8, 0.8, 0.8);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.9;
      setTimeout(() => {
        const expand = () => {
          ring.scale.addScalar(0.04);
          (ring.material as THREE.MeshBasicMaterial).opacity *= 0.92;
          if ((ring.material as THREE.MeshBasicMaterial).opacity > 0.02) {
            requestAnimationFrame(expand);
          }
        };
        requestAnimationFrame(expand);
      }, idx * 100);
    });
  }

  // ----------------------------------------------------
  // SCROLL PROGRESS INTEGRATION (0 to 1)
  // ----------------------------------------------------
  public setScrollProgress(progress: number) {
    this.scrollProgress = Math.min(Math.max(progress, 0), 1);
    soundscape.updateScroll(this.scrollProgress);

    // If in normal orbit mode, adjust subtle camera framing with scroll story
    if (this.mode === 'orbit') {
      const p = this.scrollProgress;
      if (p <= 0.25) {
        // Stage 1: Moody room overview
        this.targetSpherical.radius = THREE.MathUtils.lerp(3.4, 3.2, p / 0.25);
        this.targetSpherical.phi = THREE.MathUtils.lerp(1.22, 1.25, p / 0.25);
        this.targetSpherical.theta = THREE.MathUtils.lerp(0.38, 0.26, p / 0.25);
        this.targetLookAt.set(0, 0.95, 0);
      } else if (p <= 0.6) {
        // Stage 2: Kinetic focus on setup
        const t = (p - 0.25) / 0.35;
        this.targetSpherical.radius = THREE.MathUtils.lerp(3.2, 2.9, t);
        this.targetSpherical.phi = THREE.MathUtils.lerp(1.25, 1.28, t);
        this.targetSpherical.theta = THREE.MathUtils.lerp(0.26, 0.12, t);
        this.targetLookAt.set(0, 0.98, 0);
      } else if (p <= 0.85) {
        // Stage 3: Monitor focal point
        const t = (p - 0.6) / 0.25;
        this.targetSpherical.radius = THREE.MathUtils.lerp(2.9, 2.7, t);
        this.targetSpherical.phi = THREE.MathUtils.lerp(1.28, 1.32, t);
        this.targetSpherical.theta = THREE.MathUtils.lerp(0.12, 0.04, t);
        this.targetLookAt.set(0, 1.05, -0.05);
      } else {
        // Stage 4: Grand reveal composition
        const t = (p - 0.85) / 0.15;
        this.targetSpherical.radius = THREE.MathUtils.lerp(2.7, 3.4, t);
        this.targetSpherical.phi = THREE.MathUtils.lerp(1.32, 1.26, t);
        this.targetSpherical.theta = THREE.MathUtils.lerp(0.04, 0.08, t);
        this.targetLookAt.set(0, 0.98, 0);
      }

      // Shift environmental lighting subtly with scroll
      this.mauveSpotLight.intensity = THREE.MathUtils.lerp(3.8, 5.2, p);
      this.ambientLight.intensity = THREE.MathUtils.lerp(0.85, 1.1, p);
    }
  }

  public setMode(newMode: 'orbit' | 'monitor' | 'reveal') {
    this.mode = newMode;

    if (newMode === 'monitor') {
      // Zoom right in on the monitor screen & power controls
      this.targetSpherical.radius = 1.35;
      this.targetSpherical.phi = 1.48;
      this.targetSpherical.theta = 0.01;
      this.targetLookAt.set(0, 1.24, -0.15);
    } else if (newMode === 'reveal') {
      // Epic low-angle centered framing
      this.targetSpherical.radius = 3.6;
      this.targetSpherical.phi = 1.35;
      this.targetSpherical.theta = 0.0;
      this.targetLookAt.set(0, 1.08, 0);
    } else {
      // Return to orbit mode (re-aligns to scroll position)
      this.setScrollProgress(this.scrollProgress);
    }
  }

  // ========================================================
  // INPUT & GESTURE EVENT HANDLERS
  // ========================================================
  private bindEvents() {
    const el = this.renderer.domElement;

    // Pointer Down (Mouse / Touch)
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.pointerStart.x = clientX;
      this.pointerStart.y = clientY;
      this.sphericalStart.phi = this.targetSpherical.phi;
      this.sphericalStart.theta = this.targetSpherical.theta;

      this.updatePointerCoords(clientX, clientY);

      // Raycast to check for interactive objects
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(
        Array.from(this.interactiveMeshes.keys()),
        true
      );

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const objectId = this.interactiveMeshes.get(hitMesh) || this.findParentInteractiveId(hitMesh);

        // 1. Controller Drag Initiate
        if (objectId === 'controller') {
          this.isDraggingController = true;
          this.controllerDragPos.copy(this.controllerGroup.position);
          this.controllerDragPos.y = 0.89 + 0.16; // Lift up off desk
          this.callbacks.onControllerDragStart();
          soundscape.playClick(820);
          return;
        }

        // 2. Chair Drag Initiate (Allows 360 degree spin and floor glide)
        if (objectId === 'chair') {
          this.isDraggingChair = true;
          this.chairDragStartCoord = { x: clientX, y: clientY };
          this.chairDragStartSwivel = this.chairSwivelAngle;
          // Calculate offset on floor plane
          const hitFloor = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(this.chairFloorPlane, hitFloor)) {
            this.chairDragOffset.subVectors(this.chairRoot.position, hitFloor);
          }
          this.callbacks.onChairDragStart();
          soundscape.playClick(680);
          return;
        }

        // 3. Mouse Drag Initiate (Glide mouse on desk to move monitor cursor)
        if (objectId === 'mouse') {
          this.isDraggingMouse = true;
          this.callbacks.onMouseDragStart?.();
          soundscape.playClick(1050);
          return;
        }
      }

      this.isPointerDown = true;
    };

    // Pointer Move
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      this.updatePointerCoords(clientX, clientY);

      // Mouse Parallax target
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = -(clientY / window.innerHeight) * 2 + 1;
      this.mouseParallax.targetX = nx * 0.1;
      this.mouseParallax.targetY = ny * 0.06;

      // 1. Controller Dragging in 3D
      if (this.isDraggingController) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersectPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.deskDragPlane, intersectPoint)) {
          // Clamp to desk bounds
          const targetX = THREE.MathUtils.clamp(intersectPoint.x, -0.65, 0.65);
          const targetZ = THREE.MathUtils.clamp(intersectPoint.z, -0.15, 0.42);
          const targetY = 0.89 + 0.16; // Lifted above desk

          this.controllerVelocity.set(
            (targetX - this.controllerDragPos.x) * 0.5,
            0,
            (targetZ - this.controllerDragPos.z) * 0.5
          );

          this.controllerDragPos.set(targetX, targetY, targetZ);
        }
        return;
      }

      // 2. Gaming Mouse Dragging (Moves cursor live on monitor screen!)
      if (this.isDraggingMouse) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersectPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.deskDragPlane, intersectPoint)) {
          const clampedX = THREE.MathUtils.clamp(intersectPoint.x, 0.12, 0.48);
          const clampedZ = THREE.MathUtils.clamp(intersectPoint.z, -0.06, 0.28);
          this.mouseGroup.position.set(clampedX, 0.885, clampedZ);

          const normX = (clampedX - 0.12) / (0.48 - 0.12);
          const normY = (clampedZ - (-0.06)) / (0.28 - (-0.06));
          this.monitorCursorX = THREE.MathUtils.clamp(normX * 1024, 25, 995);
          this.monitorCursorY = THREE.MathUtils.clamp((1.0 - normY) * 512, 25, 485);
          this.callbacks.onMouseDrag?.(normX, normY);
        }
        return;
      }

      // 3. Gaming Chair Dragging in 3D (360° spin + floor gliding)
      if (this.isDraggingChair) {
        const deltaX = clientX - this.chairDragStartCoord.x;
        // Continuous 360 degree spin rotation as chair is dragged horizontally
        this.chairTargetSwivel = this.chairDragStartSwivel + deltaX * 0.022;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersectFloor = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.chairFloorPlane, intersectFloor)) {
          const rawTargetX = intersectFloor.x + this.chairDragOffset.x;
          const rawTargetZ = intersectFloor.z + this.chairDragOffset.z;
          const targetX = THREE.MathUtils.clamp(rawTargetX, -1.3, 1.3);
          const targetZ = THREE.MathUtils.clamp(rawTargetZ, 0.40, 1.6);

          this.chairVelocity.set(
            (targetX - this.chairPos.x) * 0.4,
            0,
            (targetZ - this.chairPos.z) * 0.4
          );

          this.chairTargetPos.set(targetX, 0, targetZ);
        }
        return;
      }

      // 4. Camera Orbit Rotation
      if (this.isPointerDown) {
        const deltaX = clientX - this.pointerStart.x;
        const deltaY = clientY - this.pointerStart.y;

        const sensitivity = 0.0055;
        this.targetSpherical.theta = this.sphericalStart.theta - deltaX * sensitivity;
        this.targetSpherical.phi = THREE.MathUtils.clamp(
          this.sphericalStart.phi - deltaY * sensitivity,
          0.6,
          Math.PI / 2 - 0.05
        );
        return;
      }

      // 5. Hover Raycasting Detection
      this.performHoverCheck(clientX, clientY);
    };

    // Pointer Up
    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;

      const dist = Math.hypot(clientX - this.pointerStart.x, clientY - this.pointerStart.y);

      if (this.isDraggingController) {
        this.isDraggingController = false;
        // Settle controller down on desk surface at drop location
        this.controllerRestPos.copy(this.controllerDragPos);
        this.controllerRestPos.y = 0.89; // Desk surface level
        this.callbacks.onControllerDragEnd();
        this.callbacks.onSelectObject('controller');
        soundscape.playClick(620);
      } else if (this.isDraggingChair) {
        this.isDraggingChair = false;
        this.callbacks.onChairDragEnd();
        this.callbacks.onSelectObject('chair');
        soundscape.playClick(580);
      } else if (this.isDraggingMouse) {
        this.isDraggingMouse = false;
        this.callbacks.onMouseDragEnd?.();
        this.callbacks.onSelectObject('mouse');
        soundscape.playClick(980);
      } else if (dist < 6) {
        // Distinct click / tap on object
        this.updatePointerCoords(clientX, clientY);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(
          Array.from(this.interactiveMeshes.keys()),
          true
        );

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object;
          const objectId = this.interactiveMeshes.get(hitMesh) || this.findParentInteractiveId(hitMesh);
          if (objectId) {
            this.triggerObjectInteraction(objectId);
          }
        }
      }

      this.isPointerDown = false;
    };

    // Mouse Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      // If user zooms via wheel while in monitor mode, allow zooming in/out
      if (this.mode === 'monitor') {
        const zoomFactor = e.deltaY * 0.0015;
        this.targetSpherical.radius = THREE.MathUtils.clamp(
          this.targetSpherical.radius + zoomFactor,
          0.9,
          2.6
        );
      }
    };

    // Window Resize
    const onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      const aspect = w / h;
      this.camera.aspect = aspect;
      this.camera.fov = w < 768 || aspect < 1.0 ? 54 : 44;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    el.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: true });

    el.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if ((this.isDraggingChair || this.isDraggingController) && e.cancelable) {
          e.preventDefault();
        }
        onPointerMove(e);
      },
      { passive: false }
    );
    window.addEventListener('touchend', onPointerUp, { passive: true });
    window.addEventListener('resize', onResize);
  }

  private updatePointerCoords(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private findParentInteractiveId(mesh: THREE.Object3D): InteractiveObjectId | null {
    let curr: THREE.Object3D | null = mesh;
    while (curr) {
      if (this.interactiveMeshes.has(curr)) {
        return this.interactiveMeshes.get(curr)!;
      }
      curr = curr.parent;
    }
    return null;
  }

  private performHoverCheck(clientX: number, clientY: number) {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(
      Array.from(this.interactiveMeshes.keys()),
      true
    );

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const objectId = this.interactiveMeshes.get(hitMesh) || this.findParentInteractiveId(hitMesh);

      if (objectId !== this.hoveredId) {
        this.hoveredId = objectId;
        this.renderer.domElement.style.cursor =
          objectId === 'controller' || objectId === 'chair' ? 'grab' : 'pointer';
        this.callbacks.onHoverObject(objectId, { x: clientX, y: clientY });
      }

      this.isKeyboardHovered = objectId === 'keyboard';
    } else {
      if (this.hoveredId !== null) {
        this.hoveredId = null;
        this.renderer.domElement.style.cursor = 'default';
        this.callbacks.onHoverObject(null);
      }
      this.isKeyboardHovered = false;
    }
  }

  // ========================================================
  // RENDER & ANIMATION TICK
  // ========================================================
  private updateCameraPosition() {
    this.currentSpherical.radius += (this.targetSpherical.radius - this.currentSpherical.radius) * 0.08;
    this.currentSpherical.phi += (this.targetSpherical.phi - this.currentSpherical.phi) * 0.08;
    this.currentSpherical.theta += (this.targetSpherical.theta - this.currentSpherical.theta) * 0.08;

    this.currentLookAt.lerp(this.targetLookAt, 0.08);

    this.mouseParallax.x += (this.mouseParallax.targetX - this.mouseParallax.x) * 0.05;
    this.mouseParallax.y += (this.mouseParallax.targetY - this.mouseParallax.y) * 0.05;

    const sinPhi = Math.sin(this.currentSpherical.phi);
    const cosPhi = Math.cos(this.currentSpherical.phi);
    const sinTheta = Math.sin(this.currentSpherical.theta);
    const cosTheta = Math.cos(this.currentSpherical.theta);
    const r = this.currentSpherical.radius;

    const x = r * sinPhi * sinTheta + this.mouseParallax.x;
    const y = r * cosPhi + this.mouseParallax.y;
    const z = r * sinPhi * cosTheta;

    this.camera.position.set(
      this.currentLookAt.x + x,
      this.currentLookAt.y + y,
      this.currentLookAt.z + z
    );
    this.camera.lookAt(this.currentLookAt);
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    // 1. Camera
    this.updateCameraPosition();

    // 2. Controller Dynamics (Drag & Settle Physics)
    if (this.isDraggingController) {
      this.controllerGroup.position.lerp(this.controllerDragPos, 0.25);
      this.controllerGroup.rotation.z = -this.controllerVelocity.x * 3.0;
      this.controllerGroup.rotation.x = -0.22 + this.controllerVelocity.z * 2.2;
    } else {
      this.controllerGroup.position.lerp(this.controllerRestPos, 0.12);
      this.controllerGroup.rotation.x = THREE.MathUtils.lerp(
        this.controllerGroup.rotation.x,
        this.controllerRestRot.x,
        0.1
      );
      this.controllerGroup.rotation.y = THREE.MathUtils.lerp(
        this.controllerGroup.rotation.y,
        this.controllerRestRot.y,
        0.1
      );
      this.controllerGroup.rotation.z = THREE.MathUtils.lerp(
        this.controllerGroup.rotation.z,
        this.controllerRestRot.z,
        0.1
      );
      this.controllerDragPos.copy(this.controllerGroup.position);
    }

    // 3. Chair Dragging & Inertia Physics
    if (this.isDraggingChair) {
      this.chairPos.lerp(this.chairTargetPos, 0.22);
      this.chairRoot.position.copy(this.chairPos);
    } else {
      // Natural inertia coasting and settling damping
      if (this.chairVelocity.lengthSq() > 0.00001) {
        this.chairPos.add(this.chairVelocity);
        this.chairPos.x = THREE.MathUtils.clamp(this.chairPos.x, -1.3, 1.3);
        this.chairPos.z = THREE.MathUtils.clamp(this.chairPos.z, 0.38, 1.8);
        this.chairRoot.position.copy(this.chairPos);
        this.chairVelocity.multiplyScalar(0.88); // Friction
      }
    }

    // Chair 360° Swivel & Spin Physics
    this.chairSwivelAngle += (this.chairTargetSwivel - this.chairSwivelAngle) * 0.12 + this.chairSpinVelocity;
    this.chairSpinVelocity *= 0.92;
    if (this.chairSeatGroup) {
      this.chairSeatGroup.rotation.y = this.chairSwivelAngle;
    }

    // 4. Headset Wobble
    if (this.headsetWobble > 0.001) {
      this.headsetGroup.rotation.z = Math.sin(time * 22) * this.headsetWobble * 0.15;
      this.headsetWobble *= 0.93;
    } else {
      this.headsetGroup.rotation.z = 0;
    }

    // 5. PC Internals & Fan Speeds
    if (this.pcFanGroup) {
      this.pcFanSpeed += (this.pcTargetFanSpeed - this.pcFanSpeed) * 0.04;
      this.pcFanGroup.rotation.z += this.pcFanSpeed;

      if (this.isPCPowered) {
        this.pcCoolantLight.intensity = 2.4 + Math.sin(time * 3.5) * 0.6;
      }
    }

    // 6. Monitor Screen Canvas Animation & Power Transitions
    if (this.isMonitorPowered) {
      this.monitorBootProgress = Math.min(this.monitorBootProgress + 0.035, 1.0);
    } else {
      this.monitorBootProgress = Math.max(this.monitorBootProgress - 0.04, 0.0);
    }
    this.drawMonitorScreen(time);

    // 7. Keyboard Reactive Light Waves
    if (this.isKeyboardHovered || this.keyboardWaveTime > 0) {
      const keys = this.keyboardKeyGroup.children as THREE.Mesh[];
      keys.forEach((key) => {
        const wave = Math.sin(time * 6 - key.position.x * 12) * 0.5 + 0.5;
        (key.material as THREE.MeshStandardMaterial).color.setHex(
          wave > 0.6 ? 0xa62b5f : 0x221a24
        );
      });
      if (this.keyboardWaveTime > 0) {
        this.keyboardWaveTime += 0.02;
        if (this.keyboardWaveTime > 2.0) this.keyboardWaveTime = 0;
      }
    }

    // 8. Atmospheric Dust Particle Drift
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += 0.0012;
        if (pos[i] > 3.5) pos[i] = 0.2;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
