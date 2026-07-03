import React from 'react';

const PageHeader = ({
    title,
    subtitle,
    stats = [],
    actions = null,
    icon = null,
    gradient = 'bg-white',
    color = 'text-slate-900 border-b border-slate-200 shadow-sm'
}) => {
    return (
        <div className={`${gradient} ${color} rounded-xl px-6 py-5 mb-8 relative overflow-hidden transition-all duration-300 font-sans`}>
            {/* Subtle Professional Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {icon && (
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm border border-indigo-100/50 shrink-0">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight truncate">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 shrink-0"></span>
                                <span className="truncate">{subtitle}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:flex-nowrap lg:justify-end">
                    {stats && stats.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    title={stat.value}
                                    className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-lg min-w-[90px] max-w-[200px] transition-all hover:bg-white hover:shadow-sm hover:border-indigo-100"
                                >
                                    <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                                        {stat.value}
                                    </div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {actions && (
                        <div className="flex flex-wrap items-center gap-3 shrink-0 lg:border-l lg:border-slate-200 lg:pl-6">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
