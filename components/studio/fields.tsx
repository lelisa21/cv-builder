'use client';

import React, { useEffect, useRef, useState } from 'react';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const fill = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="range-field">
      <div className="range-head">
        <span>{label}</span>
        <span className="range-value">
          {value}
          {unit}
        </span>
      </div>
      <input
        className="studio-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ '--range-fill': `${fill}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <span className="toggle-copy">
        <span className="toggle-label">{label}</span>
        {hint && <span className="toggle-hint">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle-switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-label={label}
      >
        <span />
      </button>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="color-field">
        <input
          type="color"
          value={value}
          aria-label={`${label} colour picker`}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          value={text}
          spellCheck={false}
          aria-label={`${label} hex value`}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toLowerCase());
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </div>
  );
}

export function TagsField({
  value,
  onChange,
  placeholder = 'Design systems, Research, Figma',
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join(', '));
  const joined = value.join(', ');

  useEffect(() => {
    setText(joined);
  }, [joined]);

  const commit = (next: string) => {
    onChange(
      next
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    );
  };

  return (
    <label className="field">
      <span className="field-label">
        Tags
        <span className="field-hint">Enter or blur to apply</span>
      </span>
      <input
        className="studio-input"
        value={text}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(text);
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
    </label>
  );
}

export function LinesField({
  label = 'Bullets',
  value,
  onChange,
  placeholder = 'One achievement per line',
}: {
  label?: string;
  value: string[];
  onChange: (lines: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value.join('\n'));
  const joined = value.join('\n');
  const timer = useRef<number | null>(null);
  const lastCommitted = useRef(joined);

  useEffect(() => {
    if (joined !== lastCommitted.current) {
      lastCommitted.current = joined;
      setText(joined);
    }
  }, [joined]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const commit = (next: string) => {
    lastCommitted.current = next;
    onChange(next.split('\n'));
  };

  return (
    <label className="field">
      <span className="field-label">
        {label}
        <span className="field-hint">One per line</span>
      </span>
      <textarea
        className="studio-textarea"
        value={text}
        placeholder={placeholder}
        rows={Math.min(7, Math.max(3, text.split('\n').length + 1))}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => commit(next), 340);
        }}
        onBlur={() => {
          if (timer.current) window.clearTimeout(timer.current);
          commit(text);
        }}
      />
    </label>
  );
}
