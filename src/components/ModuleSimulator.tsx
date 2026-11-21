import { useState } from 'react';
import { LearningModuleItem } from '../../shared/types';
import { ProgressBar } from './ui/ThemePrimitives';

export function ModuleSimulator({ type }: { type: LearningModuleItem['simulatorType'] }) {
  // Shared slider state variables cleanly bounded per simulator
  const [valA, setValA] = useState<number>(() => {
    if (type === 'current') return 60;
    if (type === 'voltage') return 48;
    if (type === 'ohms') return 12;
    if (type === 'resistance') return 10;
    if (type === 'series') return 18;
    if (type === 'parallel') return 12;
    if (type === 'power') return 120;
    return 1500; // energy watts
  });

  const [valB, setValB] = useState<number>(() => {
    if (type === 'current') return 20;
    if (type === 'voltage') return 4;
    if (type === 'ohms') return 6;
    if (type === 'resistance') return 2;
    if (type === 'series') return 3;
    if (type === 'parallel') return 4;
    if (type === 'power') return 60;
    return 3; // energy hours
  });

  const [valC, setValC] = useState<number>(() => {
    if (type === 'series') return 6;
    if (type === 'parallel') return 12;
    return 10;
  });

  const [materialIdx, setMaterialIdx] = useState<number>(0);

  const wrapperCls =
    'rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/60 dark:bg-[#212640]/80 p-5 space-y-4';
  const statCardCls =
    'rounded-xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] p-3';
  const sliderCls = 'w-full accent-[#7055F7]';

  if (type === 'current') {
    const current = valA / valB;
    const electrons = (valA / 1.6e-19).toExponential(2);
    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Interactive Charge Flow Explorer (I = Q / t)
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            I = {current.toFixed(2)} A
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Charge Q</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} C</strong>
            </span>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Time t</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} s</strong>
            </span>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div className={statCardCls}>
            <span className="text-[#6E7696] dark:text-[#8892B5]">Current Rate</span>
            <p className="font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] tabular-nums mt-0.5">
              {current.toFixed(2)} C/s
            </p>
          </div>
          <div className={statCardCls}>
            <span className="text-[#6E7696] dark:text-[#8892B5]">Electrons Transferred</span>
            <p className="font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] tabular-nums mt-0.5">
              {electrons}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'voltage') {
    const voltage = valA / valB;
    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Potential Difference Calculator (V = W / Q)
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            V = {voltage.toFixed(2)} V
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Work Done W</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} J</strong>
            </span>
            <input
              type="range"
              min={6}
              max={180}
              step={6}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Charge Moved Q</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} C</strong>
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>
        <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">
          Every coulomb of charge gains{' '}
          <strong className="text-[#14172B] dark:text-[#F4F6FF]">{voltage.toFixed(2)} J</strong> of energy across
          these terminals.
        </p>
      </div>
    );
  }

  if (type === 'ohms') {
    const current = valA / valB;
    const barPct = Math.min(100, Math.round((current / 12) * 100));
    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Interactive Ohm&apos;s Law Lab (I = V / R)
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            I = {current.toFixed(2)} A
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Supply Voltage V</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} V</strong>
            </span>
            <input
              type="range"
              min={3}
              max={24}
              step={3}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Resistance R</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} Ω</strong>
            </span>
            <input
              type="range"
              min={2}
              max={24}
              step={2}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#4E5674] dark:text-[#B4BDD9] mb-1.5">
            <span>Resulting Current Flow</span>
            <span className="font-mono tabular-nums">{current.toFixed(2)} A (inverse to R)</span>
          </div>
          <ProgressBar value={barPct} max={100} tone="primary" label="Resulting current flow" />
        </div>
      </div>
    );
  }

  if (type === 'resistance') {
    const materials = [
      { name: 'Copper', rho: 1.68e-8, label: '1.68 × 10⁻⁸ Ω·m' },
      { name: 'Tungsten', rho: 5.6e-8, label: '5.60 × 10⁻⁸ Ω·m' },
      { name: 'Nichrome', rho: 1.1e-6, label: '1.10 × 10⁻⁶ Ω·m' },
    ];
    const mat = materials[materialIdx];
    const areaM2 = valB * 1e-6;
    const resistance = (mat.rho * valA) / areaM2;

    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Wire Geometry &amp; Resistivity Simulator (R = ρL / A)
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            R = {resistance.toFixed(3)} Ω
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {materials.map((m, idx) => (
            <button
              key={m.name}
              type="button"
              onClick={() => setMaterialIdx(idx)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                materialIdx === idx
                  ? 'border-[#7055F7] bg-[#7055F7] text-white'
                  : 'border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] text-[#4E5674] dark:text-[#B4BDD9] hover:bg-[#EEF1FA] dark:hover:bg-[#272D4B]'
              }`}
            >
              {m.name} ({m.label})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Wire Length L</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} m</strong>
            </span>
            <input
              type="range"
              min={2}
              max={50}
              step={2}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Cross-Section Area A</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} mm²</strong>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>
      </div>
    );
  }

  if (type === 'series') {
    const req = valB + valC;
    const current = valA / req;
    const v1 = current * valB;
    const v2 = current * valC;

    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Series Loop Divider Explorer
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            R_eq = {req} Ω · I = {current.toFixed(2)} A
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Battery V</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} V</strong>
            </span>
            <input
              type="range"
              min={6}
              max={36}
              step={3}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Resistor R₁</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} Ω</strong>
            </span>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Resistor R₂</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valC} Ω</strong>
            </span>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={valC}
              onChange={(e) => setValC(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={statCardCls}>
            <span className="text-[#6E7696] dark:text-[#8892B5]">Voltage across R₁ (I × R₁)</span>
            <p className="font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] tabular-nums mt-0.5">
              {v1.toFixed(2)} V
            </p>
          </div>
          <div className={statCardCls}>
            <span className="text-[#6E7696] dark:text-[#8892B5]">Voltage across R₂ (I × R₂)</span>
            <p className="font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] tabular-nums mt-0.5">
              {v2.toFixed(2)} V
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'parallel') {
    const req = (valB * valC) / (valB + valC);
    const i1 = valA / valB;
    const i2 = valA / valC;
    const iTotal = i1 + i2;

    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Parallel Branch Splitter Explorer
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            R_eq = {req.toFixed(2)} Ω · I_total = {iTotal.toFixed(2)} A
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Supply V</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} V</strong>
            </span>
            <input
              type="range"
              min={6}
              max={24}
              step={2}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Branch R₁</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} Ω</strong>
            </span>
            <input
              type="range"
              min={2}
              max={20}
              step={2}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Branch R₂</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valC} Ω</strong>
            </span>
            <input
              type="range"
              min={2}
              max={20}
              step={2}
              value={valC}
              onChange={(e) => setValC(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={statCardCls}>
            <span className="text-[#6E7696] dark:text-[#8892B5]">Branch 1 Current (V / R₁)</span>
            <p className="font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] tabular-nums mt-0.5">
              {i1.toFixed(2)} A
            </p>
          </div>
          <div className={statCardCls}>
            <span className="text-[#6E7696] dark:text-[#8892B5]">Branch 2 Current (V / R₂)</span>
            <p className="font-mono text-base font-semibold text-[#14172B] dark:text-[#F4F6FF] tabular-nums mt-0.5">
              {i2.toFixed(2)} A
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'power') {
    const power = (valA * valA) / valB;
    const current = valA / valB;

    return (
      <div className={wrapperCls}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
            Appliance Power Scaling Explorer (P = V² / R)
          </h4>
          <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
            P = {power.toFixed(1)} W
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Applied Voltage V</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} V</strong>
            </span>
            <input
              type="range"
              min={50}
              max={240}
              step={10}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
          <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
            <span className="flex justify-between">
              <span>Fixed Element Resistance R</span>
              <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} Ω</strong>
            </span>
            <input
              type="range"
              min={20}
              max={120}
              step={10}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className={sliderCls}
            />
          </label>
        </div>

        <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">
          Current drawn is{' '}
          <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF]">{current.toFixed(2)} A</strong>. Notice
          that doubling applied voltage quadruples output power.
        </p>
      </div>
    );
  }

  // energy simulator
  const kwhPerDay = (valA / 1000) * valB;
  const totalKwh = kwhPerDay * valC;
  const joules = totalKwh * 3.6e6;

  return (
    <div className={wrapperCls}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-display text-sm font-semibold text-[#14172B] dark:text-[#F4F6FF]">
          Commercial Energy &amp; kWh Meter
        </h4>
        <span className="font-mono text-sm font-bold text-[#7055F7] dark:text-[#A493FF] tabular-nums">
          {totalKwh.toFixed(2)} kWh
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
          <span className="flex justify-between">
            <span>Power Rating</span>
            <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valA} W</strong>
          </span>
          <input
            type="range"
            min={500}
            max={3000}
            step={250}
            value={valA}
            onChange={(e) => setValA(Number(e.target.value))}
            className={sliderCls}
          />
        </label>
        <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
          <span className="flex justify-between">
            <span>Hours / Day</span>
            <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valB} h</strong>
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={valB}
            onChange={(e) => setValB(Number(e.target.value))}
            className={sliderCls}
          />
        </label>
        <label className="block space-y-1.5 text-xs text-[#4E5674] dark:text-[#B4BDD9]">
          <span className="flex justify-between">
            <span>Days</span>
            <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF] tabular-nums">{valC} d</strong>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={valC}
            onChange={(e) => setValC(Number(e.target.value))}
            className={sliderCls}
          />
        </label>
      </div>

      <p className="text-xs text-[#4E5674] dark:text-[#B4BDD9]">
        Equivalent energy in SI Joules:{' '}
        <strong className="font-mono text-[#14172B] dark:text-[#F4F6FF]">{joules.toExponential(2)} J</strong>
      </p>
    </div>
  );
}
