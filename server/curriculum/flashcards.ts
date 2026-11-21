import { FlashcardCategory } from '../../shared/types';

export interface SeedFlashcard {
  id: string;
  conceptSlug: string;
  category: FlashcardCategory;
  frontPrompt: string;
  backAnswer: string;
  formulaHint: string;
  examTip: string;
}

export const ELECTRICITY_FLASHCARDS: SeedFlashcard[] = [
  // 1. Electric Current
  {
    id: 'fc-current-1',
    conceptSlug: 'electric-current',
    category: 'Formula',
    frontPrompt: 'How is electric current defined mathematically, and what is 1 Ampere?',
    backAnswer: 'I = Q / t. One Ampere equals 1 Coulomb of electric charge flowing across a conductor cross-section per 1 second (1 A = 1 C/s).',
    formulaHint: 'I = Q / t',
    examTip: 'Always convert time from minutes or hours into seconds before computing Q = I × t.',
  },
  {
    id: 'fc-current-2',
    conceptSlug: 'electric-current',
    category: 'SI Units',
    frontPrompt: 'How many electrons carry a total charge of 1 Coulomb (given e = 1.6 × 10⁻¹⁹ C)?',
    backAnswer: '6.25 × 10¹⁸ electrons (from n = Q / e = 1 / 1.6 × 10⁻¹⁹).',
    formulaHint: 'Q = n × e',
    examTip: 'Do not apply 6.25 × 10¹⁸ blindly if current is not 1 A—always multiply I × t first to find Q.',
  },
  {
    id: 'fc-current-3',
    conceptSlug: 'electric-current',
    category: 'Circuit Rule',
    frontPrompt: 'How is an ammeter connected in a circuit, and should its internal resistance be high or low?',
    backAnswer: 'An ammeter is always connected in SERIES with the component and has very LOW resistance so it does not reduce the circuit current.',
    formulaHint: 'Series connection · Near-zero resistance',
    examTip: 'Connecting an ammeter in parallel creates a near short-circuit and damages the meter.',
  },

  // 2. Potential Difference
  {
    id: 'fc-voltage-1',
    conceptSlug: 'potential-difference',
    category: 'Formula',
    frontPrompt: 'State the formula for potential difference between two points and define 1 Volt.',
    backAnswer: 'V = W / Q. One Volt is the potential difference when 1 Joule of work is done to move 1 Coulomb of positive charge between two points (1 V = 1 J/C).',
    formulaHint: 'V = W / Q',
    examTip: 'Rearrange carefully: Work W = V × Q, never V / Q.',
  },
  {
    id: 'fc-voltage-2',
    conceptSlug: 'potential-difference',
    category: 'Circuit Rule',
    frontPrompt: 'Why is a voltmeter connected in parallel across a resistor with very high resistance?',
    backAnswer: 'It measures the energy drop between two terminals; high internal resistance prevents it from drawing significant current away from the resistor.',
    formulaHint: 'Parallel connection · Very high resistance',
    examTip: 'Board exams often contrast ammeter (series, low R) vs voltmeter (parallel, high R).',
  },
  {
    id: 'fc-voltage-3',
    conceptSlug: 'potential-difference',
    category: 'Exam Trap',
    frontPrompt: 'If 2.5 × 10¹⁹ electrons transfer 40 J of energy, what step must come BEFORE applying V = W / Q?',
    backAnswer: 'Convert the electron count into Coulombs using Q = n × e = (2.5 × 10¹⁹)(1.6 × 10⁻¹⁹) = 4 C, then compute V = 40 / 4 = 10 V.',
    formulaHint: 'Q = n·e → V = W / Q',
    examTip: 'Never substitute electron count directly for Q in Coulombs.',
  },

  // 3. Ohm's Law
  {
    id: 'fc-ohms-1',
    conceptSlug: 'ohms-law',
    category: 'Law',
    frontPrompt: "State Ohm's Law and identify the physical condition required for it to hold true.",
    backAnswer: 'At constant temperature, the current flowing through a metallic conductor is directly proportional to the potential difference across its ends: V = I × R.',
    formulaHint: 'V = I × R (constant T)',
    examTip: 'Mention "at constant temperature" in 1-mark and 2-mark definitions to earn full credit.',
  },
  {
    id: 'fc-ohms-2',
    conceptSlug: 'ohms-law',
    category: 'Exam Trap',
    frontPrompt: 'When supply voltage V stays fixed and circuit resistance R doubles, what happens to current I?',
    backAnswer: 'Current becomes HALF (I = V / R). Resistance opposes flow—it is inversely proportional to current at constant voltage.',
    formulaHint: 'I ∝ 1 / R (at fixed V)',
    examTip: 'Watch out for the misconception that higher resistance means higher current.',
  },
  {
    id: 'fc-ohms-3',
    conceptSlug: 'ohms-law',
    category: 'Circuit Rule',
    frontPrompt: 'What does the slope of a V-vs-I graph (V on y-axis, I on x-axis) represent?',
    backAnswer: 'Resistance R = ΔV / ΔI. A steeper V-I line indicates higher resistance. (If I is on the y-axis, slope equals 1/R).',
    formulaHint: 'Slope (V/I) = R',
    examTip: 'Always check which variable is plotted on the y-axis before comparing slopes!',
  },

  // 4. Resistance & Resistivity
  {
    id: 'fc-resistance-1',
    conceptSlug: 'resistance',
    category: 'Formula',
    frontPrompt: 'Which geometric and material factors determine the electrical resistance of a wire?',
    backAnswer: 'R = ρ × (L / A): directly proportional to length L, inversely proportional to cross-sectional area A, and dependent on material resistivity ρ.',
    formulaHint: 'R = ρ(L / A)',
    examTip: 'If wire diameter doubles, area A = πr² becomes 4× larger, so resistance drops to 1/4.',
  },
  {
    id: 'fc-resistance-2',
    conceptSlug: 'resistance',
    category: 'Exam Trap',
    frontPrompt: 'A wire of resistance R is stretched to 3× its original length at constant volume. What is its new resistance?',
    backAnswer: '9R. Stretching to 3L reduces cross-sectional area to A/3 to preserve volume, so R_new = ρ(3L)/(A/3) = 9R.',
    formulaHint: 'R_new = n² × R_old (stretched by n)',
    examTip: 'Uniform stretching scales resistance by n², not n!',
  },
  {
    id: 'fc-resistance-3',
    conceptSlug: 'resistance',
    category: 'SI Units',
    frontPrompt: 'What is the SI unit of resistivity (ρ), and does cutting a wire in half change its resistivity?',
    backAnswer: 'Ohm-meter (Ω·m). Cutting a wire changes R, NEVER ρ—resistivity is an intrinsic property of the material and temperature.',
    formulaHint: 'ρ in Ω·m (material property)',
    examTip: 'Alloys like Nichrome have higher resistivity than pure metals and do not oxidize easily when hot.',
  },

  // 5. Series Circuits
  {
    id: 'fc-series-1',
    conceptSlug: 'series-circuits',
    category: 'Circuit Rule',
    frontPrompt: 'In a series resistor loop, which quantity stays identical across every resistor and which quantity splits?',
    backAnswer: 'Electric CURRENT (I) is identical at every point in the loop; POTENTIAL DIFFERENCE (V) splits across resistors in proportion to R.',
    formulaHint: 'I_total = I₁ = I₂ · V_total = V₁ + V₂',
    examTip: 'Current is never "used up" by the first resistor in a series chain.',
  },
  {
    id: 'fc-series-2',
    conceptSlug: 'series-circuits',
    category: 'Formula',
    frontPrompt: 'How do you find equivalent resistance and an individual resistor voltage drop in series?',
    backAnswer: 'Sum all resistances R_eq = R₁ + R₂ + ..., compute loop current I = V_battery / R_eq, then find V_k = I × R_k.',
    formulaHint: 'R_eq = R₁ + R₂ + ...',
    examTip: 'In series, the largest resistor always gets the largest share of the supply voltage.',
  },
  {
    id: 'fc-series-3',
    conceptSlug: 'series-circuits',
    category: 'Exam Trap',
    frontPrompt: 'Why are household appliances NEVER wired in series?',
    backAnswer: '1) One faulty appliance breaks the entire loop; 2) Total resistance rises so current drops; 3) Appliances cannot get full rated 220 V or independent switches.',
    formulaHint: 'Single failure breaks all loads',
    examTip: 'Keep all 3 reasons ready for 3-mark reasoning questions.',
  },

  // 6. Parallel Circuits
  {
    id: 'fc-parallel-1',
    conceptSlug: 'parallel-circuits',
    category: 'Formula',
    frontPrompt: 'Write the equivalent resistance formula for two resistors R₁ and R₂ in parallel.',
    backAnswer: '1/R_eq = 1/R₁ + 1/R₂, or R_eq = (R₁ × R₂) / (R₁ + R₂). R_eq is always smaller than the smallest individual branch.',
    formulaHint: 'R_eq = (R₁R₂)/(R₁ + R₂)',
    examTip: 'Never forget the final reciprocal flip after adding 1/R₁ + 1/R₂!',
  },
  {
    id: 'fc-parallel-2',
    conceptSlug: 'parallel-circuits',
    category: 'Circuit Rule',
    frontPrompt: 'When resistors of 5 Ω and 20 Ω are wired in parallel across 10 V, which branch carries more current?',
    backAnswer: 'The 5 Ω branch carries more current (10/5 = 2 A vs 10/20 = 0.5 A). Both share the same 10 V, so smaller R draws larger I.',
    formulaHint: 'V₁ = V₂ = V · I_k = V / R_k',
    examTip: 'Adding more parallel appliances lowers equivalent resistance and increases total mains current.',
  },
  {
    id: 'fc-parallel-3',
    conceptSlug: 'parallel-circuits',
    category: 'SI Units',
    frontPrompt: 'Quick shortcut: what is the equivalent resistance of n identical resistors of value R connected in parallel?',
    backAnswer: 'R_eq = R / n. (For example, four 20 Ω resistors in parallel yield 20 / 4 = 5 Ω.)',
    formulaHint: 'R_parallel(n identical) = R / n',
    examTip: 'Great speed trick for timed MCQs and Mock Exams!',
  },

  // 7. Electric Power
  {
    id: 'fc-power-1',
    conceptSlug: 'electric-power',
    category: 'Formula',
    frontPrompt: 'List the three equivalent formulas for electric power and state when to use I²R vs V²/R.',
    backAnswer: 'P = V·I = I²R = V²/R. Use P = I²R when current is identical (series) and P = V²/R when voltage is identical (parallel or fixed supply).',
    formulaHint: 'P = VI = I²R = V²/R',
    examTip: 'A 100 W, 220 V bulb has filament resistance R = 220² / 100 = 484 Ω.',
  },
  {
    id: 'fc-power-2',
    conceptSlug: 'electric-power',
    category: 'Exam Trap',
    frontPrompt: 'If a 100 W, 220 V bulb is run at half voltage (110 V), how much power does it consume?',
    backAnswer: '25 W (one-fourth, not half!). Since P = V² / R, halving V quarters the power: (1/2)² × 100 W = 25 W.',
    formulaHint: 'P ∝ V² (constant R)',
    examTip: 'One of the most frequently tested Class 10 board numerical traps.',
  },
  {
    id: 'fc-power-3',
    conceptSlug: 'electric-power',
    category: 'Exam Trap',
    frontPrompt: 'A 40 W bulb and a 60 W bulb (both rated 220 V) are wired in SERIES across 220 V. Which glows brighter?',
    backAnswer: 'The 40 W bulb glows brighter! Lower wattage rating means higher filament resistance (R = V²/P), and in series P = I²R gives more heat/light to higher R.',
    formulaHint: 'Series brightness: higher R glows brighter',
    examTip: 'In parallel, the 60 W bulb glows brighter; in series, brightness order reverses.',
  },

  // 8. Electrical Energy & Heating
  {
    id: 'fc-energy-1',
    conceptSlug: 'electrical-energy',
    category: 'Law',
    frontPrompt: "State Joule's Law of Heating and list the three quantities heat H depends on.",
    backAnswer: 'H = I²Rt. Heat produced in a resistor is directly proportional to the square of current (I²), resistance (R), and time (t in seconds).',
    formulaHint: 'H = I²Rt (in Joules)',
    examTip: 'If current triples at constant R and t, heat increases 3² = 9 times!',
  },
  {
    id: 'fc-energy-2',
    conceptSlug: 'electrical-energy',
    category: 'SI Units',
    frontPrompt: 'Convert 1 kilowatt-hour (1 kWh / 1 commercial unit) into Joules.',
    backAnswer: '1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ Joules.',
    formulaHint: '1 kWh = 3.6 × 10⁶ J',
    examTip: 'For electricity bill numericals: convert Watts → kW (÷1000) and multiply by hours.',
  },
  {
    id: 'fc-energy-3',
    conceptSlug: 'electrical-energy',
    category: 'Circuit Rule',
    frontPrompt: 'Why is a fuse wire made of an alloy with low melting point and connected in series on the live wire?',
    backAnswer: 'If excessive current flows, Joule heating (I²Rt) melts the low-melting-point fuse wire first, breaking the series circuit before appliances catch fire.',
    formulaHint: 'Series · Live wire · Low melting point',
    examTip: 'Contrast with bulb filaments (Tungsten: very high melting point ~3380 °C) and heater coils (Nichrome: high ρ, resists oxidation).',
  },
];
