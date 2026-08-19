import { motion } from "framer-motion";
import { CalendarCheck, CreditCard, ListChecks, Search, ShieldCheck } from "lucide-react";

type WorkflowStep = "search" | "compare" | "review" | "checkout" | "confirmed";

interface PublicWorkflowBarProps {
  current: WorkflowStep;
}

const steps: Array<{ key: WorkflowStep; label: string; caption: string; icon: typeof Search }> = [
  { key: "search", label: "Search", caption: "Find location", icon: Search },
  { key: "compare", label: "Compare", caption: "Check companies", icon: ListChecks },
  { key: "review", label: "Review", caption: "Vehicle details", icon: ShieldCheck },
  { key: "checkout", label: "Checkout", caption: "Dates & payment", icon: CreditCard },
  { key: "confirmed", label: "Confirmed", caption: "Pickup ready", icon: CalendarCheck },
];

const PublicWorkflowBar = ({ current }: PublicWorkflowBarProps) => {
  const activeIndex = steps.findIndex((step) => step.key === current);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/95 p-3 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <div
              key={step.key}
              className={`relative flex min-h-[72px] items-center gap-3 rounded-xl border px-3 py-2 transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : isDone
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-secondary/45 text-muted-foreground"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">{step.label}</span>
                <span className="block text-[11px] leading-tight">{step.caption}</span>
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PublicWorkflowBar;
