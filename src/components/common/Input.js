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
  const inputBaseClasses = `w-full px-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-4 ${error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
    } ${disabled
      ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
      : 'bg-white text-slate-800'
    } ${inputClassName}`;

  const labelClasses = "block mb-2 text-sm font-semibold text-slate-700";
  const errorClasses = "mt-1.5 text-xs text-red-500 font-medium ml-1";
  const helperTextClasses = "mt-1.5 text-xs text-slate-400 ml-1 leading-relaxed";

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows || 4}
          className={inputBaseClasses}
          style={inputStyle}
          {...props}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          multiple={multiple}
          className={`${inputBaseClasses} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          style={inputStyle}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={typeof option === 'object' ? option.value : option}
              value={typeof option === 'object' ? option.value : option}
            >
              {typeof option === 'object' ? option.label : option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputBaseClasses}
        style={inputStyle}
        {...props}
      />
    );
  };

  return (
    <div className={`mb-5 ${className}`} style={style}>
      {label && (
        <label htmlFor={name} className={labelClasses}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {renderInput()}
      </div>
      {error && <div className={errorClasses}>{error}</div>}
      {!error && helperText && <div className={helperTextClasses}>{helperText}</div>}
    </div>
  );
};

export default Input;

