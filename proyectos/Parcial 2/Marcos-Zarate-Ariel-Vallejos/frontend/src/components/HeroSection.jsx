const HeroSection = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      
      <div  className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Arte digital único creado para coleccionistas
            </h1>
            <p className="text-lg text-[hsl(240_5%_65%)] mb-8">
              Descubre mi colección exclusiva de NFTs. Piezas únicas con certificado de autenticidad en blockchain.
            </p>
            
            
          </div>
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden border-4 border-[hsl(270_60%_60%)/0.5] shadow-xl shadow-[hsl(270_60%_60%)/0.2]">
              <img 
                src="https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=800&auto=format&fit=crop"
                alt="NFT Featured" 
                className="w-full h-full object-cover"
              />
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
