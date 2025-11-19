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
  style = {},
  inputStyle = {},
  ...props
}) => {
  const baseInputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: disabled ? '#f8fafc' : '#ffffff',
    color: disabled ? '#94a3b8' : '#1e293b',
    cursor: disabled ? 'not-allowed' : 'text',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    ...inputStyle
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  const errorStyle = {
    marginTop: '6px',
    fontSize: '13px',
    color: '#ef4444',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  const helperTextStyle = {
    marginTop: '6px',
    fontSize: '13px',
    color: '#64748b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  const handleFocus = (e) => {
    if (!disabled && !error) {
      e.target.style.borderColor = '#3b82f6';
      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    }
  };

  const handleBlur = (e) => {
    if (!error) {
      e.target.style.borderColor = '#e2e8f0';
      e.target.style.boxShadow = 'none';
    }
  };

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
          style={baseInputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
          style={{
            ...baseInputStyle,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
        style={baseInputStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  };

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label htmlFor={name} style={labelStyle}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      {renderInput()}
      {error && <div style={errorStyle}>{error}</div>}
      {!error && helperText && <div style={helperTextStyle}>{helperText}</div>}
    </div>
  );
};

export default Input;

