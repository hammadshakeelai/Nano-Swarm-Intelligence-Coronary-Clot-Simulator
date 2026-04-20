import {
  AdditiveBlending,
  AmbientLight,
  ArrowHelper,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  Fog,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

import type {
  CameraMode,
  CurveVariant,
  ScenarioConfig,
  SimulationRenderState,
} from "../sim";

const MAX_VISIBLE_AGENTS = 1000;
const FLOW_PARTICLE_COUNT = 88;
const FIBRIN_STRAND_COUNT = 14;
const INTERACTION_SPIRAL_POINTS = 30;
const OUTER_RADIUS = 0.205;
const INNER_RADIUS = 0.152;

export interface SceneViewState {
  camera: CameraMode;
  overlay: "clean" | "fluoro";
  reducedMotion: boolean;
}

interface CurveFrame {
  point: Vector3;
  tangent: Vector3;
  normal: Vector3;
  binormal: Vector3;
}

export class ArteryScene {
  private readonly container: HTMLElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 100);
  private readonly mildCurve = new CatmullRomCurve3(
    [
      new Vector3(-2.45, 0.12, -0.45),
      new Vector3(-1.4, 0.38, -0.22),
      new Vector3(-0.15, 0.08, 0.08),
      new Vector3(0.95, -0.2, 0.32),
      new Vector3(2.25, -0.08, 0.54),
    ],
    false,
    "catmullrom",
    0.2,
  );
  private readonly straightCurve = new CatmullRomCurve3(
    [
      new Vector3(-2.45, 0.04, -0.18),
      new Vector3(-1.28, 0.06, -0.08),
      new Vector3(-0.12, 0.04, 0.02),
      new Vector3(1.16, -0.02, 0.11),
      new Vector3(2.3, -0.06, 0.18),
    ],
    false,
    "catmullrom",
    0.2,
  );
  private curve = this.mildCurve;
  private activeCurveVariant: CurveVariant = "mild";
  private readonly arteryGroup = new Group();
  private readonly outerTube: Mesh;
  private readonly cutawayBand: Mesh;
  private readonly innerTube: Mesh;
  private readonly clotMesh: Mesh;
  private readonly clotChannelMesh: Mesh;
  private readonly swarmMesh: InstancedMesh;
  private readonly flowCells: InstancedMesh;
  private readonly swarmFluoroPoints: Points;
  private readonly flowPoints: Points;
  private readonly fibrinThreads: LineSegments;
  private readonly interactionSpiral: Line;
  private readonly fieldArrow: ArrowHelper;
  private readonly dummy = new Object3D();
  private readonly instanceMatrix = new Matrix4();
  private readonly worldUp = new Vector3(0, 1, 0);
  private readonly altUp = new Vector3(1, 0, 0);
  private readonly cameraTarget = new Vector3();
  private readonly flowOffsets = Array.from(
    { length: FLOW_PARTICLE_COUNT },
    (_, index) => ({
      radialA: Math.sin(index * 2.17) * 0.55,
      radialB: Math.cos(index * 1.43) * 0.55,
    }),
  );
  private readonly outerMaterial = new MeshStandardMaterial({
    color: new Color("#7b4c58"),
    transparent: true,
    opacity: 0.12,
    roughness: 0.86,
    metalness: 0.02,
    emissive: new Color("#17070a"),
    emissiveIntensity: 0.34,
    side: DoubleSide,
    depthWrite: false,
  });
  private readonly cutawayMaterial = new MeshStandardMaterial({
    color: new Color("#965564"),
    transparent: true,
    opacity: 0.74,
    roughness: 0.72,
    metalness: 0.04,
    emissive: new Color("#23090d"),
    emissiveIntensity: 0.36,
    side: DoubleSide,
    depthWrite: false,
  });
  private readonly innerMaterial = new MeshStandardMaterial({
    color: new Color("#65111b"),
    transparent: true,
    opacity: 0.96,
    roughness: 0.88,
    metalness: 0,
    emissive: new Color("#2d0b10"),
    emissiveIntensity: 0.42,
    side: DoubleSide,
  });
  private readonly clotMaterial = new MeshStandardMaterial({
    color: new Color("#5a1118"),
    roughness: 0.94,
    metalness: 0.02,
    emissive: new Color("#2a090d"),
    emissiveIntensity: 0.48,
  });
  private readonly clotChannelMaterial = new MeshStandardMaterial({
    color: new Color("#ffd0b8"),
    roughness: 0.42,
    metalness: 0.04,
    emissive: new Color("#6edbe2"),
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  private readonly swarmMaterial = new MeshStandardMaterial({
    color: new Color("#e7ffff"),
    roughness: 0.14,
    metalness: 0.08,
    emissive: new Color("#5fe3eb"),
    emissiveIntensity: 0.62,
  });
  private readonly flowCellMaterial = new MeshStandardMaterial({
    color: new Color("#b42331"),
    roughness: 0.58,
    metalness: 0.02,
    emissive: new Color("#541017"),
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.9,
  });
  private readonly flowMaterial = new PointsMaterial({
    color: new Color("#ffb9a6"),
    size: 0.05,
    transparent: true,
    opacity: 0.18,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  private readonly swarmFluoroMaterial = new PointsMaterial({
    color: new Color("#f5fbff"),
    size: 0.072,
    transparent: true,
    opacity: 0.92,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  private readonly fibrinMaterial = new LineBasicMaterial({
    color: new Color("#f4ddc9"),
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  private readonly spiralMaterial = new LineBasicMaterial({
    color: new Color("#a7fdff"),
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setSize(100, 100, false);
    this.container.append(this.renderer.domElement);

    this.scene.fog = new Fog("#160a0f", 4.1, 8.2);

    this.outerTube = new Mesh(
      this.createTubeGeometry(OUTER_RADIUS, 24),
      this.outerMaterial,
    );
    this.cutawayBand = new Mesh(
      this.createCutawayBandGeometry(),
      this.cutawayMaterial,
    );
    this.innerTube = new Mesh(
      this.createTubeGeometry(INNER_RADIUS, 20),
      this.innerMaterial,
    );
    this.clotMesh = new Mesh(this.createClotGeometry(), this.clotMaterial);
    this.clotChannelMesh = new Mesh(
      new SphereGeometry(0.11, 12, 10),
      this.clotChannelMaterial,
    );
    this.swarmMesh = new InstancedMesh(
      new ConeGeometry(0.025, 0.09, 5),
      this.swarmMaterial,
      MAX_VISIBLE_AGENTS,
    );
    this.flowCells = new InstancedMesh(
      new SphereGeometry(0.03, 8, 8),
      this.flowCellMaterial,
      FLOW_PARTICLE_COUNT,
    );
    this.swarmMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.flowCells.instanceMatrix.setUsage(DynamicDrawUsage);

    this.swarmFluoroPoints = new Points(
      new BufferGeometry(),
      this.swarmFluoroMaterial,
    );
    this.flowPoints = new Points(new BufferGeometry(), this.flowMaterial);
    this.fibrinThreads = new LineSegments(
      new BufferGeometry(),
      this.fibrinMaterial,
    );
    this.interactionSpiral = new Line(new BufferGeometry(), this.spiralMaterial);
    this.fieldArrow = new ArrowHelper(
      new Vector3(1, 0, 0),
      new Vector3(-2.02, 0.54, -0.58),
      1.02,
      0xffca72,
      0.2,
      0.1,
    );

    const flowPositions = new Float32Array(FLOW_PARTICLE_COUNT * 3);
    const fluoroPositions = new Float32Array(MAX_VISIBLE_AGENTS * 3);
    const fibrinPositions = new Float32Array(FIBRIN_STRAND_COUNT * 2 * 3);
    const spiralPositions = new Float32Array(INTERACTION_SPIRAL_POINTS * 3);
    this.flowPoints.geometry.setAttribute(
      "position",
      new BufferAttribute(flowPositions, 3),
    );
    this.swarmFluoroPoints.geometry.setAttribute(
      "position",
      new BufferAttribute(fluoroPositions, 3),
    );
    this.fibrinThreads.geometry.setAttribute(
      "position",
      new BufferAttribute(fibrinPositions, 3),
    );
    this.interactionSpiral.geometry.setAttribute(
      "position",
      new BufferAttribute(spiralPositions, 3),
    );

    this.outerTube.renderOrder = 1;
    this.cutawayBand.renderOrder = 2;
    this.innerTube.renderOrder = 3;
    this.flowCells.renderOrder = 4;
    this.flowPoints.renderOrder = 4;
    this.clotMesh.renderOrder = 5;
    this.clotChannelMesh.renderOrder = 6;
    this.fibrinThreads.renderOrder = 7;
    this.swarmMesh.renderOrder = 8;
    this.swarmFluoroPoints.renderOrder = 8;
    this.interactionSpiral.renderOrder = 9;

    this.arteryGroup.add(
      this.outerTube,
      this.cutawayBand,
      this.innerTube,
      this.flowCells,
      this.flowPoints,
      this.clotMesh,
      this.clotChannelMesh,
      this.fibrinThreads,
      this.interactionSpiral,
      this.swarmMesh,
      this.swarmFluoroPoints,
    );
    this.scene.add(this.arteryGroup, this.fieldArrow);

    const ambient = new AmbientLight("#f6d8d0", 0.7);
    const keyLight = new DirectionalLight("#fff6f0", 1.42);
    keyLight.position.set(3.8, 2.9, 4.3);
    const vesselLight = new DirectionalLight("#ff9d86", 0.72);
    vesselLight.position.set(1.2, -1.4, 2.4);
    const rimLight = new DirectionalLight("#7ef7ff", 0.46);
    rimLight.position.set(-4.1, 2.1, -2.8);
    this.scene.add(ambient, keyLight, vesselLight, rimLight);

    this.camera.position.set(2.28, 0.88, 2.62);
    this.camera.lookAt(this.curve.getPointAt(0.58));
    this.cameraTarget.copy(this.curve.getPointAt(0.58));
  }

  private createTubeGeometry(radius: number, radialSegments: number) {
    return new TubeGeometry(this.curve, 180, radius, radialSegments, false);
  }

  private createClotGeometry() {
    const geometry = new SphereGeometry(0.34, 22, 18);
    const positions = geometry.getAttribute("position") as BufferAttribute;
    const vertex = new Vector3();
    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index);
      const normal = vertex.clone().normalize();
      const ridge =
        Math.sin(normal.x * 7.4 + normal.y * 5.8) * 0.08 +
        Math.cos(normal.z * 6.1 - normal.y * 4.6) * 0.05;
      const lobe = Math.sin((normal.x - normal.z) * 9.5) * 0.04;
      const wallBias = Math.max(0, normal.y * 0.75 + normal.z * 0.35) * 0.16;
      vertex.multiplyScalar(1 + ridge + lobe + wallBias);
      vertex.x *= 1.06;
      vertex.y *= 0.88;
      vertex.z *= 1.12;
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  private createCutawayBandGeometry() {
    const geometry = new BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const segments = 72;
    const startT = 0.14;
    const endT = 0.93;
    const angleA = 0.96;
    const angleB = 3.08;

    for (let index = 0; index <= segments; index += 1) {
      const progress = index / segments;
      const t = startT + (endT - startT) * progress;
      const frame = this.getCurveFrame(t, 1);
      const normalDir = frame.normal.clone().normalize();
      const binormalDir = frame.binormal.clone().normalize();
      const dirA = normalDir
        .clone()
        .multiplyScalar(Math.cos(angleA))
        .add(binormalDir.clone().multiplyScalar(Math.sin(angleA)))
        .normalize();
      const dirB = normalDir
        .clone()
        .multiplyScalar(Math.cos(angleB))
        .add(binormalDir.clone().multiplyScalar(Math.sin(angleB)))
        .normalize();
      const bandRadius = OUTER_RADIUS * (1.015 + Math.sin(progress * Math.PI) * 0.015);
      const pointA = frame.point.clone().add(dirA.multiplyScalar(bandRadius));
      const pointB = frame.point.clone().add(dirB.multiplyScalar(bandRadius * 0.985));

      positions.push(
        pointA.x,
        pointA.y,
        pointA.z,
        pointB.x,
        pointB.y,
        pointB.z,
      );
      uvs.push(0, progress, 1, progress);

      if (index < segments) {
        const base = index * 2;
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      }
    }

    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), 3),
    );
    geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  private rebuildStaticGeometry() {
    this.outerTube.geometry.dispose();
    this.innerTube.geometry.dispose();
    this.cutawayBand.geometry.dispose();
    this.outerTube.geometry = this.createTubeGeometry(OUTER_RADIUS, 24);
    this.innerTube.geometry = this.createTubeGeometry(INNER_RADIUS, 20);
    this.cutawayBand.geometry = this.createCutawayBandGeometry();
  }

  private updateCurveVariant(variant: CurveVariant) {
    if (this.activeCurveVariant === variant) {
      return;
    }

    this.activeCurveVariant = variant;
    this.curve = variant === "straight" ? this.straightCurve : this.mildCurve;
    this.rebuildStaticGeometry();
  }

  private getCurveFrame(t: number, diameterScale: number): CurveFrame {
    const clamped = Math.min(0.999, Math.max(0.001, t));
    const point = this.curve.getPointAt(clamped);
    const tangent = this.curve.getTangentAt(clamped).normalize();
    const up =
      Math.abs(tangent.dot(this.worldUp)) > 0.94 ? this.altUp : this.worldUp;
    const normal = new Vector3().crossVectors(up, tangent).normalize();
    const binormal = new Vector3().crossVectors(tangent, normal).normalize();

    return {
      point,
      tangent,
      normal: normal.multiplyScalar(diameterScale),
      binormal: binormal.multiplyScalar(diameterScale),
    };
  }

  private toWorldPosition(
    t: number,
    radialY: number,
    radialZ: number,
    diameterScale: number,
  ): CurveFrame {
    const frame = this.getCurveFrame(t, diameterScale);
    frame.point
      .add(frame.normal.clone().multiplyScalar(radialY * 2.4))
      .add(frame.binormal.clone().multiplyScalar(radialZ * 2.4));
    return frame;
  }

  private applyCamera(
    viewState: SceneViewState,
    frame: SimulationRenderState,
    clotFrame: CurveFrame,
    config: ScenarioConfig,
  ) {
    const vesselMidpoint = clotFrame.point
      .clone()
      .lerp(this.curve.getPointAt(0.54), 0.34);
    const swarmFrame = this.toWorldPosition(
      frame.centroid.x,
      frame.centroid.y,
      frame.centroid.z,
      config.vessel.diameterScale,
    );

    let desiredPosition = clotFrame.point.clone().add(new Vector3(2.02, 0.78, 2.1));
    let desiredTarget = vesselMidpoint;
    let desiredFov = 28;

    if (viewState.camera === "followSwarm") {
      desiredPosition = swarmFrame.point
        .clone()
        .add(new Vector3(1.18, 0.58, 1.18));
      desiredTarget = swarmFrame.point.clone().lerp(clotFrame.point, 0.22);
      desiredFov = 24;
    } else if (viewState.camera === "clotCloseup") {
      desiredPosition = clotFrame.point
        .clone()
        .add(new Vector3(0.54, 0.18, 0.58));
      desiredTarget = clotFrame.point.clone().add(new Vector3(-0.03, 0.01, 0));
      desiredFov = 18;
    } else if (viewState.camera === "fluoro") {
      desiredPosition = new Vector3(0.24, 3.02, 0.38);
      desiredTarget = clotFrame.point.clone();
      desiredFov = 18;
    }

    const smoothing = viewState.reducedMotion ? 1 : 0.12;
    this.camera.position.lerp(desiredPosition, smoothing);
    this.cameraTarget.lerp(desiredTarget, smoothing);
    this.camera.fov +=
      (desiredFov - this.camera.fov) * (viewState.reducedMotion ? 1 : 0.18);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.cameraTarget);
  }

  update(
    frame: SimulationRenderState,
    viewState: SceneViewState,
    config: ScenarioConfig,
  ) {
    this.updateCurveVariant(config.vessel.curveVariant);

    const isFluoro =
      viewState.overlay === "fluoro" || viewState.camera === "fluoro";
    const localizedRatio =
      frame.swarmState?.localizationRatio ??
      frame.snapshot.metrics.localizationPct / 100;
    const coordination =
      frame.swarmState?.coordinationScore ??
      frame.snapshot.metrics.coordinationScore;
    const interactionStrength = Math.min(
      1,
      localizedRatio * 0.72 +
        coordination * 0.46 +
        (frame.snapshot.phase === "clot_interaction" ||
        frame.snapshot.phase === "channel_opening" ||
        frame.snapshot.phase === "success"
          ? 0.18
          : 0),
    );
    const reopeningStrength = Math.min(
      1,
      frame.snapshot.clot.channelRadius * 2.55 +
        frame.snapshot.clot.erosionFront * 0.85,
    );
    const normalLerp = frame.snapshot.clot.currentBurden;

    this.outerMaterial.color.copy(new Color(isFluoro ? "#dfefff" : "#7b4c58"));
    this.outerMaterial.opacity = isFluoro ? 0.14 : 0.12;
    this.outerMaterial.emissive.copy(
      new Color(isFluoro ? "#143148" : "#17070a"),
    );

    this.cutawayMaterial.color.copy(new Color(isFluoro ? "#dcefff" : "#9a5865"));
    this.cutawayMaterial.opacity = isFluoro ? 0.16 : 0.74;
    this.cutawayMaterial.emissive.copy(
      new Color(isFluoro ? "#16354a" : "#23090d"),
    );
    this.cutawayBand.visible = !isFluoro;

    this.innerMaterial.color.copy(new Color(isFluoro ? "#081721" : "#68111b"));
    this.innerMaterial.opacity = isFluoro ? 0.93 : 0.98;
    this.innerMaterial.emissive.copy(
      new Color(isFluoro ? "#123047" : "#310c11"),
    );

    this.clotMaterial.color.copy(new Color(isFluoro ? "#eef7ff" : "#581017"));
    this.clotMaterial.emissive.copy(
      new Color(isFluoro ? "#aed8ff" : "#29080c"),
    );

    this.clotChannelMaterial.color.copy(
      new Color(isFluoro ? "#f6fbff" : "#ffd2bb"),
    );
    this.clotChannelMaterial.opacity = isFluoro ? 0.65 : 0.88;
    this.clotChannelMaterial.emissiveIntensity = isFluoro
      ? 0.08
      : 0.12 + interactionStrength * 0.12;

    this.swarmMaterial.color.copy(new Color(isFluoro ? "#f3fbff" : "#e9ffff"));
    this.swarmMaterial.emissive.copy(
      new Color(isFluoro ? "#d3e9ff" : "#69e6ef"),
    );

    this.flowCellMaterial.color.copy(
      new Color(isFluoro ? "#edf7ff" : "#b42331"),
    );
    this.flowCellMaterial.emissive.copy(
      new Color(isFluoro ? "#d9efff" : "#541017"),
    );
    this.flowCellMaterial.opacity = isFluoro ? 0.26 : 0.92;

    this.swarmFluoroMaterial.color.copy(
      new Color(isFluoro ? "#f5fbff" : "#d9f9ff"),
    );
    this.swarmFluoroMaterial.opacity = isFluoro ? 0.94 : 0;

    this.flowMaterial.color.copy(
      new Color(isFluoro ? "#eefaff" : "#ffc1ad"),
    );
    this.flowMaterial.opacity = isFluoro ? 0.42 : 0;

    this.fibrinMaterial.color.copy(
      new Color(isFluoro ? "#eef7ff" : "#f4ddc9"),
    );
    this.fibrinMaterial.opacity = isFluoro ? 0.22 : 0.46 + reopeningStrength * 0.12;

    this.spiralMaterial.color.copy(
      new Color(isFluoro ? "#eef8ff" : "#a7fdff"),
    );
    this.spiralMaterial.opacity = isFluoro
      ? 0.12
      : 0.18 + interactionStrength * 0.22;

    this.scene.background = new Color(isFluoro ? "#081019" : "#160a0f");
    if (this.scene.fog) {
      this.scene.fog.color.copy(new Color(isFluoro ? "#081019" : "#160a0f"));
    }

    this.fieldArrow.visible = !isFluoro;
    this.swarmMesh.visible = !isFluoro;
    this.swarmFluoroPoints.visible = isFluoro;
    this.flowCells.visible = !isFluoro;
    this.flowPoints.visible = isFluoro;
    this.fibrinThreads.visible = !isFluoro;
    this.interactionSpiral.visible = interactionStrength > 0.08;

    const clotFrame = this.toWorldPosition(
      config.clot.position,
      0,
      0,
      config.vessel.diameterScale,
    );
    const normalDir = clotFrame.normal.clone().normalize();
    const binormalDir = clotFrame.binormal.clone().normalize();
    const clotWallOffset = normalDir
      .clone()
      .multiplyScalar(0.085 + frame.snapshot.clot.occlusionFraction * 0.12)
      .add(binormalDir.clone().multiplyScalar(-0.03));
    const clotPosition = clotFrame.point.clone().add(clotWallOffset);
    const clotCenterDirection = clotFrame.point.clone().sub(clotPosition).normalize();
    const clotScale =
      0.56 + frame.snapshot.clot.currentBurden * 0.74 * config.clot.size;
    this.clotMesh.position.copy(clotPosition);
    this.clotMesh.quaternion.setFromUnitVectors(this.worldUp, clotFrame.tangent);
    this.clotMesh.scale.set(
      0.8 + clotScale * 0.46,
      0.92 + frame.snapshot.clot.occlusionFraction * 1.08,
      0.84 + frame.snapshot.clot.occlusionFraction * 0.88,
    );

    const interactionFace = clotPosition
      .clone()
      .add(clotCenterDirection.clone().multiplyScalar(0.18 + reopeningStrength * 0.05))
      .add(clotFrame.tangent.clone().multiplyScalar(-0.08 + reopeningStrength * 0.14));

    const channelPosition = clotPosition
      .clone()
      .lerp(clotFrame.point, 0.44 + reopeningStrength * 0.16)
      .add(clotFrame.tangent.clone().multiplyScalar(-0.05 + reopeningStrength * 0.08));
    this.clotChannelMesh.position.copy(channelPosition);
    this.clotChannelMesh.quaternion.setFromUnitVectors(
      this.worldUp,
      clotCenterDirection,
    );
    this.clotChannelMesh.scale.set(
      0.74 + reopeningStrength * 0.34,
      0.42 + reopeningStrength * 1.3,
      0.68 + reopeningStrength * 0.4,
    );
    this.clotChannelMesh.visible =
      frame.snapshot.clot.phase !== "stable" || reopeningStrength > 0.025;

    const fibrinPositions = this.fibrinThreads.geometry.getAttribute(
      "position",
    ) as BufferAttribute;
    for (let index = 0; index < FIBRIN_STRAND_COUNT; index += 1) {
      const angle =
        (index / FIBRIN_STRAND_COUNT) * Math.PI * 2 +
        frame.snapshot.timeSec * 0.35;
      const spread = 0.038 + (index % 3) * 0.012;
      const root = clotPosition
        .clone()
        .add(normalDir.clone().multiplyScalar(Math.cos(angle) * spread * 0.65))
        .add(binormalDir.clone().multiplyScalar(Math.sin(angle) * spread))
        .add(clotCenterDirection.clone().multiplyScalar(0.16 + reopeningStrength * 0.04));
      const tip = root
        .clone()
        .add(clotFrame.tangent.clone().multiplyScalar(-0.05 + (index % 2) * 0.015))
        .add(clotCenterDirection.clone().multiplyScalar(0.06 + reopeningStrength * 0.05))
        .add(normalDir.clone().multiplyScalar(Math.sin(angle * 1.4) * 0.018));
      fibrinPositions.setXYZ(index * 2, root.x, root.y, root.z);
      fibrinPositions.setXYZ(index * 2 + 1, tip.x, tip.y, tip.z);
    }
    fibrinPositions.needsUpdate = true;

    const spiralPositions = this.interactionSpiral.geometry.getAttribute(
      "position",
    ) as BufferAttribute;
    for (let index = 0; index < INTERACTION_SPIRAL_POINTS; index += 1) {
      const progress = index / (INTERACTION_SPIRAL_POINTS - 1);
      const angle =
        progress * Math.PI * (3 + config.field.corkscrewIntensity * 4.6) +
        frame.snapshot.timeSec * (0.8 + config.field.corkscrewIntensity * 1.7);
      const radius =
        (0.14 - progress * 0.08) *
        (0.52 + interactionStrength * 0.68) *
        (0.82 + normalLerp * 0.18);
      const axial = -0.34 + progress * (0.28 + reopeningStrength * 0.18);
      const spiralPoint = interactionFace
        .clone()
        .add(clotFrame.tangent.clone().multiplyScalar(axial))
        .add(normalDir.clone().multiplyScalar(Math.cos(angle) * radius))
        .add(binormalDir.clone().multiplyScalar(Math.sin(angle) * radius));
      spiralPositions.setXYZ(
        index,
        spiralPoint.x,
        spiralPoint.y,
        spiralPoint.z,
      );
    }
    spiralPositions.needsUpdate = true;

    const upAxis = new Vector3(0, 1, 0);
    const queuedColor = new Color(isFluoro ? "#dfecff" : "#b6fbff");
    const navigatingColor = new Color(isFluoro ? "#e8f4ff" : "#d9ffff");
    const localizingColor = new Color(isFluoro ? "#f4f9ff" : "#f9ffff");
    const interactingColor = new Color(isFluoro ? "#ffffff" : "#fff2cd");

    this.swarmMesh.count = Math.min(frame.agents.length, MAX_VISIBLE_AGENTS);
    const fluoroPositions = this.swarmFluoroPoints.geometry.getAttribute(
      "position",
    ) as BufferAttribute;
    for (let index = 0; index < this.swarmMesh.count; index += 1) {
      const agent = frame.agents[index];
      const agentFrame = this.toWorldPosition(
        agent.x,
        agent.y,
        agent.z,
        config.vessel.diameterScale,
      );
      const displayPoint = agentFrame.point.clone();
      const displayTangent = agentFrame.tangent.clone();
      const stateBias =
        agent.state === "interacting"
          ? 1
          : agent.state === "localizing"
            ? 0.62
            : agent.state === "navigating"
              ? 0.1
              : 0;

      if (!isFluoro && stateBias > 0) {
        const swirlAngle =
          index * 0.78 +
          frame.snapshot.timeSec * (0.92 + config.field.corkscrewIntensity * 1.8);
        const swirlRadius =
          (0.028 + (1 - stateBias) * 0.04) *
          (0.75 + config.field.corkscrewIntensity * 0.62) *
          (0.72 + interactionStrength * 0.56);
        const swirlPoint = interactionFace
          .clone()
          .add(
            clotFrame.tangent
              .clone()
              .multiplyScalar(-0.24 + stateBias * 0.18 + (index % 5) * 0.01),
          )
          .add(normalDir.clone().multiplyScalar(Math.cos(swirlAngle) * swirlRadius))
          .add(binormalDir.clone().multiplyScalar(Math.sin(swirlAngle) * swirlRadius));
        displayPoint.lerp(swirlPoint, stateBias * 0.5 * interactionStrength);
        displayTangent.lerp(clotFrame.tangent, 0.55 * stateBias).normalize();
      }

      fluoroPositions.setXYZ(index, displayPoint.x, displayPoint.y, displayPoint.z);
      this.dummy.position.copy(displayPoint);
      this.dummy.quaternion.setFromUnitVectors(upAxis, displayTangent);
      this.dummy.rotateOnAxis(upAxis, (index % 6) * 0.12);
      const bodyScale = 0.42 + agent.intensity * 0.12;
      const lengthScale =
        agent.state === "interacting"
          ? 1.7
          : agent.state === "localizing"
            ? 1.46
            : agent.state === "navigating"
              ? 1.24
              : 1.05;
      this.dummy.scale.set(bodyScale, bodyScale * lengthScale, bodyScale);
      this.dummy.updateMatrix();
      this.instanceMatrix.copy(this.dummy.matrix);
      this.swarmMesh.setMatrixAt(index, this.instanceMatrix);

      const stateColor =
        agent.state === "interacting"
          ? interactingColor
          : agent.state === "localizing"
            ? localizingColor
            : agent.state === "navigating"
              ? navigatingColor
              : queuedColor;
      this.swarmMesh.setColorAt(index, stateColor);
    }
    this.swarmMesh.instanceMatrix.needsUpdate = true;
    if (this.swarmMesh.instanceColor) {
      this.swarmMesh.instanceColor.needsUpdate = true;
    }
    fluoroPositions.needsUpdate = true;
    this.swarmFluoroPoints.geometry.setDrawRange(0, this.swarmMesh.count);

    const flowPointPositions = this.flowPoints.geometry.getAttribute(
      "position",
    ) as BufferAttribute;
    const motionScale = viewState.reducedMotion ? 0.28 : 1;
    const pulseFactor = config.flow.pulseEnabled
      ? 0.78 + Math.sin(frame.snapshot.timeSec * 2.4) * 0.16
      : 1;
    const flowRate = config.flow.speed * 0.17 * motionScale * pulseFactor;
    for (let index = 0; index < FLOW_PARTICLE_COUNT; index += 1) {
      const offset =
        (frame.snapshot.timeSec * flowRate + index / FLOW_PARTICLE_COUNT) % 1;
      const { radialA, radialB } = this.flowOffsets[index];
      const flowFrame = this.toWorldPosition(
        offset,
        radialA * 0.04,
        radialB * 0.04,
        config.vessel.diameterScale,
      );
      const flowPoint = flowFrame.point.clone();
      const clotDelta = Math.abs(offset - config.clot.position);
      const nearClot = Math.max(0, 1 - clotDelta * 7);
      if (!isFluoro && nearClot > 0.01) {
        flowPoint
          .add(
            normalDir
              .clone()
              .multiplyScalar(
                Math.sin(frame.snapshot.timeSec * 1.45 + index * 0.9) *
                  0.01 *
                  nearClot,
              ),
          )
          .add(
            binormalDir
              .clone()
              .multiplyScalar(
                Math.cos(frame.snapshot.timeSec * 1.18 + index * 0.7) *
                  0.008 *
                  nearClot,
              ),
          );
      }
      flowPointPositions.setXYZ(index, flowPoint.x, flowPoint.y, flowPoint.z);

      this.dummy.position.copy(flowPoint);
      this.dummy.quaternion.setFromUnitVectors(upAxis, flowFrame.tangent);
      const wobble =
        1 +
        Math.sin(frame.snapshot.timeSec * 2.1 + index * 0.4) * 0.08 * motionScale;
      this.dummy.scale.set(0.82 * wobble, 0.36, 1.12 * wobble);
      this.dummy.updateMatrix();
      this.instanceMatrix.copy(this.dummy.matrix);
      this.flowCells.setMatrixAt(index, this.instanceMatrix);
    }
    this.flowCells.instanceMatrix.needsUpdate = true;
    flowPointPositions.needsUpdate = true;
    this.flowPoints.geometry.setDrawRange(0, FLOW_PARTICLE_COUNT);

    const arrowDirection = new Vector3(
      Math.cos((config.field.directionDeg * Math.PI) / 180),
      0.18,
      Math.sin((config.field.directionDeg * Math.PI) / 180),
    ).normalize();
    this.fieldArrow.setDirection(arrowDirection);
    this.fieldArrow.setLength(0.82 + config.field.strength * 0.82, 0.18, 0.1);
    this.fieldArrow.setColor(new Color(isFluoro ? "#dfefff" : "#ffc76b"));

    this.applyCamera(viewState, frame, clotFrame, config);
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number) {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, false);
  }

  exportPng(): string {
    return this.renderer.domElement.toDataURL("image/png");
  }

  dispose() {
    this.outerTube.geometry.dispose();
    this.cutawayBand.geometry.dispose();
    this.innerTube.geometry.dispose();
    this.clotMesh.geometry.dispose();
    this.clotChannelMesh.geometry.dispose();
    this.swarmMesh.geometry.dispose();
    this.flowCells.geometry.dispose();
    this.swarmFluoroPoints.geometry.dispose();
    this.flowPoints.geometry.dispose();
    this.fibrinThreads.geometry.dispose();
    this.interactionSpiral.geometry.dispose();
    this.outerMaterial.dispose();
    this.cutawayMaterial.dispose();
    this.innerMaterial.dispose();
    this.clotMaterial.dispose();
    this.clotChannelMaterial.dispose();
    this.swarmMaterial.dispose();
    this.flowCellMaterial.dispose();
    this.swarmFluoroMaterial.dispose();
    this.flowMaterial.dispose();
    this.fibrinMaterial.dispose();
    this.spiralMaterial.dispose();
    this.renderer.dispose();
  }
}
