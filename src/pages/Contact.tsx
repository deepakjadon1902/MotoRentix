import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'support@motorentix.com', subtitle: 'We reply within 2 hours' },
  { icon: Phone, label: 'Phone', value: '+91 98765 43210', subtitle: 'Mon-Sat, 9 AM – 8 PM' },
  { icon: MapPin, label: 'Office', value: 'HSR Layout, Bangalore', subtitle: 'Karnataka, India 560102' },
  { icon: Clock, label: 'Working Hours', value: '9 AM – 8 PM IST', subtitle: 'Monday to Saturday' },
];

const faqs = [
  { q: 'What documents do I need to rent?', a: 'A valid driving license and Aadhaar card are required for verification at the time of pickup.' },
  { q: 'Can I cancel my booking?', a: 'Yes, free cancellation up to 24 hours before your start time. After that, a nominal fee may apply.' },
  { q: 'Is insurance included?', a: 'Yes, all our vehicles come with comprehensive insurance coverage at no extra cost.' },
  { q: 'What if the vehicle breaks down?', a: 'We provide 24/7 roadside assistance. Call our helpline and we\'ll arrange a replacement immediately.' },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some(v => !v.trim())) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Message sent! We\'ll get back to you soon.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="section-padding bg-primary pt-24 md:pt-28">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-sm font-semibold text-primary-foreground/70 uppercase tracking-wider">Get in Touch</span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mt-2">
              We'd Love to<br />Hear From You
            </h1>
            <p className="text-primary-foreground/70 mt-4 max-w-xl mx-auto text-lg">
              Have a question, feedback, or just want to say hello? Reach out and we'll respond as quickly as we ride.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section-padding">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 -mt-20 relative z-10">
            {contactInfo.map((info, i) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center metallic-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <info.icon className="text-primary" size={22} />
                </div>
                <h3 className="font-heading font-bold text-foreground">{info.label}</h3>
                <p className="text-sm font-medium text-foreground mt-1">{info.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{info.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">Send a Message</h2>
                    <p className="text-sm text-muted-foreground">We typically respond within 2 hours</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => update('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => update('subject', e.target.value)}
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      placeholder="Tell us more..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary-gradient py-3.5 rounded-xl font-semibold text-primary-foreground flex items-center justify-center gap-2">
                    <Send size={18} /> Send Message
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Map / Location */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
              <div className="glass rounded-2xl overflow-hidden flex-1 min-h-[300px]">
                <iframe
                  title="MotoRentix Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.9252!2d77.6309!3d12.9116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae148e70000001%3A0x1234567890!2sHSR+Layout!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">Visit Our Office</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drop by our headquarters in HSR Layout, Bangalore. We're always happy to show you our fleet, answer questions, or just chat about bikes over a cup of chai! ☕
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">FAQ</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mt-2">Common Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-foreground text-sm">{faq.q}</span>
                  <span className={`text-muted-foreground transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-4"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
