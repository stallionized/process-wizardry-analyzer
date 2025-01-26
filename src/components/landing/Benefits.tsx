import { ChartBarIcon, Cog, RocketIcon, ShieldCheck } from "lucide-react";
import { BenefitCard } from "./BenefitCard";

const benefits = [
  {
    icon: ChartBarIcon,
    title: "Data-Driven Optimization",
    description: "Transform raw process data into actionable insights for continuous improvement"
  },
  {
    icon: Cog,
    title: "Precision Control",
    description: "Maintain exceptional accuracy and consistency across all process parameters"
  },
  {
    icon: RocketIcon,
    title: "Enhanced Efficiency",
    description: "Accelerate processes while reducing resource consumption and waste"
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description: "Proactively identify and prevent quality issues before they impact production"
  }
];

export const Benefits = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {benefits.map((benefit, index) => (
      <BenefitCard key={index} {...benefit} />
    ))}
  </div>
);