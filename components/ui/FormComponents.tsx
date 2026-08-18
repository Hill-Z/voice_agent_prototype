import React from 'react';
import { HelpCircle, Plus, X } from 'lucide-react';

interface LabelProps {
  label: string;
  required?: boolean;
  tooltip?: string;
}

export const Label: React.FC<LabelProps> = ({ label, required, tooltip }) => (
  <div className="flex items-center mb-2">
    {required && <span className="text-[var(--color-semantic-danger)] mr-1">*</span>}
    <label className="text-sm font-semibold text-[var(--color-semantic-text-secondary)]">{label}</label>
    {tooltip && (
      <div className="group relative ml-2">
        <HelpCircle size={14} className="text-[var(--color-semantic-text-placeholder)] cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--component-tooltip-bg)] text-[var(--component-tooltip-text)] text-xs rounded-[var(--component-tooltip-radius)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[var(--component-popover-shadow)]">
          {tooltip}
        </div>
      </div>
    )}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean; tooltip?: string; suffix?: string }> = ({ label, required, tooltip, suffix, className, ...props }) => (
  <div className="mb-5">
    {label && <Label label={label} required={required} tooltip={tooltip} />}
    <div className="relative">
      <input
        className={`w-full h-[var(--component-field-height-md)] px-[var(--component-field-padding-x)] text-sm border border-[var(--color-semantic-border-default)] rounded-[var(--component-field-radius)] bg-[var(--color-semantic-bg-surface)] text-[var(--color-semantic-text-primary)] placeholder:text-[var(--color-semantic-text-placeholder)] hover:border-[var(--color-semantic-border-strong)] focus:outline-none focus:border-[var(--color-semantic-border-focus)] transition-all disabled:bg-[var(--color-semantic-bg-disabled)] disabled:text-[var(--color-semantic-text-disabled)] disabled:cursor-not-allowed ${className || ''}`}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-2.5 text-xs text-[var(--color-semantic-text-tertiary)] font-medium">{suffix}</span>
      )}
    </div>
  </div>
);

// Added tooltip to Select props to fix App.tsx error
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean; tooltip?: string; options: string[] | { label: string; value: string }[] }> = ({ label, required, tooltip, options, className, ...props }) => (
  <div className="mb-5">
    {label && <Label label={label} required={required} tooltip={tooltip} />}
    <div className="relative">
      <select
        className={`w-full h-[var(--component-select-height-md)] px-[var(--component-select-padding-x)] text-sm border border-[var(--color-semantic-border-default)] rounded-[var(--component-select-radius)] appearance-none bg-[var(--color-semantic-bg-surface)] text-[var(--color-semantic-text-primary)] hover:border-[var(--color-semantic-border-strong)] focus:outline-none focus:border-[var(--color-semantic-border-focus)] transition-all disabled:bg-[var(--color-semantic-bg-disabled)] disabled:text-[var(--color-semantic-text-disabled)] disabled:cursor-not-allowed ${className || ''}`}
        {...props}
      >
        {options.map((opt, idx) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const text = typeof opt === 'string' ? opt : opt.label;
          return <option key={idx} value={value}>{text}</option>;
        })}
      </select>
      <div className="absolute right-3 top-3 pointer-events-none">
        <svg className="w-4 h-4 text-[var(--color-semantic-text-placeholder)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);

export const Slider: React.FC<{ label: string; value: number; onChange: (val: number) => void; min: number; max: number; step?: number; tooltip?: string }> = ({ label, value, onChange, min, max, step = 1, tooltip }) => (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <Label label={label} tooltip={tooltip} />
      <span className="text-xs font-mono bg-[var(--color-semantic-bg-subtle)] px-2 py-1 rounded-[var(--radius-sm)] text-[var(--color-semantic-text-secondary)]">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-[var(--color-semantic-border-default)] rounded-full appearance-none cursor-pointer accent-[var(--color-semantic-primary)] disabled:cursor-not-allowed"
    />
    <div className="flex justify-between text-[10px] text-[var(--color-semantic-text-placeholder)] mt-1">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

export const Switch: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
  ariaLabel?: string;
  compact?: boolean;
}> = ({ label, checked, onChange, tooltip, ariaLabel, compact = false }) => (
  <div className={`${compact ? '' : 'mb-5'} flex items-center justify-between`}>
    {label && <Label label={label} tooltip={tooltip} />}
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label || undefined}
      className={`relative inline-flex h-[var(--component-switch-height-md)] w-[var(--component-switch-width-md)] items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-semantic-primary)] focus-visible:ring-offset-2 ${checked ? 'bg-[var(--color-semantic-primary)]' : 'bg-[var(--color-semantic-border-strong)]'}`}
      onClick={() => onChange(!checked)}
    >
      <span className={`inline-block h-[var(--component-switch-knob-md)] w-[var(--component-switch-knob-md)] transform rounded-full bg-white transition-transform shadow-[var(--shadow-xs)] ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

export const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-6 pb-2 border-b border-[var(--color-semantic-border-subtle)]">
    <h3 className="text-base font-bold text-[var(--color-semantic-text-primary)]">{title}</h3>
  </div>
);

// Added disabled prop to TagInput to fix App.tsx error and implemented disabled state
export const TagInput: React.FC<{ label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string; disabled?: boolean }> = ({ label, tags, onChange, placeholder, disabled }) => {
  const [input, setInput] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`mb-5 ${disabled ? 'opacity-[var(--state-disabled-opacity)]' : ''}`}>
      <Label label={label} />
      <div className={`flex flex-wrap gap-2 p-2 border border-[var(--color-semantic-border-default)] rounded-[var(--component-field-radius)] min-h-[42px] transition-colors ${disabled ? 'bg-[var(--color-semantic-bg-disabled)] cursor-not-allowed' : 'bg-[var(--color-semantic-bg-surface)] hover:border-[var(--color-semantic-border-strong)]'}`}>
        {tags.map((tag, idx) => (
          <span key={idx} className="bg-[var(--color-semantic-primary-soft)] text-[var(--color-semantic-primary-text)] px-2 py-1 rounded-[var(--component-badge-radius)] text-xs font-medium flex items-center">
            {tag}
            {!disabled && <X size={12} className="ml-1 cursor-pointer hover:text-[var(--color-semantic-primary-active)]" onClick={() => removeTag(tag)} />}
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent disabled:cursor-not-allowed"
          placeholder={tags.length === 0 ? (placeholder || "Type and press Enter") : ""}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; required?: boolean; tooltip?: string }> = ({ label, required, tooltip, className, ...props }) => (
  <div className="mb-5">
    {label && <Label label={label} required={required} tooltip={tooltip} />}
    <textarea
      className={`w-full min-h-24 px-[var(--component-field-padding-x)] py-2 text-sm border border-[var(--color-semantic-border-default)] rounded-[var(--component-field-radius)] bg-[var(--color-semantic-bg-surface)] text-[var(--color-semantic-text-primary)] placeholder:text-[var(--color-semantic-text-placeholder)] hover:border-[var(--color-semantic-border-strong)] focus:outline-none focus:border-[var(--color-semantic-border-focus)] transition-all disabled:bg-[var(--color-semantic-bg-disabled)] disabled:text-[var(--color-semantic-text-disabled)] disabled:cursor-not-allowed ${className || ''}`}
      {...props}
    />
  </div>
);
