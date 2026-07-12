import { ConstraintForm } from "@/components/constraint-form";
import { FadeIn } from "@/components/motion/fade-in";

export default function CreateBriefPage() {
  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-semibold tracking-tight">New creative brief</h1>
          <p className="text-muted-foreground">
            Define all 8 constraint dimensions once. The generation engine respects every one
            simultaneously across every variant it returns.
          </p>
        </div>
      </FadeIn>
      <ConstraintForm />
    </div>
  );
}
