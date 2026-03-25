import React from 'react';

const PageHeader = ({
    title,
    subtitle,
    stats = [],
    actions = null,
    icon = null,
    gradient = 'bg-slate-900',
    color = 'text-white'
}) => {
    return (
        <div className={`${gradient} rounded-[2.5rem] p-12 mb-12 ${color} relative overflow-hidden shadow-24 group animate-in fade-in slide-in-from-top-4 duration-700`}>
            {/* Cybernetic Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                <div className="flex-1 min-w-[300px]">
                    <div className="flex items-center gap-8 mb-4">
                        {icon && (
                            <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl relative">
                                <div className="text-indigo-400 relative z-10">
                                    {icon}
                                </div>
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-[0.25em] leading-none mb-3 drop-shadow-sm">
                                {title.replace(' ', '_')}
                            </h1>
                            {subtitle && (
                                <p className="text-[11px] font-black uppercase italic tracking-[0.3em] text-slate-400 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {stats && stats.length > 0 && (
                        <div className="flex flex-wrap gap-6 mt-12">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 hover:bg-white/10 backdrop-blur-md px-8 py-5 rounded-3xl border border-white/10 min-w-[160px] transition-all duration-500 hover:-translate-y-1 hover:shadow-24 group/stat relative overflow-hidden"
                                >
                                    <div className="text-3xl font-black tracking-tighter mb-1 font-mono text-indigo-400 group-hover:text-white transition-colors relative z-10">
                                        {stat.value}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50 italic group-hover:opacity-80 transition-opacity relative z-10">
                                        {stat.label.replace(' ', '_')}
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500/0 group-hover:bg-indigo-500 transition-all duration-500"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-6 shrink-0 lg:self-end">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
