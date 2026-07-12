"use client";

/**
 * The FR-01 constraint input form — all 8 constraint dimensions in one
 * screen, grouped into scannable sections rather than one long list.
 *
 * Options come from /api/constraint-taxonomy (Postgres, NFR-08) instead of
 * a hardcoded file (Phase 1). Submitting creates a real Project + Brief
 * and triggers real generation via the AI service — this can take a real
 * amount of time (NIM queueing, or instant with the mock provider), so the
 * submit button reflects actual pending state, not a fixed animation.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstraintTaxonomy } from "@/hooks/use-constraint-taxonomy";
import { useCreateProject } from "@/hooks/use-projects";
import type { ConstraintOptionDto, ConstraintTaxonomy } from "@/lib/types";

const MAX_GENRES = 2;

/** Base UI's Select emits `string | null` (null = cleared); our fields are never clearable. */
function onSelect(setter: (value: string) => void) {
  return (value: string | null) => {
    if (value) setter(value);
  };
}

function ratingsFor(frameworkOptions: ConstraintOptionDto[], code: string): string[] {
  const meta = frameworkOptions.find((f) => f.code === code)?.metadata;
  return (meta?.ratings as string[] | undefined) ?? [];
}

function defaultFrameworkFor(regionOptions: ConstraintOptionDto[], code: string): string | undefined {
  const meta = regionOptions.find((r) => r.code === code)?.metadata;
  return meta?.defaultCensorshipFramework as string | undefined;
}

export function ConstraintForm() {
  const { data: taxonomy, isLoading, isError } = useConstraintTaxonomy();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !taxonomy) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load the constraint taxonomy. Check the API/database connection and try again.
        </CardContent>
      </Card>
    );
  }

  return <ConstraintFormLoaded taxonomy={taxonomy} />;
}

