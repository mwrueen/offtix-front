import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    image: '/images/login-bg-1.jpeg',
    message: 'Streamline your event management effortlessly.'
  },
  {
    image: '/images/login-bg-2.jpeg',
    message: 'Connect with your audience in real-time.'
  },
  {
    image: '/images/login-bg-3.jpeg',
    message: 'Organize, execute, and succeed with Offtix.'
  }
];

const AuthLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background Images Slider */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-slate-900/40 z-10" /> {/* Overlay for readability */}
            <img
              src={slide.image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Left top text brand */}
        <div
          onClick={() => navigate('/')}
          className="cursor-pointer relative z-20 w-fit"
        >
          <div className="px-6 py-2 border-2 border-white/40 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all hover:scale-105 group">
            <span className="text-white text-3xl font-extrabold tracking-widest uppercase drop-shadow-lg">
              Offtix
            </span>
          </div>
        </div>

        {/* Center message */}
        <div className="relative z-20 space-y-6">
          <div className="w-10 h-1 bg-indigo-500 rounded-full" />
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 absolute ${
                index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <blockquote className="text-white text-3xl font-bold leading-tight drop-shadow-lg">
                {slide.message.split(',').map((part, i) => (
                  <React.Fragment key={i}>
                    {part}{i < slide.message.split(',').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </blockquote>
            </div>
          ))}
          <div className="h-24" /> {/* Spacer for absolute messages */}
          <p className="text-white/80 text-sm font-medium">Trusted by teams worldwide.</p>
        </div>

        {/* Bottom dots */}
        <div className="flex gap-2 relative z-20">
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                index === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo above form */}
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer flex flex-col items-center gap-3 mb-8"
          >
            <div className="w-28 h-28 flex items-center justify-center transition-transform hover:scale-110">
              <img src="/offtix-logo.png" alt="Offtix Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>

          {children}

          {/* Footer */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">Secured with end-to-end encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;


