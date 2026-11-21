import { Difficulty } from '../../shared/types';

export interface SeedConcept {
  slug: string;
  name: string;
  description: string;
  keyFormula: string;
  orderIndex: number;
  graphX: number;
  graphY: number;
  prerequisiteSlugs: string[];
}

export interface SeedQuestion {
  conceptSlug: string;
  difficulty: Difficulty;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  expectedReasoning: string;
  misconceptionIndicators: string[];
  isDiagnostic: boolean;
}

export const ELECTRICITY_CONCEPTS: SeedConcept[] = [
  {
    slug: 'electric-current',
    name: 'Electric Current',
    description: 'Rate of flow of electric charge through a cross-section of a conductor.',
    keyFormula: 'I = Q / t',
    orderIndex: 1,
    graphX: 110,
    graphY: 160,
    prerequisiteSlugs: [],
  },
  {
    slug: 'potential-difference',
    name: 'Potential Difference',
    description: 'Work done per unit positive charge moved between two points in a circuit.',
    keyFormula: 'V = W / Q',
    orderIndex: 2,
    graphX: 110,
    graphY: 360,
    prerequisiteSlugs: ['electric-current'],
  },
  {
    slug: 'ohms-law',
    name: "Ohm's Law",
    description: 'Proportionality between potential difference and current at constant temperature.',
    keyFormula: 'V = I × R',
    orderIndex: 3,
    graphX: 350,
    graphY: 260,
    prerequisiteSlugs: ['electric-current', 'potential-difference'],
  },
  {
    slug: 'resistance',
    name: 'Resistance & Resistivity',
    description: 'Opposition to charge flow depending on length, cross-sectional area, and material.',
    keyFormula: 'R = ρ × (L / A)',
    orderIndex: 4,
    graphX: 590,
    graphY: 120,
    prerequisiteSlugs: ['ohms-law'],
  },
  {
    slug: 'series-circuits',
    name: 'Series Circuits',
    description: 'Single-loop arrangement where current is identical and voltages divide across resistors.',
    keyFormula: 'R_eq = R₁ + R₂ + ...',
    orderIndex: 5,
    graphX: 590,
    graphY: 260,
    prerequisiteSlugs: ['ohms-law', 'resistance'],
  },
  {
    slug: 'parallel-circuits',
    name: 'Parallel Circuits',
    description: 'Branched arrangement where voltage stays equal across branches and currents divide.',
    keyFormula: '1/R_eq = 1/R₁ + 1/R₂',
    orderIndex: 6,
    graphX: 590,
    graphY: 400,
    prerequisiteSlugs: ['ohms-law', 'resistance'],
  },
  {
    slug: 'electric-power',
    name: 'Electric Power',
    description: 'Rate at which electrical energy is transferred or dissipated in a circuit.',
    keyFormula: 'P = V × I = I²R = V²/R',
    orderIndex: 7,
    graphX: 840,
    graphY: 190,
    prerequisiteSlugs: ['ohms-law', 'series-circuits', 'parallel-circuits'],
  },
  {
    slug: 'electrical-energy',
    name: 'Electrical Energy & Heating',
    description: 'Total energy consumed over time and Joule heating effects in resistive elements.',
    keyFormula: 'E = P × t = I²Rt',
    orderIndex: 8,
    graphX: 840,
    graphY: 350,
    prerequisiteSlugs: ['electric-power'],
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = [
  // 1. Electric Current
  {
    conceptSlug: 'electric-current',
    difficulty: 'easy',
    questionText: 'A charge of 24 C flows through a copper wire in 8 seconds. What is the electric current in the wire?',
    options: ['3 A', '192 A', '0.33 A', '16 A'],
    correctIndex: 0,
    explanation: 'Electric current is charge per unit time: I = Q / t = 24 C / 8 s = 3 A.',
    expectedReasoning: 'Divide total charge (24 C) by time (8 s) using I = Q / t to get 3 A.',
    misconceptionIndicators: [
      'Multiplies charge and time (Q × t) instead of dividing',
      'Confuses t/Q with Q/t',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'electric-current',
    difficulty: 'medium',
    questionText: 'If a steady current of 0.5 A flows through a lamp for 4 minutes, how much electric charge passes through the filament?',
    options: ['2 C', '120 C', '480 C', '30 C'],
    correctIndex: 1,
    explanation: 'Convert 4 minutes to seconds (4 × 60 = 240 s). Then Q = I × t = 0.5 A × 240 s = 120 C.',
    expectedReasoning: 'Convert minutes to SI seconds (240 s) before multiplying by 0.5 A using Q = I × t.',
    misconceptionIndicators: [
      'Forgets to convert minutes to seconds before calculating charge',
      'Divides time by current instead of multiplying',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'electric-current',
    difficulty: 'hard',
    questionText: 'Approximately how many electrons cross a point in a circuit in 1 second when carrying a current of 1.6 A? (e = 1.6 × 10⁻¹⁹ C)',
    options: ['10¹⁹ electrons', '10¹⁸ electrons', '6.25 × 10¹⁸ electrons', '1.6 × 10¹⁹ electrons'],
    correctIndex: 0,
    explanation: 'Total charge in 1 s is Q = 1.6 C. Number of electrons n = Q / e = 1.6 / (1.6 × 10⁻¹⁹) = 10¹⁹.',
    expectedReasoning: 'Find total charge Q = I × t = 1.6 C, then divide by elementary charge 1.6 × 10⁻¹⁹ C.',
    misconceptionIndicators: [
      'Memorizes 6.25 × 10¹⁸ for 1 A and applies it unchanged to 1.6 A',
      'Multiplies Q by e instead of dividing Q by e',
    ],
    isDiagnostic: false,
  },

  // 2. Potential Difference
  {
    conceptSlug: 'potential-difference',
    difficulty: 'easy',
    questionText: 'How much work is done in moving a charge of 3 C across two points having a potential difference of 12 V?',
    options: ['4 J', '36 J', '0.25 J', '15 J'],
    correctIndex: 1,
    explanation: 'Using V = W / Q, work W = V × Q = 12 V × 3 C = 36 J.',
    expectedReasoning: 'Rearrange V = W / Q to W = V × Q, giving 12 × 3 = 36 J.',
    misconceptionIndicators: [
      'Divides voltage by charge (V/Q) instead of multiplying',
      'Adds voltage and charge together',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'potential-difference',
    difficulty: 'medium',
    questionText: 'A voltmeter is always connected across a resistor in a circuit rather than in series. Why?',
    options: [
      'It has very low resistance and measures current',
      'It has high resistance and measures potential difference between two points',
      'Connecting in parallel increases total circuit current',
      'It stores charge like a battery',
    ],
    correctIndex: 1,
    explanation: 'A voltmeter measures the potential difference across two terminals and has very high resistance so negligible current diverts through it.',
    expectedReasoning: 'Potential difference is measured across two points in parallel, requiring high resistance so it does not short or alter the circuit current.',
    misconceptionIndicators: [
      'Confuses voltmeter properties (high resistance, parallel) with ammeter properties (low resistance, series)',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'potential-difference',
    difficulty: 'hard',
    questionText: 'If 45 J of energy is transferred when 1.5 × 10¹⁹ electrons flow between two terminals (e = 1.6 × 10⁻¹⁹ C), what is the potential difference?',
    options: ['18.75 V', '2.4 V', '10.8 V', '30 V'],
    correctIndex: 0,
    explanation: 'Total charge Q = n × e = 1.5 × 10¹⁹ × 1.6 × 10⁻¹⁹ = 2.4 C. Then V = W / Q = 45 J / 2.4 C = 18.75 V.',
    expectedReasoning: 'First convert electron count into coulombs (Q = n·e = 2.4 C), then apply V = W / Q = 45 / 2.4.',
    misconceptionIndicators: [
      'Uses electron count directly as Q without multiplying by elementary charge e',
    ],
    isDiagnostic: false,
  },

  // 3. Ohm's Law
  {
    conceptSlug: 'ohms-law',
    difficulty: 'easy',
    questionText: 'What happens to the electric current in an ohmic circuit when the resistance is doubled while the voltage remains constant?',
    options: [
      'Current doubles',
      'Current becomes half',
      'Current stays the same',
      'Current becomes four times larger',
    ],
    correctIndex: 1,
    explanation: 'By Ohm\'s Law, I = V / R. At constant V, current is inversely proportional to resistance, so doubling R halves I.',
    expectedReasoning: 'Since V is constant and I = V / R, increasing resistance reduces current proportionally by half.',
    misconceptionIndicators: [
      'Believes current and resistance are directly proportional (current increases when resistance increases)',
      'Assumes current is fixed by the battery regardless of resistance',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'ohms-law',
    difficulty: 'medium',
    questionText: 'A resistor draws 0.4 A when connected across a 12 V supply. What current will it draw if the supply voltage is reduced to 9 V at constant temperature?',
    options: ['0.3 A', '0.53 A', '0.1 A', '30 A'],
    correctIndex: 0,
    explanation: 'First find R = V / I = 12 V / 0.4 A = 30 Ω. At 9 V, I = 9 V / 30 Ω = 0.3 A.',
    expectedReasoning: 'Compute constant resistance R = 12 / 0.4 = 30 Ω, then apply I = V_new / R = 9 / 30 = 0.3 A.',
    misconceptionIndicators: [
      'Treats resistance as changing proportionally with voltage',
      'Subtracts voltage change directly from current',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'ohms-law',
    difficulty: 'hard',
    questionText: 'On a V-I graph (with V on the y-axis and I on the x-axis), Wire A has a steeper slope than Wire B. Which wire has greater resistance?',
    options: [
      'Wire B has greater resistance',
      'Wire A has greater resistance',
      'Both have equal resistance if lengths match',
      'Slope represents electric power, not resistance',
    ],
    correctIndex: 1,
    explanation: 'Since R = V / I, the slope ΔV / ΔI on a V-vs-I graph equals resistance R. A steeper slope means higher resistance.',
    expectedReasoning: 'With V on the vertical axis and I on the horizontal axis, slope = V / I = R, so Wire A has higher resistance.',
    misconceptionIndicators: [
      'Inverts slope as I/V instead of V/I',
      'Confuses steeper V-I line with higher conductance rather than higher resistance',
    ],
    isDiagnostic: false,
  },

  // 4. Resistance & Resistivity
  {
    conceptSlug: 'resistance',
    difficulty: 'easy',
    questionText: 'A uniform metal wire of resistance 8 Ω is stretched to double its original length while keeping its volume constant. Wait—first consider simply taking a wire of the SAME cross-section that is twice as long. What is its resistance?',
    options: ['4 Ω', '16 Ω', '32 Ω', '8 Ω'],
    correctIndex: 1,
    explanation: 'Since R = ρL/A, doubling length L at the same cross-sectional area A doubles resistance: 2 × 8 Ω = 16 Ω.',
    expectedReasoning: 'Resistance is directly proportional to length when material and cross-sectional area remain unchanged.',
    misconceptionIndicators: [
      'Assumes resistance decreases with longer wire',
      'Confuses simple length doubling with constant-volume stretching (4×)',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'resistance',
    difficulty: 'medium',
    questionText: 'A copper wire of resistance 4 Ω is stretched uniformly so its length doubles and its cross-sectional area becomes half. What is its new resistance?',
    options: ['8 Ω', '2 Ω', '16 Ω', '4 Ω'],
    correctIndex: 2,
    explanation: 'R_new = ρ(2L)/(A/2) = 4 × (ρL/A) = 4 × 4 Ω = 16 Ω.',
    expectedReasoning: 'Doubling length doubles R, and halving cross-sectional area doubles R again, multiplying resistance by 4.',
    misconceptionIndicators: [
      'Only accounts for length doubling (2×) and ignores area halving',
      'Assumes length increase and area decrease cancel out',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'resistance',
    difficulty: 'hard',
    questionText: 'If you cut a nichrome wire of resistivity ρ into three equal pieces, what happens to the resistivity of each piece?',
    options: [
      'Resistivity becomes ρ / 3',
      'Resistivity becomes 3ρ',
      'Resistivity remains ρ',
      'Resistivity drops to zero without a battery',
    ],
    correctIndex: 2,
    explanation: 'Resistivity ρ is an intensive material property depending only on material and temperature, not on length or shape.',
    expectedReasoning: 'Resistance changes with length, but resistivity is intrinsic to nichrome at constant temperature and remains ρ.',
    misconceptionIndicators: [
      'Confuses resistance R (depends on dimensions) with resistivity ρ (material property)',
    ],
    isDiagnostic: false,
  },

  // 5. Series Circuits
  {
    conceptSlug: 'series-circuits',
    difficulty: 'easy',
    questionText: 'Three resistors of 2 Ω, 4 Ω, and 6 Ω are connected in series to a 24 V battery. What is the current passing through the 4 Ω resistor?',
    options: ['6 A', '2 A', '12 A', '0.5 A'],
    correctIndex: 1,
    explanation: 'Total series resistance R_eq = 2 + 4 + 6 = 12 Ω. Current in a series circuit is identical everywhere: I = 24 V / 12 Ω = 2 A.',
    expectedReasoning: 'Sum the series resistances (12 Ω), find total current I = 24 / 12 = 2 A, and recognize every series component carries the same current.',
    misconceptionIndicators: [
      'Divides battery voltage directly by the single resistor (24 / 4 = 6 A)',
      'Believes current gets consumed as it passes through resistors',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'series-circuits',
    difficulty: 'medium',
    questionText: 'Two bulbs rated 10 Ω and 20 Ω are connected in series across a 15 V battery. Which bulb has the larger potential difference across it?',
    options: [
      'The 10 Ω bulb',
      'The 20 Ω bulb',
      'Both have exactly 7.5 V across them',
      'Neither has voltage drop because current is constant',
    ],
    correctIndex: 1,
    explanation: 'Current I = 15 / 30 = 0.5 A is the same in both. By V = I × R, V₁₀ = 5 V and V₂₀ = 10 V.',
    expectedReasoning: 'In series, current is shared equally so V = I·R is larger across the larger resistor (10 V vs 5 V).',
    misconceptionIndicators: [
      'Assumes voltage splits equally regardless of resistor values',
      'Believes the first resistor always gets all the voltage',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'series-circuits',
    difficulty: 'hard',
    questionText: 'If one resistor is added in series to an existing single-resistor circuit powered by an ideal constant-voltage battery, what happens to the total current from the battery?',
    options: [
      'Total current increases',
      'Total current decreases',
      'Total current remains unchanged',
      'Current increases only in the first resistor',
    ],
    correctIndex: 1,
    explanation: 'Adding a resistor in series increases R_eq = R₁ + R₂. Since I = V / R_eq and V is constant, total current decreases.',
    expectedReasoning: 'Series resistors add together, raising equivalent resistance and reducing total circuit current at constant supply voltage.',
    misconceptionIndicators: [
      'Thinks adding any resistor always creates more load so current increases',
    ],
    isDiagnostic: false,
  },

  // 6. Parallel Circuits
  {
    conceptSlug: 'parallel-circuits',
    difficulty: 'easy',
    questionText: 'Two resistors of 6 Ω and 3 Ω are connected in parallel. What is their equivalent resistance?',
    options: ['9 Ω', '4.5 Ω', '2 Ω', '0.5 Ω'],
    correctIndex: 2,
    explanation: '1 / R_eq = 1/6 + 1/3 = 3/6 = 1/2, so R_eq = 2 Ω.',
    expectedReasoning: 'Use 1/R_eq = 1/R₁ + 1/R₂ = 1/6 + 1/3 = 1/2, then take the reciprocal to get 2 Ω.',
    misconceptionIndicators: [
      'Forgets to take the reciprocal of 1/R_eq (answers 0.5 Ω)',
      'Adds parallel resistors directly like series (6 + 3 = 9 Ω)',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'parallel-circuits',
    difficulty: 'medium',
    questionText: 'Two resistors of 10 Ω and 40 Ω are connected in parallel across a 12 V battery. Which branch carries the larger current?',
    options: [
      'The 40 Ω branch carries more current',
      'The 10 Ω branch carries more current',
      'Both carry equal current because voltage is equal',
      'Both carry zero current until connected in series',
    ],
    correctIndex: 1,
    explanation: 'Both branches have 12 V across them. I₁₀ = 12/10 = 1.2 A while I₄₀ = 12/40 = 0.3 A.',
    expectedReasoning: 'Parallel branches share equal voltage (12 V), so by I = V/R the lower resistance branch (10 Ω) draws more current.',
    misconceptionIndicators: [
      'Thinks parallel branches split current equally regardless of resistance',
      'Thinks higher resistance draws more current',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'parallel-circuits',
    difficulty: 'hard',
    questionText: 'Why does adding another appliance in parallel to a household 220 V circuit increase the total current drawn from the mains?',
    options: [
      'Each parallel branch increases equivalent resistance',
      'Adding a parallel path lowers equivalent resistance while keeping voltage at 220 V',
      'The mains voltage rises automatically with each appliance',
      'Parallel appliances share current sequentially',
    ],
    correctIndex: 1,
    explanation: 'Each new parallel branch provides an additional conducting path, decreasing R_eq and increasing total I = V / R_eq.',
    expectedReasoning: 'Adding parallel branches reduces equivalent resistance (1/R_eq increases), so total current drawn at constant 220 V increases.',
    misconceptionIndicators: [
      'Believes adding more resistors always increases total circuit resistance',
    ],
    isDiagnostic: false,
  },

  // 7. Electric Power
  {
    conceptSlug: 'electric-power',
    difficulty: 'easy',
    questionText: 'An electric kettle operates at 220 V and draws a current of 5 A. What is its power rating?',
    options: ['44 W', '1100 W', '225 W', '0.023 W'],
    correctIndex: 1,
    explanation: 'Electric power P = V × I = 220 V × 5 A = 1100 W.',
    expectedReasoning: 'Multiply potential difference (220 V) by current (5 A) using P = V × I.',
    misconceptionIndicators: [
      'Divides voltage by current (computes resistance 44 Ω instead of power)',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'electric-power',
    difficulty: 'medium',
    questionText: 'A bulb is rated 100 W, 220 V. If it is operated on a 110 V supply, what power will it consume (assuming constant resistance)?',
    options: ['50 W', '25 W', '100 W', '200 W'],
    correctIndex: 1,
    explanation: 'Resistance R = V²/P = 220² / 100 = 484 Ω. At 110 V, P_new = V_new² / R = 110² / 484 = 25 W (halving V quarters P).',
    expectedReasoning: 'Since P = V² / R and R stays constant, halving the voltage reduces power by (1/2)² = 1/4, giving 25 W.',
    misconceptionIndicators: [
      'Assumes power scales linearly with voltage (answers 50 W when voltage halves)',
      'Assumes power rating is fixed at 100 W regardless of supply voltage',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'electric-power',
    difficulty: 'hard',
    questionText: 'Two bulbs rated 40 W, 220 V and 60 W, 220 V are connected in SERIES across 220 V. Which bulb glows brighter?',
    options: [
      'The 60 W bulb glows brighter because its rated wattage is higher',
      'The 40 W bulb glows brighter because it has higher resistance in series',
      'Both glow with identical brightness',
      'Neither glows in series',
    ],
    correctIndex: 1,
    explanation: 'Rated R = V²/P, so R₄₀ > R₆₀. In series, current I is identical, so P_actual = I²R is greater for the 40 W bulb.',
    expectedReasoning: 'A 40 W bulb has higher filament resistance than a 60 W bulb. Carrying the same series current, P = I²R is larger for the higher-resistance 40 W bulb.',
    misconceptionIndicators: [
      'Applies parallel reasoning (higher wattage rating = brighter) to a series circuit',
    ],
    isDiagnostic: false,
  },

  // 8. Electrical Energy & Heating
  {
    conceptSlug: 'electrical-energy',
    difficulty: 'easy',
    questionText: 'A 1500 W electric heater is used for 2 hours daily. How much electrical energy does it consume in 1 day in kWh?',
    options: ['3000 kWh', '3 kWh', '750 kWh', '1.5 kWh'],
    correctIndex: 1,
    explanation: 'Convert 1500 W to 1.5 kW. Energy E = P × t = 1.5 kW × 2 h = 3 kWh.',
    expectedReasoning: 'Convert watts to kilowatts (1.5 kW) and multiply by time in hours (2 h) to obtain 3 kWh.',
    misconceptionIndicators: [
      'Forgets to convert watts to kilowatts (answers 3000 kWh)',
      'Divides power by time instead of multiplying',
    ],
    isDiagnostic: true,
  },
  {
    conceptSlug: 'electrical-energy',
    difficulty: 'medium',
    questionText: 'According to Joule\'s law of heating (H = I²Rt), if the current through a fixed resistor is tripled for the same time, how does the heat produced change?',
    options: [
      'Heat becomes 3 times greater',
      'Heat becomes 6 times greater',
      'Heat becomes 9 times greater',
      'Heat becomes one-third',
    ],
    correctIndex: 2,
    explanation: 'Heat H is proportional to I². Tripling I increases I² by 3² = 9 times.',
    expectedReasoning: 'Because H = I²Rt, heat depends on the square of current, so tripling current multiplies heat by 9.',
    misconceptionIndicators: [
      'Assumes heat is linearly proportional to current (3× instead of 9×)',
    ],
    isDiagnostic: false,
  },
  {
    conceptSlug: 'electrical-energy',
    difficulty: 'hard',
    questionText: 'How many joules of heat are generated in a 20 Ω resistor carrying 2 A of current for 30 seconds?',
    options: ['1200 J', '2400 J', '600 J', '120 J'],
    correctIndex: 1,
    explanation: 'Using H = I²Rt = (2 A)² × 20 Ω × 30 s = 4 × 20 × 30 = 2400 J.',
    expectedReasoning: 'Square the current (2² = 4), multiply by resistance (20 Ω) and time in seconds (30 s) to get 2400 J.',
    misconceptionIndicators: [
      'Forgets to square current (uses I·R·t = 1200 J instead of I²·R·t)',
    ],
    isDiagnostic: false,
  },
];
