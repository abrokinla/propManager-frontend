'use client';

import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import StatsSection from '../components/landing/StatsSection';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import HowItWorks from '../components/landing/HowItWorks';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />
      <Hero />
      <StatsSection />
      <FeaturesGrid />
      <HowItWorks />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
