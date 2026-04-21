# Nano Swarm Intelligence Coronary Clot Simulator


A browser-first, pseudo-3D educational simulator demonstrating how a swarm of microrobot-inspired agents can localize to and interact with a clot inside a coronary artery.

---

## ⚠️ Disclaimer

This simulator is an **educational visualization** inspired by preclinical research.

- ❌ Not a medical device  
- ❌ Not for diagnosis or treatment planning  
- ❌ Not patient-specific  
- ❌ Not predictive  

All visuals, motion, and metrics are simplified for conceptual understanding only.

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
````

### 2. Run the simulator (development mode)

```bash
npm run dev
```

Then open:

```
http://localhost:5173/
```

This launches the **interactive simulator** with live updates.

---

### 3. Build production version (optional)

```bash
npm run build
npm run preview
```

---

## 🧭 How to Use the Simulator

### Modes

* **Guided Mode**

  * Runs a 40–60 second educational sequence
  * Explains clot, swarm, and interaction step-by-step

* **Explore Mode**

  * Full control over parameters
  * Use the lab panel to experiment

---

## 🎮 Controls

### Playback

| Key   | Action       |
| ----- | ------------ |
| Space | Play / Pause |
| S / → | Step         |
| R     | Replay       |
| Home  | Reset        |

---

### View Controls

| Key | Action               |
| --- | -------------------- |
| 1–4 | Camera views         |
| F   | Toggle overlay       |
| M   | Reduced motion       |
| D   | Open disclaimer/help |
| Esc | Close modal          |

---

## 🧪 Lab Panel (Right Side)

You can control:

### Scenario

* Clot size
* Clot position
* Injection point

### Flow

* Flow speed
* Vessel behavior

### Swarm

* Swarm size
* Concentration
* Field strength
* Field direction

### Playback

* Speed
* Seed (for deterministic replay)

---

## 📊 Metrics (Top Bar)

| Metric                             | Meaning                    |
| ---------------------------------- | -------------------------- |
| Clot Burden (%)                    | Remaining clot size        |
| Simulated Vessel Patency Index (%) | Illustrative flow recovery |
| Localization (%)                   | Swarm near clot            |
| Coordination Score                 | Swarm organization         |
| Elapsed Time                       | Simulation time            |

---

## 📷 Camera Modes

* Overview
* Follow Swarm
* Clot Close-up (important for mechanism)
* Imaging Overlay

---

## 📤 Export Features

* **JSON** → scenario save/load
* **CSV** → metrics data
* **PNG** → viewport snapshot (with disclaimer)

---

## 🧠 What You Are Seeing

The simulator illustrates:

1. A clot blocking a coronary artery
2. A swarm of microrobot-inspired agents introduced upstream
3. External-field-guided localization
4. Coordinated swarm behavior near the clot
5. Localized clot interaction and channel reopening

This is a **conceptual model**, not a clinical system.

---

## 🔁 Deterministic Replay

Using the same:

* seed
* parameters

→ produces identical simulation runs.

Useful for:

* demos
* testing
* comparisons

---

## ⚙️ Tech Stack

* TypeScript
* Three.js
* Vite
* Browser-first rendering

---

## 🧩 Project Structure (Simplified)

```
src/
  app/        → main app logic
  sim/        → simulation engine
  render/     → 3D scene (artery, clot, swarm)
  ui/         → interface components
  export/     → JSON / CSV / PNG
  metrics/    → metrics + history
  safety/     → disclaimer + copy rules
```

---

## 🧪 For Demo Use

Recommended flow:

1. Start in Guided Mode
2. Let full sequence play
3. Replay once
4. Scrub timeline
5. Switch camera
6. Export PNG/CSV

---

## 🧱 Current Limitations

* Single vessel segment (coronary artery)
* One clot at a time
* Simplified physics
* Educational-only swarm behavior

---

## 🧭 Future Improvements (Optional)

* Improved visual realism (artery, clot, swarm)
* Better flow-field visualization
* Additional presets
* Enhanced camera storytelling

---

## 👨‍🔬 Purpose

This project demonstrates:

* swarm intelligence concepts
* deterministic simulation design
* educational visualization techniques
* safe, non-clinical scientific storytelling

---

## 📌 Summary

This is a **science explainer**, not a medical tool.

It helps answer:

> *“How could coordinated micro-agents interact with a clot inside a vessel?”*

in a **clear, visual, and safe way**.

---
