/* ══════════════════════════════════════════════
   CPU Lab — Application Logic (app.js)
   ══════════════════════════════════════════════ */

"use strict";

// ──────────────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────────────
const tabs = {
  overview: "Visão Geral da CPU",
  cycle:    "Ciclo de Instrução",
  simulator:"Simulador de CPU",
  pipeline: "Pipeline de Instrução",
  memory:   "Hierarquia de Memória",
  quiz:     "Quiz — Teste seus Conhecimentos"
};

let visitedTabs = new Set(["overview"]);

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    const tab = item.dataset.tab;
    switchTab(tab);
  });
});

function switchTab(tab) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.toggle("active", i.dataset.tab === tab));
  document.querySelectorAll(".tab-content").forEach(s => s.classList.toggle("active", s.id === "tab-" + tab));
  document.getElementById("headerTitle").textContent = tabs[tab] || "";
  visitedTabs.add(tab);
  updateProgress();

  if (tab === "pipeline") initPipelineViz();
  if (tab === "memory")   initCacheDemo();
  if (tab === "quiz")     initQuiz();
  if (tab === "simulator") initSim();
  if (tab === "overview") animateFacts();
}

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("main").classList.toggle("expanded");
});

function updateProgress() {
  const pct = Math.round((visitedTabs.size / Object.keys(tabs).length) * 100);
  document.getElementById("globalProgress").style.width = pct + "%";
  document.getElementById("progressPct").textContent = pct + "%";
}

// ──────────────────────────────────────────────
// OVERVIEW — COMPONENT INFO
// ──────────────────────────────────────────────
const componentInfo = {
  cu: {
    icon: "🎛️",
    title: "Unidade de Controle (CU)",
    body: `A <strong>Unidade de Controle</strong> é o "maestro" da CPU. Ela não executa cálculos, mas coordena todos os outros componentes:
    <ul>
      <li>Busca instruções na memória (via MAR/MDR)</li>
      <li>Decodifica o código da instrução no IR</li>
      <li>Gera os sinais de controle para ALU, registradores e memória</li>
      <li>Controla o PC para apontar para a próxima instrução</li>
    </ul>
    <strong>Registradores internos:</strong> PC (Program Counter), IR (Instruction Register), MAR (Memory Address Register), MDR (Memory Data Register).`
  },
  alu: {
    icon: "➕",
    title: "ULA — Unidade Lógica e Aritmética",
    body: `A <strong>ULA</strong> é o motor de cálculo da CPU. Realiza todas as operações:
    <ul>
      <li><strong>Aritméticas:</strong> Soma, subtração, multiplicação, divisão</li>
      <li><strong>Lógicas:</strong> AND, OR, NOT, XOR</li>
      <li><strong>Comparação:</strong> Igual, maior, menor — seta flags</li>
      <li><strong>Deslocamento:</strong> Shift left/right (equivale a × ou ÷ 2)</li>
    </ul>
    O resultado pode ir para um registrador ou ser armazenado em memória.`
  },
  regs: {
    icon: "📦",
    title: "Registradores",
    body: `<strong>Registradores</strong> são memórias ultra-rápidas dentro da CPU (< 1 ns):
    <ul>
      <li><strong>PC</strong> — Program Counter: endereço da próxima instrução</li>
      <li><strong>IR</strong> — Instruction Register: instrução atual em execução</li>
      <li><strong>ACC</strong> — Acumulador: armazena resultados da ULA</li>
      <li><strong>MAR</strong> — Memory Address Register: endereço para acessar memória</li>
      <li><strong>MDR</strong> — Memory Data Register: dado lido/escrito na memória</li>
      <li><strong>GPR</strong> — Registradores de propósito geral: R0–R31 (RISC-V), RAX/RBX... (x86)</li>
    </ul>`
  },
  cache: {
    icon: "⚡",
    title: "Cache da CPU",
    body: `O <strong>cache</strong> é uma memória rápida que fica entre a CPU e a RAM:
    <ul>
      <li><strong>L1:</strong> 32–64 KB, ~1–4 ns — mais rápido, menor</li>
      <li><strong>L2:</strong> 256 KB–4 MB, ~4–12 ns — por núcleo ou compartilhado</li>
      <li><strong>L3:</strong> 4–32 MB, ~12–40 ns — compartilhado entre núcleos</li>
    </ul>
    <strong>Princípio da localidade:</strong> se um dado foi acessado, provavelmente será acessado de novo (temporal) e dados vizinhos também serão acessados (espacial).`
  },
  mem: {
    icon: "🧠",
    title: "Memória RAM",
    body: `A <strong>RAM (Random Access Memory)</strong> fica fora da CPU e é muito mais lenta:
    <ul>
      <li>DRAM: Dynamic RAM — barata, densa, mas lenta (~60–100 ns)</li>
      <li>Capacidade: tipicamente 4–64 GB em desktops modernos</li>
      <li>Volátil: perde dados quando desligada</li>
      <li>Endereçada pela CPU via Barramento de Endereço</li>
    </ul>
    O <strong>barramento</strong> (bus) conecta CPU e RAM: de endereço, de dados e de controle.`
  }
};

