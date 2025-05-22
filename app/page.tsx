"use client";

import "./global.css";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Testimonial from "@/components/Testimonial";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 z-50">
        <div className="glass-panel">
          <Header />
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="glow">
        <Hero />
      </section>

      {/* Services Section */}
      <section id="services" className="">
        <Services />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 dot-pattern">
        <Features />
      </section>

      {/* Testimonial Section */}
      <section className="">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
        <Testimonial />
      </section>

      {/* Features 2 Section */}
      {/* <section className="py-20 dot-pattern">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="highlight-box p-2">
                <h2 className="heading-lg gradient-text">
                  Unlock the Full Potential of CleanMng
                </h2>
              </div>
              <p className="text-body">
                Join us and discover a world of diverse design opportunities to
                uplift your creative projects.
              </p>
              <button className="btn-primary">
                <span className="relative z-10">Try it for free</span>
              </button>
            </div>
            <div className="glass-panel p-4 rounded-3xl glow">
              <img
                src="/placeholder.jpg"
                alt="Features"
                className="rounded-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section> */}

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <Contact />
      </section>

      {/* Footer */}
      <footer className="py-8 border-t glass-panel">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-muted-foreground">
              Developed with ❤️ by{" "}
              <a
                href="https://akryelias.me"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                akryelias.me
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Mng Clean. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
