import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white py-15 px-6 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                T
              </div>
              <span className="text-2xl font-bold">
                Offtix
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Professional project management made simple. Streamline your workflow and deliver projects on time.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4">
              Product
            </h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-2">
                <a href="#" className="text-slate-400 no-underline hover:text-white transition-colors">Features</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-slate-400 no-underline hover:text-white transition-colors">Pricing</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-slate-400 no-underline hover:text-white transition-colors">Integrations</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4">
              Company
            </h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-2">
                <a href="#" className="text-slate-400 no-underline hover:text-white transition-colors">About</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-slate-400 no-underline hover:text-white transition-colors">Contact</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-slate-400 no-underline hover:text-white transition-colors">Privacy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-600 pt-8 text-center text-slate-400">
          <p className="m-0">
            © 2024 Offtix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;