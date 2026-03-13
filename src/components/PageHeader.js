import React from 'react';

const PageHeader = ({
    title,
    subtitle,
    stats = [],
    actions = null,
    icon = null,
    gradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color = 'white'
}) => {
    return (
        <div style={{
            background: gradient,
            borderRadius: '24px',
            padding: '40px',
            marginBottom: '32px',
            color: color,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
            {/* Decorative Elements */}
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)'
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '10%',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)'
            }}></div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                flexWrap: 'wrap',
                gap: '24px'
            }}>
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        {icon && (
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: '800',
                                margin: 0,
                                letterSpacing: '-0.025em',
                                lineHeight: '1.2'
                            }}>
                                {title}
                            </h1>
                            {subtitle && (
                                <p style={{
                                    fontSize: '16px',
                                    color: color === 'white' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                                    margin: '4px 0 0 0',
                                    fontWeight: '500'
                                }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {stats && stats.length > 0 && (
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            marginTop: '32px',
                            flexWrap: 'wrap'
                        }}>
                            {stats.map((stat, index) => (
                                <div key={index} style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    padding: '12px 24px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    minWidth: '120px'
                                }}>
                                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{stat.value}</div>
                                    <div style={{
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        opacity: 0.8,
                                        letterSpacing: '0.05em',
                                        fontWeight: '600'
                                    }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {actions && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
