import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../../assets/salvioris.jpg";

export function Footer() {
  const footerLinks = {
    "Mental Health": [
      { label: "Find a Therapist", href: "/search" },
      { label: "Mental Health Resources", href: "/resources" },
      { label: "Crisis Support", href: "/crisis" },
      { label: "How It Works", href: "/how-it-works" },
    ],
    "For Therapists": [
      { label: "Join Our Network", href: "/therapist-signup" },
      { label: "Therapist Dashboard", href: "/therapist-dashboard" },
      { label: "Resources", href: "/therapist-resources" },
      { label: "Pricing", href: "/therapist-pricing" },
    ],
    "Support": [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Feedback", href: "/feedback" },
      { label: "FAQ", href: "/faq" },
      { label: "Safety Guidelines", href: "/safety" },
    ],
    "Legal": [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-[#1d2935]/80 backdrop-blur-sm border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <Image 
                  src={salviorisLogo} 
                  alt="Salvioris Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-display font-semibold text-xl text-foreground">
                Salvioris
              </span>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-md">
              Connecting you with licensed mental health professionals in a safe, 
              private, and supportive environment. Your mental health matters.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>1-800-Salvioris</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@salvioris.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Available Nationwide</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Crisis Support Banner */}
        <div className="bg-gradient-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h4 className="font-semibold text-foreground mb-1">
                Crisis Support Available 24/7
              </h4>
              <p className="text-sm text-muted-foreground">
                If you&apos;re in crisis, help is available immediately
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="tel:14416"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Call 14416
              </a>
              <a
                href="tel:108"
                className="inline-flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                Emergency: 108
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              <p>© {new Date().getFullYear()} Salvioris. All rights reserved.</p>
              <p className="mt-1">
                Licensed mental health professionals. HIPAA compliant platform.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-all hover:scale-105"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}