import { motion } from 'framer-motion';
import { Shield, Users, Clock, Award, MapPin, Bike, Zap, Heart } from 'lucide-react';
import aboutHero from '@/assets/about-hero.jpg';

const stats = [
  { value: '10,000+', label: 'Happy Riders' },
  { value: '500+', label: 'Vehicles' },
  { value: '25+', label: 'Cities' },
  { value: '4.8★', label: 'Avg Rating' },
];

const values = [
  { icon: Shield, title: 'Safety First', description: 'Every vehicle undergoes rigorous safety checks before each rental. Your safety is our top priority.' },
  { icon: Clock, title: 'Instant Booking', description: 'Book a bike or scooter in under 2 minutes. No paperwork, no queues — just ride.' },
  { icon: Heart, title: 'Customer Obsessed', description: 'We go the extra mile for our riders. 24/7 support, roadside assistance, and hassle-free returns.' },
  { icon: Award, title: 'Premium Fleet', description: 'From sport bikes to electric scooters, our fleet is well-maintained and regularly upgraded.' },
];

const team = [
  { name: 'Arjun Mehta', role: 'Founder & CEO', emoji: '👨‍💼' },
  { name: 'Priya Kapoor', role: 'Head of Operations', emoji: '👩‍💻' },
  { name: 'Rohan Verma', role: 'Fleet Manager', emoji: '🧑‍🔧' },
  { name: 'Sneha Gupta', role: 'Customer Success', emoji: '👩‍🎓' },
];

const About = () => {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img src={aboutHero} alt="MotoRentix Store" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 lg:px-8 pb-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider">About Us</span>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-background mt-2">
                Redefining Urban<br />Mobility
              </h1>
              <p className="text-background/70 mt-4 max-w-xl text-lg">
                MotoRentix was born from a simple idea — everyone deserves the freedom to ride, without the burden of ownership.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-primary-foreground/70 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Story</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">Built by Riders, for Riders</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 md:p-12 space-y-6 text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bike className="text-primary" size={24} />
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Zap className="text-accent" size={24} />
              </div>
            </div>
            <p>
              Founded in 2023, MotoRentix started as a small fleet of 10 bikes in Bangalore. What began as a weekend passion project by a group of motorcycle enthusiasts quickly grew into India's fastest-growing two-wheeler rental platform.
            </p>
            <p>
              We noticed a gap — owning a bike in a city is expensive and impractical, but the joy of riding shouldn't be limited to those who own one. Whether it's a daily commute, a weekend getaway, or just the thrill of riding a sports bike, MotoRentix makes it possible.
            </p>
            <p>
              Today, we operate in over 25 cities with a diverse fleet of 500+ vehicles — from powerful sports bikes to eco-friendly electric scooters. Every vehicle is GPS-enabled, fully insured, and maintained to the highest standards.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Why Choose Us</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">What We Stand For</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex gap-5 metallic-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <v.icon className="text-primary" size={28} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{v.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{v.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Our Team</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">Meet the Crew</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Passionate riders and tech enthusiasts building the future of urban mobility.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center metallic-hover"
              >
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
                  {member.emoji}
                </div>
                <h3 className="font-heading font-bold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">Ready to Ride?</h2>
            <p className="text-primary-foreground/70 mt-3 max-w-md mx-auto">Join thousands of happy riders. Book your first ride in under 2 minutes.</p>
            <a href="/dashboard" className="inline-block mt-6 bg-background text-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-background/90 transition-colors">
              Browse Vehicles
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
