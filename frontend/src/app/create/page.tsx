import { ConstraintForm } from "@/components/constraint-form";

export default function CreateBriefPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">New creative brief</h1>
        <p className="text-muted-foreground">
          Define all 8 constraint dimensions once. The generation engine respects every one
          simultaneously across every variant it returns.
        </p>
      </div>
      <ConstraintForm />
    </div>
  );
}
