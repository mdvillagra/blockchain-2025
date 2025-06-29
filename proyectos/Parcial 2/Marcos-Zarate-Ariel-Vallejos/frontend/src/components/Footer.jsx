import React from 'react'

function Footer() {
  return (
    <footer className=" border-t border-[hsl(240_10%_20%)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold mb-2">Mi<span className="text-[hsl(270_60%_60%)]">Galería</span>NFT</h2>
              <p className="text-sm text-[hsl(240_5%_65%)]">Colección exclusiva de NFT</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Galería</h3>
                <ul className="space-y-1">
                  <li><a href="#" className="text-sm text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]">Explorar</a></li>
                  <li><a href="#" className="text-sm text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]">Colecciones</a></li>
                  <li><a href="#" className="text-sm text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]">Sobre mí</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Links</h3>
                <ul className="space-y-1">
                  <li><a href="#" className="text-sm text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]">Ayuda</a></li>
                  <li><a href="#" className="text-sm text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]">FAQ</a></li>
                  <li><a href="#" className="text-sm text-[hsl(240_5%_65%)] hover:text-[hsl(0_0%_95%)]">Contacto</a></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h3 className="font-semibold mb-2">Suscríbete</h3>
                <p className="text-sm text-[hsl(240_5%_65%)] mb-2">Recibe mis últimas creaciones</p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Tu email" 
                    className="bg-[hsl(240_10%_20%)] rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(270_75%_85%)]"
                  />
                  <button className="bg-[hsl(270_60%_60%)] text-[hsl(0_0%_95%)] rounded-r-md px-3 text-sm">
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
         
        </div>
      </footer>
  )
}

export default Footer
