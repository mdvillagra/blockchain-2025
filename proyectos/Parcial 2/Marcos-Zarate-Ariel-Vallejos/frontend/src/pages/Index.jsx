import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import NFTContainer from '../components/NFTContainer';

const Index = () => {
   

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <NFTContainer />

      </main>
      <Footer />

    
    </div>
  );
};

export default Index;
