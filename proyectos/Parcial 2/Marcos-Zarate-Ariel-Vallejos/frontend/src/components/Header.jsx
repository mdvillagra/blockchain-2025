import React, { useState } from 'react';
import { Wallet, Search, Menu } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
 

  return (
    <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-[hsl(240_10%_20%)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-8">Mi<span className="text-[hsl(270_60%_60%)]">Galería</span>NFT</h1>
          {/* Desktop Navigation */}
          
        </div>

        <div className="flex items-center space-x-4">

          {/* Connect Wallet Button */}
          <button className="btn btn-primary ">
            <Wallet className="mr-2 h-4 w-4" />
            Conectar Billetera
          </button>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 rounded-md border border-[hsl(240_10%_20%)] bg-[hsl(240_20%_10%)] hover:bg-[hsl(270_60%_60%)] hover:text-[hsl(0_0%_95%)]"
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menú</span>
          </button>
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="md:hidden mt-2 py-2 bg-[hsl(240_17%_14%)] border border-[hsl(240_10%_20%)] rounded-md shadow-md w-56 absolute right-4 z-10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[hsl(270_60%_60%)] hover:text-[hsl(0_0%_95%)]"
              >
                {item.name}
              </a>
            ))}
            <a href="#" className="flex items-center px-3 py-2 rounded-md text-base font-medium hover:bg-[hsl(270_60%_60%)] hover:text-[hsl(0_0%_95%)]">
              <Wallet className="mr-2 h-4 w-4" />
              Conectar Billetera
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
