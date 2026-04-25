# Physics Specification - Nano-Swarm Intelligence Coronary Clot Simulator

## Overview

This document describes the complete physics models implemented in the simulator, including fluid dynamics, clot dissolution kinetics, swarm mechanics, and nano-particle behavior.

## Table of Contents

1. [Fluid Dynamics](#fluid-dynamics)
2. [Clot Structure & Dissolution](#clot-structure--dissolution)
3. [Blood Cell Dynamics](#blood-cell-dynamics)
4. [Nano-Particle Swarm](#nano-particle-swarm)
5. [Field Steering & Magnetism](#field-steering--magnetism)
6. [Coupling & Integration](#coupling--integration)

---

## Fluid Dynamics

### Navier-Stokes Simplification

We implement a **semi-implicit Euler advection** scheme for blood flow in the coronary artery.

**Equations:**

```
∂u/∂t + (u·∇)u = -∇p + ν∇²u + f

∇·u = 0  (incompressibility)
```

Where:
- **u** = velocity field [m/s]
- **p** = pressure [Pa]
- **ν** = kinematic viscosity [m²/s]
- **f** = external forces

### Implementation

**Grid Resolution:** 8×8×8 to 32×32×32 cells (configurable)
**Time Step:** Δt = 0.001 to 0.016 s
**Viscosity Range:** 0.001 – 0.1 Pa·s (physiological: ~0.003 Pa·s at 37°C)

### Advection (Semi-Implicit Euler)

```typescript
// Backtrace from grid point
pos = position - (dt/dx) * velocity
interpolate velocity at pos
```

### Diffusion (Jacobi Iteration)

Solves: `du/dt = ν∇²u`

```
u_new = (u + ν*Δt*∑neighbors) / (1 + ν*Δt)
```

Iterations: 10–20 per step

### Pressure Projection (Incompressibility)

1. Compute divergence: `∇·u`
2. Solve Poisson: `∇²p = -∇·u`
3. Update: `u = u - ∇p`

---

## Clot Structure & Dissolution

### Microstructure Model

The clot is represented as a network of:
- **Fibrin strands** (networked proteins)
- **Platelet aggregates** (mechanical reinforcement)
- **Fluid channels** (permeability)

### Fibrin Kinetics

Each fibrin strand has properties:
- **Crosslink strength:** 0–10 (higher = more resistant)
- **Degradation level:** 0–1 (0 = intact, 1 = completely degraded)
- **Nano-particle attachment count**

### Dissolution Rate Mechanisms

#### 1. Enzymatic Degradation (Plasmin)

Michaelis-Menten kinetics:

```
v = (V_max * [plasmin]) / (K_m + [plasmin])

V_max = 0.3 min⁻¹
K_m = 0.5
```

Temperature dependence:
```
rate(T) = rate(37°C) * exp(-(T-37)²/100)
```

#### 2. Mechanical Erosion (Shear Stress)

Wall shear stress on clot surface:
```
τ_w = blood_velocity² * fluid_density

Critical threshold: τ_c ≈ 1.5 Pa

erosion_rate = 0.05 * min(1, (τ_w - τ_c) / 5) * surface_area
```

#### 3. Nano-Particle Ablation

Swarm-assisted fragmentation:
```
ablation_rate = 0.15 * (N_particles * localization_ratio)
                * (0.1 + coordination_score * 0.3)
                * (0.1 + localization_ratio * 0.2)
```

### Channel Opening

As clot dissolves, fluid-permeable channel opens:

```
channel_radius = 0.04 + (1 - burden) * 0.34 mm

vessel_patency = 1 - (1 - channel_radius/vessel_radius)²
```

---

## Blood Cell Dynamics

### Red Blood Cells (RBCs)

**Properties:**
- Count: 5000–20000 particles (instanced)
- Size: ~7–8 μm diameter
- Deformability: 0.3–0.8 (units)

**Dynamics:**
```
position += velocity * dt
velocity += (flow_field + brownian_motion) * dt

deformability(t) = init_deformability + (shear_stress > threshold) * 0.02
```

**Representation:** Biconcave disc approximation (icosahedron)
**Color:** RGB(196, 30, 58) - physiological red

### White Blood Cells (WBCs)

**Properties:**
- Count: 100–500
- Size: ~10–20 μm
- Attracted to clot region

**Chemotaxis to inflammatory mediators:**
```
attraction = max(0, 1 - distance_to_clot * 5) * 0.005

velocity += attraction * dt
```

**Representation:** Sphere with diffuse material
**Color:** RGB(240, 240, 240) - pale appearance

### Platelets

**Properties:**
- Count: 2000–10000
- Size: ~2–3 μm
- Aggregate near clot

**Aggregation mechanics:**
```
aggregation_level += 0.05 * (distance_to_clot < 0.15)

scale = 0.8 + aggregation_level * 0.6
velocity *= 0.95 when aggregating
```

**Representation:** Irregular icosahedron
**Color:** RGB(184, 159, 79) - brownish

---

## Nano-Particle Swarm

### Agent Model

Each nano-particle agent:
- **ID:** unique identifier
- **Position:** (x, y, z) in normalized vessel coordinates
- **Velocity:** (vx, vy, vz)
- **Acceleration:** (ax, ay, az)
- **State:** dispersed → navigating → coordinating → drilling
- **Energy level:** 0–1 (depletes over time)

### Boid Flocking Rules

#### 1. Separation
Avoid neighbors within 0.02 m:
```
steer = ∑(self_pos - neighbor_pos) / distance

if distance < separation_radius:
    separation_force = normalize(steer) * 0.05
```

#### 2. Alignment
Align heading with neighbors within 0.05 m:
```
avg_heading = mean(neighbor_velocities)

alignment_force = normalize(avg_heading) * 0.03
```

#### 3. Cohesion
Steer toward center of mass (0.08 m radius):
```
center_of_mass = mean(neighbor_positions)

cohesion_force = normalize(center_of_mass - self_pos) * 0.02
```

### Force Combination

```
total_force = 1.5*separation + 1.0*alignment + 1.0*cohesion
            + 2.0*magnetic_field + 0.5*pheromone_gradient

velocity += acceleration * dt
velocity = clamp(velocity, max_speed = 0.015 m/s)
```

### Energy Model

```
energy(t) = energy(t-1) - 0.0001  // per step

if energy < threshold:
    agent_state = "dormant"
```

### State Transitions

```
if distance_to_clot < 0.02:
    state = "drilling"
    pheromone_level = 1.0
else if distance_to_clot < 0.1:
    state = "coordinating"
    pheromone_level = 0.7
else if x > clot_x - 0.3:
    state = "navigating"
    pheromone_level = 0.3
else:
    state = "dispersed"
    pheromone_level = 0
```

---

## Field Steering & Magnetism

### Magnetic Field Guidance

External magnetic field applied perpendicular to vessel:
```
B = strength * direction_vector

steering_acceleration = B * localization_assist_factor
                      = B * 0.8 * field_strength
```

**Effect on swarm:**
- Directs agents toward clot region
- Increases localization ratio
- Reduces dispersal energy

### Corkscrew Intensity

Rotational field component:
```
spiral_radius = (0.14 - progress * 0.08) * (0.52 + intensity * 0.68)

angle = progress * π * (3 + intensity * 4.6) + time * (0.8 + intensity * 1.7)

particle_position += [radius*cos(angle), z_offset, radius*sin(angle)]
```

---

## Coupling & Integration

### Simulation Loop

```
for each timestep dt:
    1. Update nano-particle swarm (Boid + fields)
    2. Compute localization metrics
    3. Calculate dissolution rates
    4. Update blood cells
    5. Update clot microstructure
    6. Render scene
    7. Record snapshot (digital twin)
```

### Unit System

- **Length:** meters (1 vessel ≈ 0.4 m)
- **Time:** seconds
- **Mass:** kg (implicit)
- **Density:** kg/m³

### Numerical Stability

CFL condition for advection:
```
Δt < Δx / max_velocity

Δx = 1/grid_resolution
max_velocity ≈ 0.02 m/s
```

Recommended: Δt ≤ 0.001 s

---

## References

1. Stam, J. (2003). *Real-time fluid dynamics for games*. GDC.
2. Reynolds, C. W. (1987). *Flocks, herds and schools: A distributed behavioral model*.
3. Weisel, J. W., Litvinov, R. I. (2019). *Mechanisms of fibrin polymerization and clinical implications*. Blood, 121(10).
4. Tardy, Y., et al. (2012). *Shear stress gradients remodel endothelial monolayers in vitro*. American Journal of Physiology.

---

*Last Updated: 2026-04-25*
*Version: 1.0*