document.querySelectorAll(".cpu-block[data-info]").forEach(block => {
  block.addEventListener("click", () => {
    const key = block.dataset.info;
    const info = componentInfo[key];
    if (!info) return;
    const panel = document.getElementById("infoPanel");
    document.getElementById("infoPanelIcon").textContent = info.icon;
    document.getElementById("infoPanelTitle").textContent = info.title;
    document.getElementById("infoPanelBody").innerHTML = info.body;
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

function closeInfo() {
  document.getElementById("infoPanel").style.display = "none";
}

// ──────────────────────────────────────────────
// OVERVIEW — FACTS COUNTER
// ──────────────────────────────────────────────
let factsAnimated = false;
function animateFacts() {
  if (factsAnimated) return;
  factsAnimated = true;
  document.querySelectorAll(".fact-num[data-count]").forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.ceil(target / 30);
    const iv = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(iv);
    }, 40);
  });
  const ghzEl = document.querySelector(".fact-num.ghz");
  if (ghzEl) {
    let v = 0;
    const iv = setInterval(() => {
      v = Math.min(v + 0.1, 3.5);
      ghzEl.textContent = v.toFixed(1);
      if (v >= 3.5) clearInterval(iv);
    }, 40);
  }
}
setTimeout(animateFacts, 600);

// ──────────────────────────────────────────────
// INSTRUCTION CYCLE
// ──────────────────────────────────────────────
let cycleStep = -1;
let cycleAutoTimer = null;
let cycleRunning = false;

const cycleData = [
  {
    status: "🔍 FETCH — Buscando instrução na memória...",
    regHighlight: ["cvPC", "cvMAR"],
    pcVal: "0x00", marVal: "0x00", mdrVal: "—", irVal: "—",
    aluDisplay: "—",
    r1Val: null, r2Val: null, r3Val: null,
    memCell: 0
  },
  {
    status: "📡 FETCH — MDR recebe instrução da RAM: 'ADD R1, R2'",
    regHighlight: ["cvMDR", "cvIR"],
    pcVal: "0x00", marVal: "0x00", mdrVal: "ADD R1,R2", irVal: "—",
    aluDisplay: "—",
    r1Val: null, r2Val: null, r3Val: null,
    memCell: 0
  },
  {
    status: "🔓 DECODE — Unidade de Controle decodifica: operação ADD, operandos R1 e R2",
    regHighlight: ["cvIR"],
    pcVal: "0x00", marVal: "0x00", mdrVal: "ADD R1,R2", irVal: "ADD R1,R2",
    aluDisplay: "—",
    r1Val: null, r2Val: null, r3Val: null,
    memCell: 0
  },
  {
    status: "📥 FETCH OPERANDS — Lendo R1=0 e R2=3 dos registradores",
    regHighlight: ["cvR1", "cvR2"],
    pcVal: "0x00", marVal: "0x00", mdrVal: "ADD R1,R2", irVal: "ADD R1,R2",
    aluDisplay: "0 + 3",
    r1Val: "0", r2Val: "3", r3Val: null,
    memCell: 0
  },
  {
    status: "⚡ EXECUTE — ULA calcula: 0 + 3 = 3",
    regHighlight: ["cvALU"],
    pcVal: "0x01", marVal: "0x00", mdrVal: "ADD R1,R2", irVal: "ADD R1,R2",
    aluDisplay: "0 + 3 = 3",
    r1Val: "0", r2Val: "3", r3Val: null,
    memCell: 0
  },
  {
    status: "💾 WRITE BACK — Resultado 3 é escrito em R1. PC incrementado para 0x01.",
    regHighlight: ["cvR1", "cvPC"],
    pcVal: "0x01", marVal: "0x00", mdrVal: "ADD R1,R2", irVal: "ADD R1,R2",
    aluDisplay: "→ R1 = 3",
    r1Val: "3", r2Val: "3", r3Val: null,
    memCell: 0
  }
];

function nextCycleStep() {
  cycleStep = Math.min(cycleStep + 1, cycleData.length - 1);
  renderCycleStep();
}

function resetCycle() {
  cycleStep = -1;
  stopAutoCycle();
  document.querySelectorAll(".cycle-step").forEach(s => {
    s.classList.remove("active", "done");
  });
  document.getElementById("cycleStatus").textContent = "⬅️ Clique em 'Próxima fase' para iniciar";
  setRegVal("pcVal","0x00"); setRegVal("marVal","—");
  setRegVal("mdrVal","—"); setRegVal("irVal","—");
  setRegVal("r1Val","0"); setRegVal("r2Val","3"); setRegVal("r3Val","0");
  document.getElementById("aluDisplay").textContent = "—";
  document.querySelectorAll(".cv-reg").forEach(r => r.classList.remove("active-reg"));
}

