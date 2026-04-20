# ⚡ Electro Viz

**70 phase-stepped visualizers for electronics — made for kids.** From Ohm's Law as water flowing through pipes, to the 555 timer x-ray, to your brain modeled as a Schmitt trigger. Every abstract electrical concept gets a physical analogy plus live animation.

Part of the **Workshop-DIY** visualizer family:
- ⚡ [electro-viz](https://github.com/abourdim/electro-viz) — electronics (you are here)
- 🛠️ [maker-viz](https://github.com/abourdim/maker-viz) — 17 sensors/motors vizzes
- 🚁 [drone-viz](https://github.com/abourdim/drone-viz) — 32 drone subsystems

## Live demo

👉 **[abourdim.github.io/electro-viz](https://abourdim.github.io/electro-viz/)**

## What's inside

### ⭐ Top 5 — where to start
| Viz | What you learn |
|---|---|
| [Ohm's Water Pipe](ohm-water.html) | V = IR via hydraulics. The universal foundation. |
| [LED + Resistor Calculator](led-calc.html) | Save your first LED from burning up |
| [Capacitor = Bucket](capacitor-bucket.html) | Unlocks timing, filtering, power supplies at once |
| [Logic Gates](logic-gates.html) | Switches + gates = bridge to digital and code |
| [Multimeter School](multimeter.html) | The #1 tool they'll use for life |

### All 70 — organised in 14 categories
- **Foundations (V, I, R)** — 5 vizzes
- **LEDs / switches / breadboards** — 5
- **Caps / inductors / timing** — 7
- **Transistors &amp; amps** — 5
- **Logic &amp; digital** — 5 (incl. 555 timer x-ray)
- **Signals &amp; waves** — 6
- **Power &amp; safety** — 5
- **Sensors / actuators** — 6
- **Invisible made visible** — 4 (electron microscope, semiconductors, Faraday cage, signal speed)
- **Magic energy** — 5 (induction, Peltier, electrolysis, lemon battery, shark electroreception)
- **Noise / systems** — 5 (Johnson noise, RNG, oscillator, feedback, PLL)
- **Microcontrollers — bridge to code** — 6 (ADC, DAC, interrupts, debounce, multitask, brain-as-circuit)
- **Craft, debug, meta** — 6 (solder rater, multimeter, probe comp, schematic reading, fail lab)

## How to use

1. Open `index.html` (or the live demo link).
2. Pick any card — 70 to explore.
3. Press **STEP** to advance one phase, or **PLAY** for auto-loop.
4. Slow the speed slider for close inspection.
5. Flick the per-viz sliders — inputs change live.

## For teachers / parents

Every viz is **one self-contained HTML file**. Kids can:
- Open a viz, STEP through at their own pace
- Read the 3–5 code lines and see which one "runs" right now
- Watch variables update in cards as the code runs
- Change slider inputs and re-run

The **Fail Lab** (find-the-fault) and **Multimeter School** vizzes are especially useful — they teach debugging and the #1 hobby tool.

## Architecture

All 70 vizzes share a ~200-line engine:

```js
MakerViz.create({
  vars:   { ... },    // variables to track
  phases: [ ... ],    // one tick = one phase
  lines:  [ ... ],    // code lines with active-line highlight
  stage:  (state) => svgString,
  run:    (phase, state, ui) => { ... }
});
```

## Workshop-DIY template

Gallery uses the [Workshop-DIY](https://github.com/abourdim/tools) template: splash, bismillah header, 9 themes (Robot default for the electronics vibe), trilingual i18n (EN/FR/AR with auto-RTL), activity log, debug panel, easter eggs.

## Run locally

```bash
python -m http.server 8000
# http://localhost:8000
```

## License

MIT — see [LICENSE](LICENSE).