function ConstraintFormLoaded({ taxonomy }: { taxonomy: ConstraintTaxonomy }) {
  const router = useRouter();
  const createProject = useCreateProject();

  const genreOptions = taxonomy.genre ?? [];
  const audienceOptions = taxonomy.audience ?? [];
  const budgetOptions = taxonomy.budget_tier ?? [];
  const regionOptions = taxonomy.region ?? [];
  const languageOptions = taxonomy.language ?? [];
  const frameworkOptions = taxonomy.censorship_framework ?? [];
  const locationOptions = taxonomy.location_type ?? [];
  const castOptions = taxonomy.cast_size ?? [];
  const vfxOptions = taxonomy.vfx_dependency ?? [];

  const [title, setTitle] = useState("");
  const [genres, setGenres] = useState<string[]>(() => genreOptions.slice(0, 2).map((g) => g.code));
  const [audience, setAudience] = useState(() => audienceOptions[0]?.code ?? "");
  const [budgetTier, setBudgetTier] = useState(() => budgetOptions[0]?.code ?? "");
  const [runtime, setRuntime] = useState(105);
  const [region, setRegion] = useState(() => regionOptions[0]?.code ?? "");
  const [language, setLanguage] = useState(() => languageOptions[0]?.code ?? "");
  const [framework, setFramework] = useState(
    () => defaultFrameworkFor(regionOptions, regionOptions[0]?.code ?? "") ?? frameworkOptions[0]?.code ?? ""
  );
  const [rating, setRating] = useState(() => ratingsFor(frameworkOptions, framework)[0] ?? "");
  const [locationType, setLocationType] = useState(() => locationOptions[0]?.code ?? "");
  const [castSize, setCastSize] = useState(() => castOptions[0]?.code ?? "");
  const [vfx, setVfx] = useState(() => vfxOptions[0]?.code ?? "");
  const [notes, setNotes] = useState("");

  function toggleGenre(code: string) {
    setGenres((prev) => {
      if (prev.includes(code)) return prev.filter((g) => g !== code);
      if (prev.length >= MAX_GENRES) {
        toast.info(`Genre is limited to ${MAX_GENRES} selections (CT-01).`);
        return prev;
      }
      return [...prev, code];
    });
  }

  function handleRegionChange(code: string) {
    setRegion(code);
    const defaultFw = defaultFrameworkFor(regionOptions, code) ?? frameworkOptions[0]?.code ?? "";
    setFramework(defaultFw);
    setRating(ratingsFor(frameworkOptions, defaultFw)[0] ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give this project a name.");
      return;
    }
    if (genres.length === 0) {
      toast.error("Select at least one genre.");
      return;
    }
    createProject.mutate(
      {
        title,
        brief: {
          genres,
          audience,
          budgetTier,
          runtimeMinutes: runtime,
          region,
          language,
          censorshipFramework: framework,
          censorshipRating: rating,
          locationType,
          castSize,
          vfxDependency: vfx,
          freeformNotes: notes || undefined,
        },
      },
      {
        onSuccess: (project) => {
          toast.success("Variants generated");
          router.push(`/projects/${project.id}`);
        },
        onError: () => {
          toast.error("Couldn't generate variants. The AI service may be unavailable — try again.");
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
          <CardDescription>What is this concept called? You can rename it later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Neural implant thriller — India, low-budget"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Genre &amp; Audience</CardTitle>
          <CardDescription>CT-01, CT-02 — pick up to {MAX_GENRES} genres and a target audience band.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label>Genre</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {genreOptions.map((g) => (
                <label
                  key={g.code}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox checked={genres.includes(g.code)} onCheckedChange={() => toggleGenre(g.code)} />
                  {g.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-72">
            <Label htmlFor="audience">Target audience</Label>
            <Select value={audience} onValueChange={onSelect(setAudience)}>
              <SelectTrigger id="audience"><SelectValue /></SelectTrigger>
              <SelectContent>
                {audienceOptions.map((a) => (
                  <SelectItem key={a.code} value={a.code}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget &amp; Runtime</CardTitle>
          <CardDescription>CT-03, CT-04 — sets the production ceiling every variant must respect.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup value={budgetTier} onValueChange={setBudgetTier} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {budgetOptions.map((b) => (
              <label
                key={b.code}
                className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value={b.code} className="mt-0.5" />
                {b.label}
              </label>
            ))}
          </RadioGroup>
          <div className="flex flex-col gap-3 sm:w-96">
            <div className="flex items-center justify-between">
              <Label>Runtime</Label>
              <span className="text-sm font-medium tabular-nums">{runtime} min</span>
            </div>
            <Slider
              value={[runtime]}
              min={5}
              max={240}
              step={5}
              onValueChange={(v) => setRuntime(Array.isArray(v) ? v[0] : v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Region, Language &amp; Censorship</CardTitle>
          <CardDescription>CT-05, CT-06, CT-07 — target market and content rating.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={onSelect(handleRegionChange)}>
              <SelectTrigger id="region"><SelectValue /></SelectTrigger>
              <SelectContent>
                {regionOptions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="language">Output language</Label>
            <Select value={language} onValueChange={onSelect(setLanguage)}>
              <SelectTrigger id="language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {languageOptions.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="framework">Censorship framework</Label>
            <Select
              value={framework}
              onValueChange={onSelect((v) => {
                setFramework(v);
                setRating(ratingsFor(frameworkOptions, v)[0] ?? "");
              })}
            >
              <SelectTrigger id="framework"><SelectValue /></SelectTrigger>
              <SelectContent>
                {frameworkOptions.map((fw) => (
                  <SelectItem key={fw.code} value={fw.code}>{fw.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rating">Target rating</Label>
            <Select value={rating} onValueChange={onSelect(setRating)}>
              <SelectTrigger id="rating"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ratingsFor(frameworkOptions, framework).map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production Constraints</CardTitle>
          <CardDescription>CT-08 — location, cast, and VFX ceiling. Should stay consistent with the budget tier above.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location type</Label>
            <Select value={locationType} onValueChange={onSelect(setLocationType)}>
              <SelectTrigger id="location"><SelectValue /></SelectTrigger>
              <SelectContent>
                {locationOptions.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cast">Cast size</Label>
            <Select value={castSize} onValueChange={onSelect(setCastSize)}>
              <SelectTrigger id="cast"><SelectValue /></SelectTrigger>
              <SelectContent>
                {castOptions.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vfx">VFX dependency</Label>
            <Select value={vfx} onValueChange={onSelect(setVfx)}>
              <SelectTrigger id="vfx"><SelectValue /></SelectTrigger>
              <SelectContent>
                {vfxOptions.map((v) => (
                  <SelectItem key={v.code} value={v.code}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creative Notes</CardTitle>
          <CardDescription>Optional free-text flavor — not constraint-validated (per Constraint Taxonomy v1).</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tone, references, anything the structured fields don't capture..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <span>Ready to generate:</span>
          {genres.map((g) => (
            <Badge key={g} variant="secondary">{genreOptions.find((x) => x.code === g)?.label}</Badge>
          ))}
        </div>
        <Button type="submit" size="lg" disabled={createProject.isPending} className="gap-2">
          {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {createProject.isPending ? "Generating…" : "Generate variants"}
        </Button>
      </div>
    </form>
  );
}
