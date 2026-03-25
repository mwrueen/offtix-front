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
        <div className={`${gradient} ${color} rounded-2xl p-8 mb-8 relative overflow-hidden transition-all duration-300 font-sans`}>
            {/* Subtle Decorative Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-6">
                        {icon && (
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-sm border border-indigo-100/50 shrink-0">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {stats && stats.length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-8">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-xl min-w-[140px] transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 group"
                                >
                                    <div className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {stat.value}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-4 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
