const PhilosophySection = () => {
  const items = [
    { title: 'Our Purpose', text: 'Empowering farmers with data and tools to build productive, profitable and sustainable farms.' },
    { title: 'Our Vision', text: 'A world where every farmer, anywhere, can thrive through knowledge and technology.' },
    { title: 'Our Mission', text: 'Deliver simple, reliable and intelligent digital solutions that transform how farms are managed.' },
    { title: 'Our Promise', text: 'Your farm, your data, our technology — together for a better future.' },
  ];

  return (
    <section id="philosophy" className="py-16 px-6 bg-primary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-white mb-10">
          Our purpose, vision, mission, and promise
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-6 ${idx < 3 ? 'border-r border-white/10' : ''}`}
            >
              <h4 className="font-bold text-white mb-2">{item.title}</h4>
              <p className="text-white/90 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;
