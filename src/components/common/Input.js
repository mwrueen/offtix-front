import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  helperText,
  rows,
  options = [], // For select inputs
  multiple = false, // For select inputs
  className = '',
  inputClassName = '',
  labelClassName = '',
  variant = 'brutalist', // 'brutalist' or 'standard'
  style = {},
  inputStyle = {},
  ...props
}) => {
  const isStandard = variant === 'standard';

  const inputBaseClasses = isStandard
    ? `w-full px-4 py-2.5 border border-slate-200 bg-white rounded-lg transition-all outline-none text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' : ''} ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${inputClassName}`
    : `w-full px-8 py-4 border-4 transition-all outline-none italic font-black text-[11px] uppercase tracking-widest leading-relaxed shadow-inner
      ${error
      ? 'border-rose-100 bg-rose-50/50 text-rose-600 focus:border-rose-400 focus:ring-8 focus:ring-rose-50'
      : 'border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-100/50'
    } ${disabled
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 opacity-60'
      : 'text-slate-950'
    } rounded-[2rem] ${inputClassName}`;

  const labelClasses = isStandard
    ? `block mb-1.5 text-xs font-semibold text-slate-700 ${labelClassName}`
    : `block mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic ml-6 ${labelClassName}`;

  const errorClasses = isStandard
    ? "mt-1.5 text-xs font-medium text-rose-500"
    : "mt-3 text-[9px] font-black text-rose-500 uppercase tracking-widest italic ml-6 animate-pulse";

  const helperTextClasses = isStandard
    ? "mt-1.5 text-xs text-slate-500"
    : "mt-3 text-[9px] font-black text-slate-300 uppercase tracking-widest italic ml-6 leading-relaxed opacity-60";

  const renderInput = () => {
    const commonProps = {
      name,
      id: name,
      value,
      onChange,
      required,
      disabled,
      ...props
    };

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          placeholder={isStandard ? placeholder : placeholder?.toUpperCase()}
          rows={rows || 4}
          className={`${inputBaseClasses} ${!isStandard ? 'rounded-[3rem]' : ''} min-h-[100px]`}
        />
      );
    }

    if (type === 'select') {
      return (
        <div className="relative group">
          <select
            {...commonProps}
            multiple={multiple}
            className={`${inputBaseClasses} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} appearance-none pr-10`}
          >
            {placeholder && (
              <option value="" className={isStandard ? '' : 'bg-slate-950 text-white italic'}>
                {isStandard ? placeholder : placeholder.toUpperCase()}
              </option>
            )}
            {options.map((option) => {
              const val = typeof option === 'object' ? option.value : option;
              const lbl = typeof option === 'object' ? option.label : option;
              return (
                <option
                  key={val}
                  value={val}
                  className={isStandard ? 'text-slate-900' : 'bg-white text-slate-950 font-black italic uppercase'}
                >
                  {isStandard ? lbl : lbl?.toUpperCase()}
                </option>
              );
            })}
          </select>
          {!multiple && (
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all ${isStandard ? 'text-slate-400' : 'text-xl opacity-40 group-hover:opacity-100 group-hover:scale-110'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        {...commonProps}
        placeholder={isStandard ? placeholder : placeholder?.toUpperCase()}
        className={inputBaseClasses}
      />
    );
  };

  return (
    <div className={`${isStandard ? 'mb-5' : 'mb-10'} ${className}`}>
      {label && (
        <label htmlFor={name} className={labelClasses}>
          {label} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {renderInput()}
        {!isStandard && (
          <div className="absolute -bottom-1 -right-1 w-full h-full bg-slate-950/[0.03] rounded-[2rem] pointer-events-none -z-10 blur-sm" />
        )}
      </div>
      {error && <div className={errorClasses}>{error}</div>}
      {!error && helperText && <div className={helperTextClasses}>{helperText}</div>}
    </div>
  );
};

export default Input;
