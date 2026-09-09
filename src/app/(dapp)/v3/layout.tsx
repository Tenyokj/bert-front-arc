import { V3Navigation } from "@/components/V3Navigation";

/** Layout boundary for the independent BERT V3 Community Layer application. */
export default function V3Layout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6"><V3Navigation />{children}</div>;
}
