import React from 'react';
import './landing.css';

const Features = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Project Management',
      description: 'Create and manage projects with detailed tracking and professional dashboards.'
    },
    {
      icon: '📋',
      title: 'Task Organization',
      description: 'Hierarchical task structure with subtasks, dependencies, and custom statuses.'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Assign tasks to team members and track progress in real-time.'
    },
    {
      icon: '📊',
      title: 'Analytics & Reports',
      description: 'Get insights into project progress with comprehensive reporting tools.'
    },
    {
      icon: '🔄',
      title: 'Agile Workflows',
      description: 'Support for sprints, phases, and agile project management methodologies.'
    },
    {
      icon: '🔐',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and data protection.'
    }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-white relative">
      {/* Background decoration */}
      <div className="absolute top-[10%] left-0 w-80 h-80 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-[100px] opacity-10 z-0" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block py-2 px-5 bg-violet-100 rounded-full mb-5 text-sm font-semibold text-indigo-500">
            FEATURES
          </div>

          <h2 className="section-title text-5xl font-extrabold text-slate-800 mb-5 leading-tight">
            Everything you need to
            <span className="block text-indigo-500">manage projects</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Powerful features designed to help teams collaborate effectively and deliver projects on time.
          </p>
        </div>

        <div className="features-grid grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-9 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 cursor-pointer relative overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/15 hover:border-indigo-500 group"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg shadow-indigo-500/10">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;