function renderCycleStep() {
  if (cycleStep < 0 || cycleStep >= cycleData.length) return;
  const d = cycleData[cycleStep];

  document.getElementById("cycleStatus").textContent = d.status;

  // Highlight step card
  const stepIndex = [0,0,1,2,3,4][cycleStep];
  document.querySelectorAll(".cycle-step").forEach((s, i) => {
    s.classList.toggle("active", i === stepIndex);
    s.classList.toggle("done", i < stepIndex);
  });

  // Registers
  setRegVal("pcVal",  d.pcVal);
  setRegVal("marVal", d.marVal);
  setRegVal("mdrVal", d.mdrVal);
  setRegVal("irVal",  d.irVal);
  if (d.r1Val !== null) setRegVal("r1Val", d.r1Val);
  if (d.r2Val !== null) setRegVal("r2Val", d.r2Val);
  if (d.r3Val !== null) setRegVal("r3Val", d.r3Val);

  document.getElementById("aluDisplay").textContent = d.aluDisplay;

  // Highlight active registers
  document.querySelectorAll(".cv-reg").forEach(r => r.classList.remove("active-reg"));
  d.regHighlight.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("active-reg");
  });

  // Memory cell
  document.querySelectorAll(".mem-cell").forEach((c, i) => {
    c.classList.toggle("active-cell", i === d.memCell);
  });
}

function setRegVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = val;
    el.parentElement.classList.add("active-reg");
    setTimeout(() => el.parentElement.classList.remove("active-reg"), 600);
  }
}

function toggleAutoCycle() {
  if (cycleAutoTimer) {
    stopAutoCycle();
  } else {
    cycleRunning = true;
    document.getElementById("cycleAuto").textContent = "⏸ Pausar";
    cycleAutoTimer = setInterval(() => {
      if (cycleStep >= cycleData.length - 1) {
        stopAutoCycle();
        return;
      }
      nextCycleStep();
    }, 1400);
  }
}
function stopAutoCycle() {
  clearInterval(cycleAutoTimer);
  cycleAutoTimer = null;
  cycleRunning = false;
  document.getElementById("cycleAuto").textContent = "▶ Auto";
}

// ──────────────────────────────────────────────
// CPU SIMULATOR
// ──────────────────────────────────────────────
const SIM_REGISTERS = ["R0","R1","R2","R3","R4","R5","R6","R7"];
let simRegs = {};
let simPC = 0;
let simIR = "—";
let simACC = 0;
let simFlags = { Z:0, N:0, C:0, O:0 };
let simProgram = [];
let simRunning = false;
let simTimer = null;
let simInitialized = false;

const examples = {
  basic: `; Exemplo básico: soma dois números
MOV R1, 5
MOV R2, 3
ADD R1, R2
HALT`,
  loop: `; Loop: conta de 1 a 5
MOV R1, 0
MOV R2, 5
MOV R3, 1
loop:
ADD R1, R3
CMP R1, R2
JZ  done
JMP loop
done:
HALT`,
  conditional: `; Condicional: maior entre R1 e R2
MOV R1, 7
MOV R2, 4
CMP R1, R2
JZ  iguais
MOV R0, R1
HALT
iguais:
MOV R0, R2
HALT`
};

function initSim() {
  if (simInitialized) return;
  simInitialized = true;
  renderSimRegs();
  loadExample("basic");
}

function renderSimRegs() {
  const grid = document.getElementById("simRegsGrid");
  grid.innerHTML = "";
  SIM_REGISTERS.forEach(reg => {
    const div = document.createElement("div");
    div.className = "sim-reg";
    div.id = "sreg-" + reg;
    div.innerHTML = `<div class="sim-reg-name">${reg}</div><div class="sim-reg-val" id="sval-${reg}">0</div>`;
    grid.appendChild(div);
  });
}

function loadExample(name) {
  document.getElementById("asmEditor").value = examples[name] || "";
}

function clearEditor() {
  document.getElementById("asmEditor").value = "";
}

function parseProgram(source) {
  const lines = source.split("\n");
  const instructions = [];
  const labels = {};

  // First pass: collect labels
  let addr = 0;
  lines.forEach(line => {
    const cleaned = line.trim().replace(/;.*$/, "").trim();
    if (!cleaned) return;
    if (cleaned.endsWith(":")) {
      labels[cleaned.slice(0, -1).toLowerCase()] = addr;
    } else {
      addr++;
    }
  });

  // Second pass: parse instructions
  lines.forEach(line => {
    const cleaned = line.trim().replace(/;.*$/, "").trim();
    if (!cleaned || cleaned.endsWith(":")) return;
    const parts = cleaned.split(/[\s,]+/).filter(Boolean);
    const op = parts[0].toUpperCase();
    instructions.push({ op, args: parts.slice(1), labels });
  });

  return { instructions, labels };
}

