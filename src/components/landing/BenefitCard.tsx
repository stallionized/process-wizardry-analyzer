import { Card } from "@/components/ui/card";

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export const BenefitCard = ({ icon: Icon, title, description }: BenefitCardProps) => (
  <Card className="bg-black/[0.96] p-6 flex flex-col items-center text-center space-y-4">
    <Icon className="w-8 h-8 text-blue-400" />
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <p className="text-neutral-300 text-sm">{description}</p>
  </Card>
);