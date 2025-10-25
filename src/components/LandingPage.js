import React from 'react';
import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import Footer from './landing/Footer';

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
};

export default LandingPage;