function loadProgram() {
  const src = document.getElementById("asmEditor").value;
  if (!src.trim()) { logConsole("Nenhum código para carregar.", "warn"); return; }

  try {
    const { instructions } = parseProgram(src);
    if (!instructions.length) { logConsole("Nenhuma instrução encontrada.", "warn"); return; }

    simProgram = instructions;
    resetSimState();
    renderProgMemory();

    document.getElementById("btnStep").disabled = false;
    document.getElementById("btnRun").disabled  = false;
    document.getElementById("btnReset").disabled = false;
    document.getElementById("btnLoad").disabled  = true;

    logConsole(`✅ Programa carregado: ${instructions.length} instrução(ões).`, "success");
    updateSimUI();
  } catch(e) {
    logConsole("❌ Erro ao compilar: " + e.message, "error");
  }
}

function resetSimState() {
  simRegs = {};
  SIM_REGISTERS.forEach(r => simRegs[r] = 0);
  simPC = 0;
  simIR = "—";
  simACC = 0;
  simFlags = {Z:0, N:0, C:0, O:0};
  clearInterval(simTimer);
  simRunning = false;
}

function resetSim() {
  clearInterval(simTimer);
  simRunning = false;
  simProgram = [];
  simPC = 0; simIR = "—"; simACC = 0;
  simFlags = {Z:0, N:0, C:0, O:0};
  SIM_REGISTERS.forEach(r => simRegs[r] = 0);
  document.getElementById("btnStep").disabled = true;
  document.getElementById("btnRun").disabled  = true;
  document.getElementById("btnReset").disabled = true;
  document.getElementById("btnLoad").disabled  = false;
  document.getElementById("progMemory").innerHTML = "";
  updateSimUI();
  logConsole("↺ Simulador reiniciado.", "info");
}

function stepProgram() {
  if (simPC >= simProgram.length) {
    logConsole("⚠️ Fim do programa.", "warn");
    return;
  }
  execInstruction();
}

function runProgram() {
  if (simRunning) {
    clearInterval(simTimer);
    simRunning = false;
    document.getElementById("btnRun").textContent = "▶ Executar";
    return;
  }
  simRunning = true;
  document.getElementById("btnRun").textContent = "⏸ Pausar";
  simTimer = setInterval(() => {
    if (simPC >= simProgram.length) {
      clearInterval(simTimer);
      simRunning = false;
      document.getElementById("btnRun").textContent = "▶ Executar";
      logConsole("✅ Execução concluída.", "success");
      return;
    }
    execInstruction();
  }, 600);
}

function execInstruction() {
  if (simPC >= simProgram.length) return;
  const instr = simProgram[simPC];
  simIR = instr.op + " " + instr.args.join(", ");

  logConsole(`→ [PC:${simPC}] ${simIR}`, "exec");

  const { op, args, labels } = instr;
  const getVal = (a) => {
    if (!a) return 0;
    if (a.toUpperCase() in simRegs) return simRegs[a.toUpperCase()];
    const n = parseInt(a);
    return isNaN(n) ? 0 : n;
  };

  let jumped = false;
  const prevRegs = { ...simRegs };

  switch (op) {
    case "MOV": {
      const dest = args[0].toUpperCase();
      simRegs[dest] = getVal(args[1]);
      logConsole(`  ${dest} ← ${simRegs[dest]}`, "result");
      break;
    }
    case "ADD": {
      const dest = args[0].toUpperCase();
      const src  = getVal(args[1]);
      simRegs[dest] += src;
      simACC = simRegs[dest];
      setFlags(simRegs[dest]);
      logConsole(`  ${dest} ← ${simRegs[dest]}`, "result");
      break;
    }
    case "SUB": {
      const dest = args[0].toUpperCase();
      simRegs[dest] -= getVal(args[1]);
      simACC = simRegs[dest];
      setFlags(simRegs[dest]);
      logConsole(`  ${dest} ← ${simRegs[dest]}`, "result");
      break;
    }
    case "MUL": {
      const dest = args[0].toUpperCase();
      simRegs[dest] *= getVal(args[1]);
      simACC = simRegs[dest];
      setFlags(simRegs[dest]);
      logConsole(`  ${dest} ← ${simRegs[dest]}`, "result");
      break;
    }
    case "CMP": {
      const diff = getVal(args[0]) - getVal(args[1]);
      setFlags(diff);
      logConsole(`  CMP: diff=${diff} ZF=${simFlags.Z} NF=${simFlags.N}`, "result");
      break;
    }
    case "JMP": {
      const lbl = args[0].toLowerCase();
      if (lbl in labels) {
        simPC = labels[lbl];
        jumped = true;
        logConsole(`  → Salto para '${args[0]}' (PC=${simPC})`, "result");
      } else {
        logConsole(`  ❌ Label '${args[0]}' não encontrado`, "error");
      }
      break;
    }
    case "JZ": {
      if (simFlags.Z) {
        const lbl = args[0].toLowerCase();
        if (lbl in labels) {
          simPC = labels[lbl];
          jumped = true;
          logConsole(`  → ZF=1: Salto para '${args[0]}' (PC=${simPC})`, "result");
        }
      } else {
        logConsole(`  → ZF=0: Sem salto`, "result");
      }
      break;
    }
    case "HALT": {
      clearInterval(simTimer);
      simRunning = false;
      document.getElementById("btnRun").textContent = "▶ Executar";
      logConsole("🛑 HALT — Programa encerrado.", "success");
      logConsole(`Estado final: ${SIM_REGISTERS.map(r=>`${r}=${simRegs[r]}`).join(", ")}`, "result");
      simPC++;
      updateSimUI(prevRegs);
      renderProgMemory();
      return;
    }
    default:
      logConsole(`⚠️ Instrução desconhecida: ${op}`, "warn");
  }

  if (!jumped) simPC++;

  updateSimUI(prevRegs);
  renderProgMemory();
}

