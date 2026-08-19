import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { ProIcon, type ProIconName } from "@/components/ProIcons";

const contactInfo: Array<{
  icon: ProIconName | typeof Mail;
  label: string;
  value: string;
  subtitle: string;
}> = [
  { icon: Mail, label: "Email", value: "support@motorentix.com", subtitle: "We reply within 2 hours" },
  { icon: Phone, label: "Phone", value: "+91 98765 43210", subtitle: "Mon-Sat, 9 AM - 8 PM" },
  { icon: MapPin, label: "Office", value: "HSR Layout, Bangalore", subtitle: "Karnataka, India 560102" },
  { icon: "calendar", label: "Working Hours", value: "9 AM - 8 PM IST", subtitle: "Monday to Saturday" },
];

const faqs = [
  { q: "What documents do I need to rent?", a: "A valid driving license and Aadhaar card are required for verification at the time of pickup." },
  { q: "Can I cancel my booking?", a: "Yes, free cancellation is available up to 24 hours before your start time. After that, a nominal fee may apply." },
  { q: "Is insurance included?", a: "Yes, all vehicles come with comprehensive insurance coverage at no extra cost." },
  { q: "What if the vehicle breaks down?", a: "We provide roadside assistance and arrange support or replacement as quickly as possible." },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { isAuthenticated, sendMessage } = useStore();

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(form).some((v) => !v.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please login to send a message");
      return;
    }

    const messagePayload = `From: ${form.name} <${form.email}>\nSubject: ${form.subject}\nMessage: ${form.message}`;
    const ok = await sendMessage(messagePayload);
    if (ok) {
      toast.success("Message sent! We'll get back to you soon.");
      const waText = encodeURIComponent(
        `MotoRentix Contact\nName: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\nMessage: ${form.message}`,
      );
      window.open(`https://wa.me/919149370081?text=${waText}`, "_blank");
      setForm({ name: "", email: "", subject: "", message: "" });
    } else {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="bg-background">
      <section className="section-padding bg-primary pt-24 md:pt-28">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">Get in touch</span>
            <h1 className="mt-2 font-heading text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
              We'd Love to<br />Hear From You
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/70">
              Have a question, feedback, or partnership idea? Reach out and we'll respond quickly.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto">
          <div className="relative z-10 -mt-20 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((info, i) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass metallic-hover rounded-lg p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                    {typeof Icon === "string" ? <ProIcon name={Icon} className="text-primary" size={22} /> : <Icon className="text-primary" size={22} />}
                  </div>
                  <h3 className="font-heading font-bold text-foreground">{info.label}</h3>
                  <p className="mt-1 text-sm font-medium text-foreground">{info.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{info.subtitle}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="glass rounded-lg p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <ProIcon name="message" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">Send a Message</h2>
                    <p className="text-sm text-muted-foreground">We typically respond within 2 hours</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                      <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                      <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
                    <input type="text" value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="How can we help?" className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
                    <textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Tell us more..." rows={5} className="w-full resize-none rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <button type="submit" className="btn-primary-gradient flex w-full items-center justify-center gap-2 rounded-md py-3.5 font-semibold text-primary-foreground">
                    <Send size={18} /> Send Message
                  </button>
                </form>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex flex-col gap-6">
              <div className="glass min-h-[300px] flex-1 overflow-hidden rounded-lg">
                <iframe
                  title="MotoRentix Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.9252!2d77.6309!3d12.9116!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae148e70000001%3A0x1234567890!2sHSR+Layout!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "300px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="glass rounded-lg p-6">
                <h3 className="mb-2 font-heading text-lg font-bold text-foreground">Visit Our Office</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Drop by our headquarters in HSR Layout, Bangalore. We're happy to show the fleet, answer questions, or talk through your next rental plan.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">Common Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass overflow-hidden rounded-lg"
              >
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left">
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`text-muted-foreground transition-transform duration-300 ${expandedFaq === i ? "rotate-180" : ""}`} size={18} />
                </button>
                {expandedFaq === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-6 pb-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
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
