export interface SyllabusModuleSeed {
  conceptSlug: string;
  orderIndex: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  unitsNote: string;
  objectives: string[];
  coreExplanation: string;
  workedExample: {
    problem: string;
    steps: string[];
    answer: string;
  };
  misconceptionWatch: string;
  simulatorType: 'current' | 'voltage' | 'ohms' | 'resistance' | 'series' | 'parallel' | 'power' | 'energy';
  quickCheck: {
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  };
}

export const ELECTRICITY_MODULES: SyllabusModuleSeed[] = [
  {
    conceptSlug: 'electric-current',
    orderIndex: 1,
    title: '01. Electric Current & Charge Flow',
    subtitle: 'Understanding charge carriers, ampere definition, and unit conversions',
    estimatedMinutes: 8,
    unitsNote: 'I in Amperes (A) · Q in Coulombs (C) · t in Seconds (s)',
    objectives: [
      'Define electric current as the rate of flow of net electric charge.',
      'Convert time from minutes/hours to SI seconds before solving Q = I × t.',
      'Relate macroscopic current to discrete electron count using Q = n × e.',
    ],
    coreExplanation:
      'Electric current (I) measures how much electric charge (Q) passes a cross-section of a conductor every second: I = Q / t. One ampere equals one coulomb of charge flowing per second. Conventional current flows from higher potential (+) to lower potential (−), opposite to actual electron drift.',
    workedExample: {
      problem: 'A steady current of 0.8 A flows through an electric iron for 5 minutes. Calculate the total charge passing through the element.',
      steps: [
        'Convert time to SI seconds: t = 5 × 60 = 300 s.',
        'Rearrange I = Q / t to Q = I × t.',
        'Compute Q = 0.8 A × 300 s = 240 C.',
      ],
      answer: '240 C',
    },
    misconceptionWatch:
      'Watch out for leaving time in minutes or dividing time by charge. Always convert minutes to seconds first.',
    simulatorType: 'current',
    quickCheck: {
      question: 'If 60 C of charge passes through a wire in 20 seconds, what is the electric current?',
      options: ['0.33 A', '3 A', '1200 A', '40 A'],
      correctIndex: 1,
      explanation: 'I = Q / t = 60 C / 20 s = 3 A.',
    },
  },
  {
    conceptSlug: 'potential-difference',
    orderIndex: 2,
    title: '02. Electric Potential & Potential Difference',
    subtitle: 'Work done per unit charge and how voltmeters measure energy transfer',
    estimatedMinutes: 8,
    unitsNote: 'V in Volts (V) · W in Joules (J) · Q in Coulombs (C)',
    objectives: [
      'Define 1 Volt as 1 Joule of work done per 1 Coulomb of charge moved.',
      'Calculate work or energy transferred using W = V × Q.',
      'Explain why a voltmeter has high resistance and connects in parallel.',
    ],
    coreExplanation:
      'Charges require an energy gradient—called potential difference (V)—to sustain steady flow. Potential difference between two points equals the work done per unit positive charge moved between them: V = W / Q. A voltmeter connects in parallel across two points with very high internal resistance so it measures voltage without diverting circuit current.',
    workedExample: {
      problem: 'How much work is done when 4 C of charge moves across two terminals maintained at 9 V?',
      steps: [
        'Identify V = 9 V and Q = 4 C.',
        'Apply W = V × Q.',
        'Compute W = 9 × 4 = 36 J.',
      ],
      answer: '36 J',
    },
    misconceptionWatch:
      'Do not confuse a voltmeter (high resistance, connected in parallel) with an ammeter (low resistance, connected in series).',
    simulatorType: 'voltage',
    quickCheck: {
      question: 'If 48 J of work moves 4 C of charge between two points, what is the potential difference?',
      options: ['192 V', '12 V', '0.083 V', '44 V'],
      correctIndex: 1,
      explanation: 'V = W / Q = 48 J / 4 C = 12 V.',
    },
  },
  {
    conceptSlug: 'ohms-law',
    orderIndex: 3,
    title: "03. Ohm's Law & V-I Proportionality",
    subtitle: 'Inverse current-resistance relationship and interpreting V-I graphs',
    estimatedMinutes: 10,
    unitsNote: 'V in Volts (V) · I in Amperes (A) · R in Ohms (Ω)',
    objectives: [
      "State Ohm's Law and identify its constant-temperature assumption.",
      'Predict how current responds inversely when resistance changes at constant voltage.',
      'Extract resistance from the slope of a V-vs-I graph.',
    ],
    coreExplanation:
      "At constant temperature, the current flowing through a metallic conductor is directly proportional to the potential difference across its ends: V = I × R. Crucially, for a fixed supply voltage V, rearranging to I = V / R shows that current is INVERSELY proportional to resistance—increasing resistance restricts charge flow and lowers current.",
    workedExample: {
      problem: 'A lamp draws 0.6 A from a 12 V source. What is its resistance, and what current flows if resistance doubles at 12 V?',
      steps: [
        'Find resistance R = V / I = 12 V / 0.6 A = 20 Ω.',
        'Double the resistance: R_new = 40 Ω.',
        'Compute I_new = 12 V / 40 Ω = 0.3 A (half the original current).',
      ],
      answer: 'R = 20 Ω, I_new = 0.3 A',
    },
    misconceptionWatch:
      'A classic misconception is thinking current increases when resistance increases. Resistance opposes current, so at fixed V, raising R always lowers I.',
    simulatorType: 'ohms',
    quickCheck: {
      question: 'At a constant 12 V supply, resistance increases from 4 Ω to 12 Ω. What happens to the current?',
      options: ['Increases 3 times to 9 A', 'Drops to one-third (1 A)', 'Stays at 3 A', 'Drops to zero'],
      correctIndex: 1,
      explanation: 'Initially I = 12 / 4 = 3 A. At 12 Ω, I = 12 / 12 = 1 A (one-third).',
    },
  },
  {
    conceptSlug: 'resistance',
    orderIndex: 4,
    title: '04. Resistance & Material Resistivity',
    subtitle: 'Distinguishing geometric dimensions (L, A) from intrinsic resistivity (ρ)',
    estimatedMinutes: 10,
    unitsNote: 'R in Ohms (Ω) · ρ in Ω·m · L in m · A in m²',
    objectives: [
      'Apply R = ρ × (L / A) when conductor length or cross-sectional area changes.',
      'Calculate the 4× effect when a wire is stretched uniformly at constant volume.',
      'Separate dimension-dependent resistance (R) from material-intrinsic resistivity (ρ).',
    ],
    coreExplanation:
      'Resistance depends on geometry and material: R = ρ(L / A). Longer wires offer more collisions (R ∝ L), while thicker wires offer wider channels (R ∝ 1/A). Resistivity (ρ), by contrast, depends only on the material and temperature—cutting or stretching a copper wire changes its resistance R, never its resistivity ρ.',
    workedExample: {
      problem: 'A 6 Ω wire is stretched so its length doubles (2L) and area halves (A/2). Find its new resistance.',
      steps: [
        'Write R_new = ρ × (2L) / (A / 2).',
        'Simplify: R_new = 4 × (ρL / A) = 4 × R_old.',
        'Compute 4 × 6 Ω = 24 Ω.',
      ],
      answer: '24 Ω',
    },
    misconceptionWatch:
      'When a wire is stretched to double its length, its area automatically halves to preserve volume—making resistance 4× larger, not 2×.',
    simulatorType: 'resistance',
    quickCheck: {
      question: 'If a uniform wire is replaced by one of the same length and material but double the cross-sectional area, resistance becomes:',
      options: ['Double', 'Half', 'Four times', 'Unchanged'],
      correctIndex: 1,
      explanation: 'Since R = ρL / A, doubling A halves the resistance.',
    },
  },
  {
    conceptSlug: 'series-circuits',
    orderIndex: 5,
    title: '05. Series Resistor Networks',
    subtitle: 'Constant loop current and proportional potential division',
    estimatedMinutes: 10,
    unitsNote: 'R_eq = R₁ + R₂ + ... · I_total = I₁ = I₂ · V_total = V₁ + V₂',
    objectives: [
      'Compute equivalent resistance by summing series resistors.',
      'Recognize that current remains identical at every point in a series loop.',
      'Calculate individual voltage drops using V_k = I × R_k.',
    ],
    coreExplanation:
      'In a series circuit, charge has only one continuous path, so the exact same current flows through every resistor—current is never "used up". Equivalent resistance is R_eq = R₁ + R₂ + ... Total supply voltage divides across the resistors in proportion to their resistance (larger resistor takes a larger share of voltage).',
    workedExample: {
      problem: 'A 3 Ω and a 6 Ω resistor are connected in series to an 18 V battery. Find the voltage across the 6 Ω resistor.',
      steps: [
        'Total resistance R_eq = 3 + 6 = 9 Ω.',
        'Loop current I = 18 V / 9 Ω = 2 A.',
        'Voltage across 6 Ω resistor: V₆ = I × R = 2 A × 6 Ω = 12 V.',
      ],
      answer: '12 V',
    },
    misconceptionWatch:
      'Do not divide the battery voltage directly by a single resistor in series, and do not assume voltage splits 50/50 between unequal resistors.',
    simulatorType: 'series',
    quickCheck: {
      question: 'Two resistors of 5 Ω and 15 Ω are connected in series. If 0.5 A flows through the 5 Ω resistor, what current flows through the 15 Ω resistor?',
      options: ['1.5 A', '0.17 A', '0.5 A', '0 A'],
      correctIndex: 2,
      explanation: 'In a single series loop, current is identical everywhere: 0.5 A.',
    },
  },
  {
    conceptSlug: 'parallel-circuits',
    orderIndex: 6,
    title: '06. Parallel Branch Networks',
    subtitle: 'Equal branch voltage, reciprocal equivalent resistance, and current splitting',
    estimatedMinutes: 10,
    unitsNote: '1/R_eq = 1/R₁ + 1/R₂ · V_total = V₁ = V₂ · I_total = I₁ + I₂',
    objectives: [
      'Calculate equivalent resistance using reciprocals and remember the final inversion.',
      'Verify that R_eq in parallel is always smaller than the smallest individual branch.',
      'Explain why adding parallel appliances reduces equivalent resistance and raises total current.',
    ],
    coreExplanation:
      'Parallel branches connect across the same two nodes, so every branch experiences the full supply potential difference. Total current splits among branches: lower-resistance branches carry larger currents (I_k = V / R_k). Because adding branches opens additional conducting paths, equivalent resistance drops according to 1/R_eq = 1/R₁ + 1/R₂.',
    workedExample: {
      problem: 'Find the equivalent resistance of 4 Ω and 12 Ω connected in parallel across 12 V, plus total current.',
      steps: [
        'Sum reciprocals: 1/R_eq = 1/4 + 1/12 = 3/12 + 1/12 = 4/12 = 1/3.',
        'Invert to find R_eq = 3 Ω.',
        'Total current I = 12 V / 3 Ω = 4 A (3 A + 1 A across branches).',
      ],
      answer: 'R_eq = 3 Ω, I_total = 4 A',
    },
    misconceptionWatch:
      'Always take the reciprocal after adding 1/R₁ + 1/R₂—leaving 1/3 as the final resistance is a frequent calculation trap.',
    simulatorType: 'parallel',
    quickCheck: {
      question: 'What is the equivalent resistance of two 10 Ω resistors connected in parallel?',
      options: ['20 Ω', '10 Ω', '5 Ω', '0.2 Ω'],
      correctIndex: 2,
      explanation: '1/R_eq = 1/10 + 1/10 = 2/10 = 1/5, so R_eq = 5 Ω.',
    },
  },
  {
    conceptSlug: 'electric-power',
    orderIndex: 7,
    title: '07. Electric Power & Appliance Ratings',
    subtitle: 'Applying P = VI, I²R, and V²/R to non-rated operating voltages',
    estimatedMinutes: 9,
    unitsNote: 'P in Watts (W) · 1 kW = 1000 W',
    objectives: [
      'Select among P = V×I, P = I²R, and P = V²/R based on which circuit variable is constant.',
      'Compute a bulb filament resistance from its nameplate rating (V_rated² / P_rated).',
      'Compare brightness of bulbs connected in series vs parallel.',
    ],
    coreExplanation:
      'Electric power is the rate of energy conversion: P = V × I. Substituting Ohm\'s Law gives P = I²R (best when current is shared, as in series) and P = V²/R (best when voltage is shared, as in parallel or across a variable supply). An appliance\'s rated wattage only applies at its rated voltage.',
    workedExample: {
      problem: 'A heater rated 1000 W at 200 V is connected to a 100 V supply. How much power does it consume?',
      steps: [
        'Find constant heater resistance: R = V² / P = 200² / 1000 = 40 Ω.',
        'At 100 V, P_new = 100² / 40 = 10000 / 40 = 250 W.',
        'Notice halving voltage quarters the power (1/2)² = 1/4.',
      ],
      answer: '250 W',
    },
    misconceptionWatch:
      'Power scales with the SQUARE of voltage (V²/R), not linearly. Halving voltage reduces power to one-fourth, not one-half.',
    simulatorType: 'power',
    quickCheck: {
      question: 'A 60 W device operates across a 120 V supply. What current does it draw?',
      options: ['2 A', '0.5 A', '7200 A', '60 A'],
      correctIndex: 1,
      explanation: 'Using P = V × I, I = P / V = 60 W / 120 V = 0.5 A.',
    },
  },
  {
    conceptSlug: 'electrical-energy',
    orderIndex: 8,
    title: '08. Electrical Energy & Joule Heating',
    subtitle: 'Commercial kWh billing and quadratic heat generation H = I²Rt',
    estimatedMinutes: 9,
    unitsNote: 'E in Joules (J) or kWh · 1 kWh = 3.6 × 10⁶ J',
    objectives: [
      'Compute energy in kilowatt-hours (kWh) by converting watts to kilowatts and time to hours.',
      'Apply Joule\'s Law of Heating H = I²Rt in resistive elements.',
      'Explain why doubling current produces 4× the thermal energy.',
    ],
    coreExplanation:
      'Electrical energy equals power multiplied by time (E = P × t). For household billing, energy is measured in kilowatt-hours (1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ J). In purely resistive conductors, electrical work converts into heat according to Joule\'s Law: H = I²Rt.',
    workedExample: {
      problem: 'A 2000 W geyser runs for 1.5 hours each day. Find the energy consumed in 10 days in kWh.',
      steps: [
        'Convert power to kW: P = 2000 W / 1000 = 2 kW.',
        'Total operating time: t = 1.5 h × 10 = 15 h.',
        'Compute E = 2 kW × 15 h = 30 kWh.',
      ],
      answer: '30 kWh',
    },
    misconceptionWatch:
      'In H = I²Rt, never forget to square the current I, and always ensure t is in seconds when computing Joules.',
    simulatorType: 'energy',
    quickCheck: {
      question: 'If current through a fixed resistor doubles for the same duration, heat generated becomes:',
      options: ['2 times greater', '4 times greater', 'Half as much', 'Unchanged'],
      correctIndex: 1,
      explanation: 'By H = I²Rt, doubling I increases heat by 2² = 4 times.',
    },
  },
];