function setFlags(val) {
  simFlags.Z = val === 0 ? 1 : 0;
  simFlags.N = val < 0  ? 1 : 0;
  simFlags.C = 0;
  simFlags.O = 0;
}

function updateSimUI(prevRegs) {
  SIM_REGISTERS.forEach(r => {
    const el = document.getElementById("sval-" + r);
    const box = document.getElementById("sreg-" + r);
    if (el) {
      el.textContent = simRegs[r] ?? 0;
      if (prevRegs && prevRegs[r] !== simRegs[r]) {
        box.classList.add("changed");
        setTimeout(() => box.classList.remove("changed"), 700);
      }
    }
  });
  document.getElementById("simPC").textContent = simPC;
  document.getElementById("simIR").textContent = simIR;
  document.getElementById("simACC").textContent = simACC;

  ["Z","N","C","O"].forEach(f => {
    const el = document.getElementById("f" + f);
    const box = document.getElementById("flag" + f);
    if (el) {
      el.textContent = simFlags[f];
      box.classList.toggle("active", simFlags[f] === 1);
    }
  });
}

function renderProgMemory() {
  const pm = document.getElementById("progMemory");
  pm.innerHTML = "";
  simProgram.forEach((instr, i) => {
    const row = document.createElement("div");
    row.className = "pm-row" + (i === simPC ? " current" : "");
    row.innerHTML = `
      <span class="pm-addr">${String(i).padStart(2,"0")}:</span>
      <span class="pm-inst">${instr.op} ${instr.args.join(", ")}</span>
      ${i === simPC ? '<span class="pm-arrow">◀ PC</span>' : ""}
    `;
    pm.appendChild(row);
  });
  // Scroll to current PC
  const cur = pm.querySelector(".current");
  if (cur) cur.scrollIntoView({ block: "nearest" });
}

function logConsole(msg, type = "info") {
  const div = document.createElement("div");
  div.className = "console-line console-" + type;
  div.textContent = msg;
  const con = document.getElementById("consoleOutput");
  con.appendChild(div);
  con.scrollTop = con.scrollHeight;
}

// ──────────────────────────────────────────────
// PIPELINE
// ──────────────────────────────────────────────
const STAGES = ["IF","ID","EX","MEM","WB"];
const K = 5; // pipeline stages
let pipelineAnimTimer = null;

function initPipelineViz() {
  updatePipelineViz();
}

function updatePipelineViz() {
  const n = parseInt(document.getElementById("numInstSlider").value);
  document.getElementById("numInstLabel").textContent = n;

  // Update speedup calc
  const noPipeCycles = n * K;
  const pipeCycles   = n + (K - 1);
  const speedup      = (noPipeCycles / pipeCycles).toFixed(2);
  document.getElementById("calcN").textContent = n;
  document.getElementById("calcNoPipe").textContent = noPipeCycles;
  document.getElementById("calcPipe").textContent = pipeCycles;
  document.getElementById("calcSpeedup").textContent = speedup + "×";

  buildGrids(n, false);
}

function buildGrids(n, animate) {
  const noPipeGrid = document.getElementById("noPipeGrid");
  const pipeGrid   = document.getElementById("pipeGrid");
  noPipeGrid.innerHTML = "";
  pipeGrid.innerHTML   = "";

  // No-pipeline: each instruction takes K cycles, sequential
  const totalCyclesNoPipe = n * K;
  noPipeGrid.style.gridTemplateColumns = `repeat(${totalCyclesNoPipe}, 1fr)`;
  for (let i = 0; i < n; i++) {
    for (let s = 0; s < K; s++) {
      const cell = document.createElement("div");
      cell.className = `pipe-cell pipe-${STAGES[s]}${animate ? "" : " visible"}`;
      cell.textContent = STAGES[s];
      cell.dataset.delay = ((i * K) + s) * 80;
      noPipeGrid.appendChild(cell);
    }
    // Add empty columns for alignment if needed (none needed here)
  }
  document.getElementById("noPipeStat").textContent = `Ciclos: ${totalCyclesNoPipe}`;

  // Pipeline: staggered
  const totalCyclesPipe = n + K - 1;
  pipeGrid.style.gridTemplateColumns = `repeat(${totalCyclesPipe}, 1fr)`;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < totalCyclesPipe; c++) {
      const cell = document.createElement("div");
      if (c >= i && c < i + K) {
        const s = c - i;
        cell.className = `pipe-cell pipe-${STAGES[s]}${animate ? "" : " visible"}`;
        cell.textContent = STAGES[s];
        cell.dataset.delay = c * 100;
      } else {
        cell.className = "pipe-cell pipe-empty visible";
      }
      pipeGrid.appendChild(cell);
    }
  }
  document.getElementById("pipeStat").textContent = `Ciclos: ${totalCyclesPipe}`;
}

