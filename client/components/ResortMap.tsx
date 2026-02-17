import { useState } from "react";

export default function ResortMap() {
  const [activeView, setActiveView] = useState<"birds-eye" | "location">("birds-eye");

  return (
    <div className="max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12 animate-fadeInUp">
        <h2 className="font-serif text-4xl md:text-6xl text-gray-900 mb-4">
          Resort Map
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Explore our world-class facilities and amenities
        </p>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-8 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
        <button 
          onClick={() => setActiveView("birds-eye")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-md ${
            activeView === "birds-eye" 
              ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
              : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
          </svg>
          Bird's Eye View
        </button>
        <button 
          onClick={() => setActiveView("location")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-md ${
            activeView === "location" 
              ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
              : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
          </svg>
          Location Map
        </button>
      </div>

      {/* Map Container */}
      {activeView === "birds-eye" ? (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl animate-fadeInUp group" style={{ animationDelay: '0.2s' }}>
          {/* Main Map Image */}
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&h=900&fit=crop"
            alt="Resort Bird's Eye View"
            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-1000"
          />
          
          {/* Overlay Instruction */}
          <div className="absolute top-6 right-6 bg-yellow-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
            </svg>
            <span className="text-sm font-medium">Click on areas to explore</span>
          </div>

          {/* Interactive Hotspots */}
          {/* Pool Area 1 */}
          <button className="absolute top-[35%] left-[30%] w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-lg flex items-center justify-center transform hover:scale-125 transition-all duration-300 group/hotspot animate-ping-slow">
            <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></span>
            <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg opacity-0 group-hover/hotspot:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Main Pool
            </div>
          </button>

          {/* Pool Area 2 */}
          <button className="absolute top-[45%] left-[45%] w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-lg flex items-center justify-center transform hover:scale-125 transition-all duration-300 group/hotspot animate-ping-slow">
            <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></span>
            <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg opacity-0 group-hover/hotspot:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Kids Pool
            </div>
          </button>

          {/* Cottages Area */}
          <button className="absolute top-[55%] right-[25%] w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-lg flex items-center justify-center transform hover:scale-125 transition-all duration-300 group/hotspot animate-ping-slow">
            <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></span>
            <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg opacity-0 group-hover/hotspot:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Cottages & Huts
            </div>
          </button>

          {/* Function Hall */}
          <button className="absolute top-[40%] right-[35%] w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-lg flex items-center justify-center transform hover:scale-125 transition-all duration-300 group/hotspot animate-ping-slow">
            <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></span>
            <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg opacity-0 group-hover/hotspot:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Function Hall
            </div>
          </button>

          {/* Rooms Building */}
          <button className="absolute bottom-[35%] left-[20%] w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-lg flex items-center justify-center transform hover:scale-125 transition-all duration-300 group/hotspot animate-ping-slow">
            <span className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></span>
            <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
            </svg>
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg opacity-0 group-hover/hotspot:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Accommodations
            </div>
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          {/* Google Maps Embed */}
          <div className="aspect-video w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3868.5!2d121.48133797994244!3d12.752912427669274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDQ1JzEwLjUiTiAxMjHCsDI4JzUyLjgiRQ!5e0!3m2!1sen!2sph!4v1706320000000!5m2!1sen!2sph"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            ></iframe>
          </div>
          
          {/* Location Info Card */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-xl text-gray-900 font-semibold mb-2">
                  Prisville Triangle Resort
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  BBII Bongabong<br />
                  Oriental Mindoro, Philippines
                </p>
                <a 
                  href="https://maps.app.goo.gl/WxqoxRNYJY6EvqFcA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium text-sm transition"
                >
                  Get Directions
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
