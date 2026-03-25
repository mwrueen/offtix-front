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
  style = {},
  inputStyle = {},
  ...props
}) => {
  const inputBaseClasses = `w-full px-8 py-4 border-4 transition-all outline-none italic font-black text-[11px] uppercase tracking-widest leading-relaxed shadow-inner
      ${error
      ? 'border-rose-100 bg-rose-50/50 text-rose-600 focus:border-rose-400 focus:ring-8 focus:ring-rose-50'
      : 'border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-100/50'
    } ${disabled
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200 opacity-60'
      : 'text-slate-950'
    } rounded-[2rem] ${inputClassName}`;

  const labelClasses = "block mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic ml-6";
  const errorClasses = "mt-3 text-[9px] font-black text-rose-500 uppercase tracking-widest italic ml-6 animate-pulse";
  const helperTextClasses = "mt-3 text-[9px] font-black text-slate-300 uppercase tracking-widest italic ml-6 leading-relaxed opacity-60";

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder?.toUpperCase()}
          required={required}
          disabled={disabled}
          rows={rows || 4}
          className={`${inputBaseClasses} rounded-[3rem] min-h-[120px]`}
          style={inputStyle}
          {...props}
        />
      );
    }

    if (type === 'select') {
      return (
        <div className="relative group">
          <select
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            multiple={multiple}
            className={`${inputBaseClasses} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} appearance-none pr-16`}
            style={inputStyle}
            {...props}
          >
            {placeholder && <option value="" className="bg-slate-950 text-white italic">{placeholder.toUpperCase()}</option>}
            {options.map((option) => (
              <option
                key={typeof option === 'object' ? option.value : option}
                value={typeof option === 'object' ? option.value : option}
                className="bg-white text-slate-950 font-black italic uppercase"
              >
                {typeof option === 'object' ? option.label?.toUpperCase() : option.toUpperCase()}
              </option>
            ))}
          </select>
          {!multiple && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-xl opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">▼</div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder?.toUpperCase()}
        required={required}
        disabled={disabled}
        className={inputBaseClasses}
        style={inputStyle}
        {...props}
      />
    );
  };

  return (
    <div className={`mb-10 ${className}`} style={style}>
      {label && (
        <label htmlFor={name} className={labelClasses}>
          {label} {required && <span className="text-rose-500 ml-2 animate-pulse">*</span>}
        </label>
      )}
      <div className="relative">
        {renderInput()}
        <div className="absolute -bottom-1 -right-1 w-full h-full bg-slate-950/[0.03] rounded-[2rem] pointer-events-none -z-10 blur-sm" />
      </div>
      {error && <div className={errorClasses}> <span className="mr-2">⚠️</span> {error.toUpperCase()} </div>}
      {!error && helperText && <div className={helperTextClasses}> <span className="mr-2">ℹ️</span> {helperText.toUpperCase()} </div>}
    </div>
  );
};

export default Input;