function animatePipeline() {
  clearTimeout(pipelineAnimTimer);
  const n = parseInt(document.getElementById("numInstSlider").value);
  buildGrids(n, true);

  const cells = document.querySelectorAll(".pipe-cell:not(.pipe-empty)");
  cells.forEach(c => {
    const delay = parseInt(c.dataset.delay) || 0;
    setTimeout(() => c.classList.add("visible"), delay);
  });
}

function resetPipeline() {
  const n = parseInt(document.getElementById("numInstSlider").value);
  buildGrids(n, false);
  document.querySelectorAll(".pipe-cell").forEach(c => c.classList.remove("visible"));
}

// ──────────────────────────────────────────────
// MEMORY HIERARCHY & CACHE DEMO
// ──────────────────────────────────────────────
const RAM_SIZE = 32;
let cacheSlots = new Array(8).fill(null); // stores addresses
let cacheHits = 0;
let cacheMisses = 0;
let cacheInitialized = false;

function initCacheDemo() {
  if (cacheInitialized) return;
  cacheInitialized = true;
  renderCache();
  renderRAM();

  // Pyramid layer click
  document.querySelectorAll(".pyramid-layer").forEach(layer => {
    layer.addEventListener("click", () => {
      layer.style.filter = "brightness(1.5)";
      setTimeout(() => layer.style.filter = "", 400);
    });
  });
}

function renderCache() {
  const container = document.getElementById("cacheSlots");
  container.innerHTML = "";
  cacheSlots.forEach((slot, i) => {
    const div = document.createElement("div");
    div.className = "cache-slot" + (slot !== null ? " occupied" : "");
    div.id = "cs-" + i;
    div.innerHTML = `<span>Slot ${i}</span><span>${slot !== null ? `Addr: ${slot}` : "vazio"}</span>`;
    container.appendChild(div);
  });
}

function renderRAM() {
  const container = document.getElementById("ramCells");
  container.innerHTML = "";
  for (let i = 0; i < RAM_SIZE; i++) {
    const div = document.createElement("div");
    div.className = "ram-cell";
    div.id = "rc-" + i;
    div.textContent = `[${i}]`;
    container.appendChild(div);
  }
}

function simulateCacheAccess() {
  const addr = parseInt(document.getElementById("cacheAddr").value);
  if (isNaN(addr) || addr < 0 || addr >= RAM_SIZE) {
    document.getElementById("cacheResult").textContent = "⚠️ Endereço inválido (0–31)";
    document.getElementById("cacheResult").className = "cache-result miss";
    return;
  }

  // Clear old highlights
  document.querySelectorAll(".cache-slot").forEach(s => s.classList.remove("hit-slot","miss-slot"));
  document.querySelectorAll(".ram-cell").forEach(r => r.classList.remove("accessed"));

  // Highlight RAM cell
  const ramCell = document.getElementById("rc-" + addr);
  if (ramCell) ramCell.classList.add("accessed");

  // Check cache
  const slotIndex = cacheSlots.indexOf(addr);
  const resultEl = document.getElementById("cacheResult");
  const arrowEl  = document.getElementById("cacheArrow");

  if (slotIndex !== -1) {
    // HIT
    cacheHits++;
    document.getElementById("cs-" + slotIndex).classList.add("hit-slot");
    resultEl.textContent = `✅ CACHE HIT! Endereço ${addr} encontrado no Slot ${slotIndex} — acesso em ~1–4 ns`;
    resultEl.className = "cache-result hit";
    arrowEl.textContent = "⟵";
    arrowEl.className = "cache-demo-arrow hit";
  } else {
    // MISS
    cacheMisses++;
    // LRU eviction (remove oldest = first element, add new at end)
    const evict = cacheSlots.indexOf(null) !== -1
      ? cacheSlots.indexOf(null)
      : 0;
    if (cacheSlots[evict] !== null) {
      resultEl.textContent = `❌ CACHE MISS! Buscando addr ${addr} na RAM (~60–100 ns). Evicting Slot ${evict} (addr ${cacheSlots[evict]}).`;
    } else {
      resultEl.textContent = `❌ CACHE MISS! Buscando addr ${addr} na RAM (~60–100 ns). Carregando em Slot ${evict}.`;
    }
    cacheSlots[evict] = addr;
    resultEl.className = "cache-result miss";
    arrowEl.textContent = "⟶";
    arrowEl.className = "cache-demo-arrow miss";

    setTimeout(() => {
      renderCache();
      document.getElementById("cs-" + evict).classList.add("miss-slot");
      setTimeout(() => document.getElementById("cs-" + evict).classList.remove("miss-slot"), 1000);
    }, 300);
  }

  renderCache();
  if (slotIndex !== -1) {
    document.getElementById("cs-" + slotIndex).classList.add("hit-slot");
  }

  // Update stats
  const total = cacheHits + cacheMisses;
  document.getElementById("cacheHits").textContent    = cacheHits;
  document.getElementById("cacheMisses").textContent  = cacheMisses;
  document.getElementById("cacheHitRate").textContent = total ? Math.round((cacheHits / total) * 100) + "%" : "0%";
}

