import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      {/* Background Decorations */}
      <div className="absolute top-[10%] left-[10%] w-25 h-25 bg-indigo-500 rounded-full opacity-10" />

      <div className="absolute bottom-[15%] right-[15%] w-20 h-20 bg-emerald-500 rounded-xl opacity-10 rotate-45" />

      <div className="bg-white rounded-2xl shadow-2xl p-12 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 mb-6 cursor-pointer"
          >
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <span className="text-2xl font-bold text-slate-800">
              Offtix
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {title}
          </h1>

          <p className="text-slate-500 text-base">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;