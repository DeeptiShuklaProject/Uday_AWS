# Level 8: Autonomous AI Agent Companion (Sense ➔ Think ➔ Act Loop) 🧠🤖

Welcome to **CodeAdventure Level 8**! 🎮

In this level, you will build a real **Autonomous AI Agent Companion** that makes decisions on its own without hardcoded steps!

---

### 🧠 How the AI Agent Loop Works (Play-by-Play):

1. **🔍 SENSE (Perceive Environment Telemetry)**:
   - The AI Agent reads health (`25%`), ammo (`0/10`), and enemy threat (`GlitchFiend`).

2. **🧠 THINK (Autonomous Tool Decision Engine)**:
   - The Agent evaluates state:
     - If `Health < 30%` ➔ Autonomous Tool Pick: **`REPAIR_SHIELD 🛠️`**
     - If `Ammo == 0` ➔ Autonomous Tool Pick: **`RELOAD_AMMO ⚡`**
     - Else ➔ Autonomous Tool Pick: **`FIRE_WEAPON 💥`**

3. **⚡ ACT (Execute Selected Tool)**:
   - The Agent executes the selected tool to repair shield, reload ammo, or blast the alien monster!

---

### 🎮 Mission Objective:
Construct a `CyberAIAgent` class with `sense()`, `think()`, and `act()` methods. Run simulation and watch your AI Agent think in real time!

<CodeAdventureGame levelId="ai_agent_cyber_companion" />