function clearCacheDemo() {
  cacheSlots = new Array(8).fill(null);
  cacheHits = 0; cacheMisses = 0;
  document.getElementById("cacheHits").textContent    = "0";
  document.getElementById("cacheMisses").textContent  = "0";
  document.getElementById("cacheHitRate").textContent = "0%";
  document.getElementById("cacheResult").textContent  = "";
  document.getElementById("cacheResult").className    = "cache-result";
  document.getElementById("cacheArrow").className     = "cache-demo-arrow";
  document.getElementById("cacheArrow").textContent   = "⟶";
  document.querySelectorAll(".ram-cell").forEach(r => r.classList.remove("accessed"));
  renderCache();
}

// ──────────────────────────────────────────────
// QUIZ
// ──────────────────────────────────────────────
const quizQuestions = [
  {
    q: "O que significa a sigla ULA (ou ALU em inglês)?",
    options: ["Unidade de Leitura de Arquivos","Unidade Lógica e Aritmética","Unidade de Largura de Anel","Unidade de Localização Avançada"],
    correct: 1,
    explanation: "ULA = Unidade Lógica e Aritmética. É o componente que realiza operações aritméticas (soma, subtração) e lógicas (AND, OR, NOT) dentro da CPU."
  },
  {
    q: "Qual registrador guarda o endereço da próxima instrução a ser executada?",
    options: ["IR (Instruction Register)","ACC (Acumulador)","PC (Program Counter)","MDR (Memory Data Register)"],
    correct: 2,
    explanation: "O PC (Program Counter) sempre aponta para o endereço da próxima instrução. Após cada fetch, ele é incrementado automaticamente."
  },
  {
    q: "Em qual fase do ciclo de instrução a CPU identifica a operação a ser realizada?",
    options: ["Fetch","Decode","Execute","Write Back"],
    correct: 1,
    explanation: "Na fase Decode, a Unidade de Controle analisa os bits da instrução no IR para identificar: qual operação realizar e quais são os operandos."
  },
  {
    q: "O que é pipeline em processadores?",
    options: [
      "Uma forma de aumentar a capacidade de memória RAM",
      "Execução sequencial de instruções, uma por vez",
      "Sobreposição de fases de diferentes instruções para aumentar throughput",
      "Um tipo de barramento de dados"
    ],
    correct: 2,
    explanation: "Pipeline divide a execução em estágios e processa várias instruções simultaneamente em diferentes estágios — como uma linha de montagem. Isso aumenta o throughput (instruções por unidade de tempo)."
  },
  {
    q: "Qual é a ordem correta dos níveis de cache do mais rápido para o mais lento?",
    options: ["L3 → L2 → L1","L1 → L2 → L3","L2 → L1 → L3","L3 → L1 → L2"],
    correct: 1,
    explanation: "L1 é o mais rápido e menor (32–64 KB, ~1–4 ns), seguido por L2 (256 KB–4 MB, ~4–12 ns) e L3 (4–32 MB, ~12–40 ns). Quanto mais próximo da CPU, mais rápido."
  },
  {
    q: "O que ocorre em um 'Cache Miss'?",
    options: [
      "O dado é encontrado rapidamente no cache",
      "O processador para definitivamente",
      "O dado não está no cache e precisa ser buscado na RAM, causando atraso",
      "O cache é apagado completamente"
    ],
    correct: 2,
    explanation: "Cache Miss significa que o dado procurado não está em nenhum nível de cache. A CPU precisa buscar na RAM (~60–100 ns), o que é muito mais lento do que acessar o cache L1 (~1–4 ns)."
  },
  {
    q: "O que é um 'Data Hazard' no pipeline?",
    options: [
      "Quando dois programas acessam a mesma memória",
      "Quando uma instrução depende do resultado de uma instrução anterior que ainda não completou",
      "Quando há falta de energia no processador",
      "Quando o barramento de dados está ocupado"
    ],
    correct: 1,
    explanation: "Data Hazard ocorre quando uma instrução precisa de um valor que ainda está sendo calculado por uma instrução anterior no pipeline. Soluções incluem forwarding (encaminhar o resultado antes do write-back) e stalling (inserir bolhas/NOPs)."
  },
  {
    q: "O que significa ISA em arquitetura de computadores?",
    options: [
      "Integrated Software Architecture",
      "Internal System Algorithm",
      "Instruction Set Architecture",
      "Input/Storage Array"
    ],
    correct: 2,
    explanation: "ISA (Instruction Set Architecture) é o conjunto de instruções que a CPU é capaz de executar. Exemplos: x86-64 (Intel/AMD), ARM (smartphones), RISC-V (open source). Define o 'contrato' entre hardware e software."
  },
  {
    q: "Quantos bits são tipicamente processados de uma vez em CPUs modernas?",
    options: ["8 bits","16 bits","32 bits","64 bits"],
    correct: 3,
    explanation: "CPUs modernas são 64-bit, o que significa que processam 64 bits por vez. Isso permite endereçar até 2⁶⁴ = 16 exabytes de memória teoricamente — muito mais do que CPUs 32-bit (4 GB)."
  },
  {
    q: "Qual componente da CPU coordena todas as operações sem realizar cálculos diretamente?",
    options: ["ULA","Cache L1","Unidade de Controle","Registrador PC"],
    correct: 2,
    explanation: "A Unidade de Controle (CU) é o 'maestro' da CPU. Ela gera sinais de controle para coordenar ULA, registradores e memória, mas não realiza cálculos — isso é tarefa da ULA."
  }
];

