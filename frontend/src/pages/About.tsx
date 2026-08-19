import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ProIcon, type ProIconName } from "@/components/ProIcons";
import aboutHero from "@/assets/about-hero.jpg";

const stats = [
  { value: "10,000+", label: "Happy Riders" },
  { value: "500+", label: "Vehicles" },
  { value: "25+", label: "Cities" },
  { value: "4.8/5", label: "Avg Rating" },
];

const values: Array<{ icon: ProIconName; title: string; description: string }> = [
  { icon: "shield", title: "Safety First", description: "Every vehicle undergoes rigorous safety checks before each rental. Your safety is our top priority." },
  { icon: "calendar", title: "Instant Booking", description: "Book a bike or scooter in under 2 minutes. No paperwork, no queues, just ride." },
  { icon: "message", title: "Customer Obsessed", description: "24/7 support, roadside assistance, and hassle-free returns keep riders moving." },
  { icon: "bike", title: "Premium Fleet", description: "From sport bikes to electric scooters, our fleet is well-maintained and regularly upgraded." },
];

const team = [
  { name: "Arjun Mehta", role: "Founder & CEO", initials: "AM" },
  { name: "Priya Kapoor", role: "Head of Operations", initials: "PK" },
  { name: "Rohan Verma", role: "Fleet Manager", initials: "RV" },
  { name: "Sneha Gupta", role: "Customer Success", initials: "SG" },
];

const About = () => {
  return (
    <div className="bg-background">
      <section className="relative h-[50vh] min-h-[420px] overflow-hidden md:h-[60vh]">
        <img src={aboutHero} alt="MotoRentix store" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">About us</span>
              <h1 className="mt-2 font-heading text-4xl font-bold text-background md:text-5xl lg:text-6xl">
                Redefining Urban<br />Mobility
              </h1>
              <p className="mt-4 max-w-xl text-lg text-background/75">
                MotoRentix was born from a simple idea: everyone deserves the freedom to ride without the burden of ownership.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-primary">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-heading text-3xl font-bold text-primary-foreground md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our story</span>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">Built by Riders, for Riders</h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass space-y-6 rounded-lg p-8 leading-relaxed text-muted-foreground md:p-12">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <ProIcon name="bike" className="text-primary" size={24} />
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <ProIcon name="bolt" className="text-accent" size={24} />
              </div>
            </div>
            <p>
              Founded in 2023, MotoRentix started as a small fleet of 10 bikes in Bangalore. What began as a weekend passion project by motorcycle enthusiasts grew into a focused two-wheeler rental platform.
            </p>
            <p>
              We noticed a gap: owning a bike in a city is expensive and impractical, but the joy of riding should not be limited to ownership. Daily commutes, weekend getaways, and premium test rides all belong in one simple booking flow.
            </p>
            <p>
              Today, we operate in over 25 cities with a diverse fleet of 500+ vehicles, from powerful sport bikes to eco-friendly electric scooters. Every vehicle is GPS-enabled, insured, and maintained to high operating standards.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Why choose us</span>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">What We Stand For</h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass metallic-hover flex gap-5 rounded-lg p-6"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <ProIcon name={value.icon} className="text-primary" size={28} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{value.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our team</span>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">Meet the Crew</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Operators, designers, and riders building better urban mobility tools.</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass metallic-hover rounded-lg p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-md bg-secondary font-heading text-xl font-bold text-primary">
                  {member.initials}
                </div>
                <h3 className="font-heading font-bold text-foreground">{member.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-3xl font-bold text-primary-foreground md:text-4xl">Ready to Ride?</h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/70">Join thousands of happy riders. Book your first ride in under 2 minutes.</p>
            <Link to="/dashboard" className="mt-6 inline-block rounded-md bg-background px-8 py-3.5 font-semibold text-foreground transition-colors hover:bg-background/90">
              Browse Vehicles
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
