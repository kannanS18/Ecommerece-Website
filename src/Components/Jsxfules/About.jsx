import React, { useRef, useEffect, useState } from "react";
import "../Cssfiles/About.css";

export default function About() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [animatedNumbers, setAnimatedNumbers] = useState({ years: 0, customers: 0, items: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef(null);

  const targetNumbers = { years: 38, customers: 50000, items: 200 };

  const animateNumber = (start, end, duration, key) => {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      
      setAnimatedNumbers(prev => ({ ...prev, [key]: current }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      if (statsRef.current && !hasAnimated) {
        const rect = statsRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
          setHasAnimated(true);
          animateNumber(0, targetNumbers.years, 2000, 'years');
          animateNumber(0, targetNumbers.customers, 2500, 'customers');
          animateNumber(0, targetNumbers.items, 1800, 'items');
        }
      }
    };
    
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasAnimated]);

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-floating">🥐</div>
        <div className="about-floating">🍞</div>
        <div className="about-floating">🎂</div>
        <div className="about-hero-content">
          <h1>Doughy Delights</h1>
          <p>Where Every Bite Tells a Story</p>
          <div className="about-donut">🍩</div>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story">
        <h2>Our Sweet Beginning</h2>
        <p>Founded in 1985 by Maria Goldstein, Golden Crust Bakery began as a small family dream in the heart of the city. What started with a single oven and endless passion has grown into a beloved destination for artisanal baked goods.</p>
        <div className="about-stats" ref={statsRef}>
          <div className="about-stat">
            <span className="about-stat-number">{animatedNumbers.years}</span>
            <span className="about-stat-label">Years of Excellence</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">{animatedNumbers.customers > 1000 ? `${Math.floor(animatedNumbers.customers/1000)}K+` : animatedNumbers.customers}</span>
            <span className="about-stat-label">Happy Customers</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">{animatedNumbers.items}+</span>
            <span className="about-stat-label">Daily Fresh Items</span>
          </div>
        </div>
      </section>

      {/* Modern Bakery Section */}
      <section className="about-bakery">
        <div className="about-bakery-container">
          <div className="about-bakery-visual">
            <div className="about-kitchen-scene">
              <div className="about-oven-modern">
                <div className="about-oven-door">
                  <div className="about-steam"></div>
                  <div className="about-steam"></div>
                  <div className="about-steam"></div>
                </div>
                <div className="about-oven-handle"></div>
              </div>
              <div className="about-ingredient-modern about-flour"></div>
              <div className="about-ingredient-modern about-eggs"></div>
              <div className="about-ingredient-modern about-butter"></div>
            </div>
          </div>
          <div className="about-bakery-content">
            <h2>Crafted with Love</h2>
            <p>Every morning at 4 AM, our master bakers begin the ancient ritual of transforming simple ingredients into extraordinary experiences. Using traditional techniques passed down through generations, we create magic in our ovens.</p>
            <div className="about-process-steps">
              <div className="about-step">
                <div className="about-step-number">1</div>
                <h4>Mix</h4>
                <p>Premium ingredients combined with precision</p>
              </div>
              <div className="about-step">
                <div className="about-step-number">2</div>
                <h4>Bake</h4>
                <p>Slow-baked to golden perfection</p>
              </div>
              <div className="about-step">
                <div className="about-step-number">3</div>
                <h4>Serve</h4>
                <p>Fresh from oven to your table</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <h2>Our Core Values</h2>
        <div className="about-values-grid">
          <div className="about-value-card">
            <div className="about-value-icon">🌱</div>
            <h3>Sustainability</h3>
            <p>We source locally and use eco-friendly packaging to protect our planet.</p>
          </div>
          <div className="about-value-card">
            <div className="about-value-icon">👨‍🍳</div>
            <h3>Craftsmanship</h3>
            <p>Every item is handcrafted by skilled artisans who take pride in their work.</p>
          </div>
          <div className="about-value-card">
            <div className="about-value-icon">❤️</div>
            <h3>Community</h3>
            <p>We're more than a bakery - we're a gathering place for our neighborhood.</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <h2>Meet Our Bakers</h2>
        <div className="about-team-grid">
          <div className="about-team-member">
            <div className="about-member-avatar">👩‍🍳</div>
            <h3>Maria Goldstein</h3>
            <p>Founder & Head Baker</p>
          </div>
          <div className="about-team-member">
            <div className="about-member-avatar">👨‍🍳</div>
            <h3>Chef Antoine</h3>
            <p>Pastry Specialist</p>
          </div>
          <div className="about-team-member">
            <div className="about-member-avatar">👩‍🍳</div>
            <h3>Sarah Chen</h3>
            <p>Cake Designer</p>
          </div>
        </div>
      </section>
    </div>
  );
}