let currentQuestion = 0;
let answers = new Array(quizQuestions.length).fill(null);
let quizInitialized = false;

function initQuiz() {
  if (quizInitialized) return;
  quizInitialized = true;
  renderQuestion(0);
}

function renderQuestion(idx) {
  const q = quizQuestions[idx];
  const area = document.getElementById("questionArea");
  const answered = answers[idx] !== null;

  // Progress
  const filled = answers.filter(a => a !== null).length;
  document.getElementById("quizProgFill").style.width = (filled / quizQuestions.length * 100) + "%";
  document.getElementById("quizProgText").textContent = `Questão ${idx+1} de ${quizQuestions.length}`;

  let html = `
    <div class="question-num">Questão ${idx+1}</div>
    <div class="question-text">${q.q}</div>
    <div class="options-list">
  `;
  const letters = ["A","B","C","D","E"];
  q.options.forEach((opt, i) => {
    let cls = "";
    if (answered) {
      if (i === q.correct) cls = "correct";
      else if (i === answers[idx] && i !== q.correct) cls = "wrong";
    }
    html += `
      <button class="option-btn ${cls}" onclick="selectAnswer(${idx},${i})" ${answered ? "disabled" : ""}>
        <span class="opt-letter">${letters[i]}</span>
        ${opt}
      </button>
    `;
  });
  html += `</div>`;

  if (answered) {
    const correct = answers[idx] === q.correct;
    html += `<div class="answer-explanation">
      ${correct ? "✅ Correto!" : "❌ Incorreto."} ${q.explanation}
    </div>`;
  }

  area.innerHTML = html;

  // Nav buttons
  document.getElementById("btnPrevQ").disabled = idx === 0;
  document.getElementById("btnNextQ").disabled = !answered;

  const score = answers.filter((a, i) => a === quizQuestions[i].correct).length;
  const answeredCount = answers.filter(a => a !== null).length;
  document.getElementById("quizScoreInline").textContent =
    answeredCount > 0 ? `✅ ${score}/${answeredCount}` : "";
}

function selectAnswer(qIdx, optIdx) {
  if (answers[qIdx] !== null) return;
  answers[qIdx] = optIdx;
  visitedTabs.add("quiz");
  updateProgress();
  renderQuestion(qIdx);

  const allDone = answers.every(a => a !== null);
  if (allDone) {
    setTimeout(showResults, 800);
  }
}

function nextQuestion() {
  if (currentQuestion < quizQuestions.length - 1) {
    currentQuestion++;
    renderQuestion(currentQuestion);
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion(currentQuestion);
  }
}

function showResults() {
  const score = answers.filter((a, i) => a === quizQuestions[i].correct).length;
  const pct = Math.round(score / quizQuestions.length * 100);

  document.getElementById("quizCard").style.display = "none";
  const resCard = document.getElementById("quizResults");
  resCard.style.display = "block";

  const emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "📚" : "💪";
  document.querySelector("#quizResults .results-icon").textContent = emoji;

  const titles = {
    90: "Excelente! Você domina o assunto!",
    70: "Muito bom! Pequenos detalhes a revisar.",
    50: "Bom esforço! Continue estudando.",
    0:  "Não desanime! Revise o material e tente novamente."
  };
  const threshold = [90,70,50,0].find(t => pct >= t);
  document.getElementById("resultsTitle").textContent = titles[threshold];
  document.getElementById("resultsScore").textContent = `${score} / ${quizQuestions.length}`;
  document.getElementById("resultsFeedback").textContent =
    `Você acertou ${pct}% das questões. ${pct >= 70 ? "Parabéns pela dedicação!" : "Revise os tópicos em que errou nas seções anteriores."}`;

  setTimeout(() => {
    document.getElementById("resultsBar").style.width = pct + "%";
  }, 100);
}

function restartQuiz() {
  currentQuestion = 0;
  answers = new Array(quizQuestions.length).fill(null);
  document.getElementById("quizCard").style.display = "block";
  document.getElementById("quizResults").style.display = "none";
  renderQuestion(0);
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateProgress();
  updatePipelineViz();
});
