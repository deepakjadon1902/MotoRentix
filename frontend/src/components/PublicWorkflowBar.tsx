import { motion } from "framer-motion";
import { ProIcon, type ProIconName } from "@/components/ProIcons";

type WorkflowStep = "search" | "compare" | "review" | "checkout" | "confirmed";

interface PublicWorkflowBarProps {
  current: WorkflowStep;
}

const steps: Array<{ key: WorkflowStep; label: string; caption: string; icon: ProIconName }> = [
  { key: "search", label: "Search", caption: "Find location", icon: "search" },
  { key: "compare", label: "Compare", caption: "Pick your ride", icon: "route" },
  { key: "review", label: "Review", caption: "Vehicle details", icon: "shield" },
  { key: "checkout", label: "Checkout", caption: "Dates & payment", icon: "card" },
  { key: "confirmed", label: "Confirmed", caption: "Pickup ready", icon: "calendar" },
];

const PublicWorkflowBar = ({ current }: PublicWorkflowBarProps) => {
  const activeIndex = steps.findIndex((step) => step.key === current);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card/95 p-2 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <div
              key={step.key}
              className={`relative flex min-h-[58px] items-center gap-2.5 rounded-md border px-3 py-2 transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : isDone
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-secondary/45 text-muted-foreground"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                <ProIcon name={step.icon} size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">{step.label}</span>
                <span className="hidden text-[11px] leading-tight text-current/75 md:block">{step.caption}</span>
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PublicWorkflowBar;
