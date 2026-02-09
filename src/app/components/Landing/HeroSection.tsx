import Link from "next/link";
import { Button } from "../ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden m-0 p-0 w-full">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/hero-landscape.jpg')`,
          backgroundColor: '#1d2935'
        }}
      >
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-muted/20"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
          You&apos;re Not Alone.{" "}
          <span className="text-gradient-primary drop-shadow-none [text-shadow:none]">
            Talk, Heal, Grow.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg [text-shadow:_1px_1px_2px_rgb(0_0_0_/_60%)]">
          Begin your journey with compassionate therapists and your own safe space to express.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/vent">
            <Button variant="hero" className="w-full sm:w-auto">
              Vent Your Heart Out
            </Button>
          </Link>
          {/* <Link href="/signup">
            <Button variant="hero" className="w-full sm:w-auto">
              Get Started
            </Button>
          </Link> */}
          <Link href="/therapist-signup">
            <Button variant="hero-outline" className="w-full sm:w-auto">
              Join as a Therapist
            </Button>
          </Link>
        </div>
        
      </div>
    </section>
  );
};

export default HeroSection;