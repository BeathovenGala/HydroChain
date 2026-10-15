// src/Pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import InfoCard from "../components/InfoCard";
import FeatureCard from "../components/FeatureCard";
import StepBubble from "../components/StepBubble";
import '../../src/index.css'; // relative to the component or src


export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-white">
      <Navbar />

      {/* HERO */}
      <section id="home" className="relative pt-28 pb-16">
        <div
          className="absolute inset-0 hero-visual"
          style={{
            zIndex: 0,
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight hero-heading">
            Empowering a <span className="text-emerald-300">Sustainable Future</span>
            <br className="hidden md:block" />
            with Blockchain-Powered <span className="text-white">Green Hydrogen Credits</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-lg text-white/85">
            Transparent · Verifiable · Decentralized — the first blockchain platform to issue, verify and track green hydrogen credits across the entire lifecycle.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-cta inline-flex items-center gap-3">
              <span>Register Now</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path d="M5 12h14M13 5l6 7-6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link to="/login" className="text-white/90 hover:text-white/100 transition-colors">
              Login to Platform
            </Link>
          </div>

          <div className="mt-8 text-white/75 max-w-3xl mx-auto">
            <p>
              Ensuring transparency, trust, and sustainability in the clean energy economy — every ton of green hydrogen is tracked and verified.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-slate-50 text-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">About Our System</h2>
          <p className="mt-3 max-w-2xl mx-auto text-slate-600">
            Our blockchain-based platform revolutionizes green hydrogen verification by creating an immutable ledger of hydrogen credits.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard title="What We Do">Issue blockchain-based credits for verified green hydrogen production, creating a transparent and tamper-proof system.</InfoCard>

            <InfoCard title="Why It Matters">Ensures transparency, trust, and sustainability while preventing fraud and double-spending.</InfoCard>

            <InfoCard title="Our Impact">Accelerating the transition to clean energy by building trust and accountability in hydrogen markets.</InfoCard>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="workflow" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-3xl font-bold">How It Works</h3>
            <p className="mt-2 text-slate-500 max-w-2xl mx-auto">
              Our streamlined process ensures every green hydrogen credit is properly verified, issued, and tracked through secure blockchain technology.
            </p>
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 flex justify-center">
              <StepBubble
                step="1"
                title="Plants Request Credits"
                short="Producers submit sensor-verified production data."
                details="IoT sensor feeds stream production and metadata to the verification layer; tamper detection runs automatically to ensure data integrity."
                icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-emerald-600"><path d="M3 13h18" stroke="currentColor" strokeWidth="1.6" /></svg>}
              />
            </div>

            <div className="flex-1 flex justify-center">
              <StepBubble
                step="2"
                title="Verification & Issuance"
                short="Smart contracts validate and mint credits."
                details="Smart contracts verify provenance and mint cryptographic tokens representing verified hydrogen credits."
                icon={"✓"}
              />
            </div>

            <div className="flex-1 flex justify-center">
              <StepBubble
                step="3"
                title="Industry Purchases"
                short="Industries buy verified credits securely."
                details="Credits are listed on the market and transferred via auditable on-chain transactions."
                icon={"🏷️"}
              />
            </div>

            <div className="flex-1 flex justify-center">
              <StepBubble
                step="4"
                title="Audit & Compliance"
                short="Auditors verify transactions for compliance."
                details="Independent auditors review metadata and on-chain history to certify compliance and accuracy."
                icon={"🔍"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold">Platform Features</h3>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">Built with cutting-edge technology to ensure security, transparency, and reliability in green hydrogen credit management.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <FeatureCard title="Blockchain Security">Immutable and transparent records ensure complete trust in every transaction.</FeatureCard>
            <FeatureCard title="IoT-Based Verification">Real-time sensor data validates production authenticity.</FeatureCard>
            <FeatureCard title="Transparent Tracking">Full visibility of credit lifecycle from creation to retirement.</FeatureCard>
            <FeatureCard title="Tamper-Proof Credits">Prevent double-spending and fraud with cryptographic security.</FeatureCard>
            <FeatureCard title="Role-Based Access">Secure platform for producers, industries, and auditors.</FeatureCard>
            <FeatureCard title="Sustainability Focus">Driving the transition to a clean hydrogen economy.</FeatureCard>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h4 className="text-xl font-semibold">Contact</h4>
          <p className="text-sm text-slate-600 mt-2">support@hydrochain.com • +1 (555) 123-4567</p>
        </div>
      </section>

      {/* CTA + FOOTER */}
      <section className="py-16 bg-gradient-to-br from-emerald-700 to-teal-700 text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold">Ready to Join the Green Revolution?</h3>
          <p className="mt-2 text-white/90">Start tracking, verifying, and trading green hydrogen credits on the blockchain today.</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-cta--light">Get Started Now</Link>
            <a href="#features" className="underline text-white/90">Learn More</a>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">© 2024 HydroChain. All rights reserved.</div>
      </footer>
    </div>
  );
}
