import React from 'react';

const Features = () => {
  const features = [
    {
      icon: '📐',
      title: 'Architectural Tracking',
      description: 'Engage with hierarchical project structures designed for scale and visibility.'
    },
    {
      icon: '📡',
      title: 'Real-time Node Sync',
      description: 'Experience sub-millisecond data synchronization across your entire workforce.'
    },
    {
      icon: '🛡️',
      title: 'Protocol Security',
      description: 'Enterprise-grade encryption and role-based access for mission-critical data.'
    },
    {
      icon: '📊',
      title: 'Velocity Analytics',
      description: 'Advanced metrics to analyze team output and operational efficiency.'
    },
    {
      icon: '🎯',
      title: 'Mission Alignment',
      description: 'Ensure every single task contributes to the primary organizational objective.'
    },
    {
      icon: '⚙️',
      title: 'Workflow Automation',
      description: 'Automate repetitive protocols to maximize your team engineering potential.'
    }
  ];

  return (
    <section id="features" className="py-32 px-10 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-16">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-6">Capabilities Matrix</span>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-950 tracking-tighter leading-none">
              Everything you need <br /> to <span className="text-indigo-600">scale.</span>
            </h2>
          </div>
          <p className="text-lg text-slate-400 font-medium max-w-sm border-l-4 border-indigo-600 pl-6">
            Engineered to handle high-velocity projects with zero compromise on precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-10 bg-white border border-slate-200 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 group cursor-pointer"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                {feature.icon}
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Learn More</span>
                <span className="text-lg text-indigo-600">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;