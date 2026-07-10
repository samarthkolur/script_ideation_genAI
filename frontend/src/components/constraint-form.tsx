"use client";

/**
 * The FR-01 constraint input form — all 8 constraint dimensions in one
 * screen, grouped into scannable sections rather than one long list.
 *
 * Why client component: every field is interactive local state; there is
 * no server data to fetch yet (Phase 2 wires this to the real API). On
 * submit it navigates to the mock /variants screen — wireframe only, no
 * generation actually happens here.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

import {
  AUDIENCES,
  BUDGET_TIERS,
  CAST_SIZES,
  CENSORSHIP_FRAMEWORKS,
  GENRES,
  LANGUAGES,
  LOCATION_TYPES,
  REGIONS,
  REGION_DEFAULT_FRAMEWORK,
  VFX_LEVELS,
} from "@/lib/constraint-taxonomy";

const MAX_GENRES = 2;

export function ConstraintForm() {
  const router = useRouter();

  const [genres, setGenres] = useState<string[]>(["scifi", "drama"]);
  const [audience, setAudience] = useState("young_adult");
  const [budgetTier, setBudgetTier] = useState("low");
  const [runtime, setRuntime] = useState(105);
  const [region, setRegion] = useState("india");
  const [language, setLanguage] = useState("en");
  const [framework, setFramework] = useState(REGION_DEFAULT_FRAMEWORK["india"]);
  const [rating, setRating] = useState("UA13");
  const [locationType, setLocationType] = useState("limited_locations");
  const [castSize, setCastSize] = useState("small");
  const [vfx, setVfx] = useState("light");
  const [notes, setNotes] = useState(
    "Grounded, character-first sci-fi — think small-scale, not spectacle."
  );

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
    const defaultFramework = REGION_DEFAULT_FRAMEWORK[code];
    setFramework(defaultFramework);
    setRating(CENSORSHIP_FRAMEWORKS[defaultFramework].ratings[0]);
  }

  /** Base UI's Select emits `string | null` (null = cleared); our fields are never clearable. */
  function onSelect(setter: (value: string) => void) {
    return (value: string | null) => {
      if (value) setter(value);
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (genres.length === 0) {
      toast.error("Select at least one genre.");
      return;
    }
    toast.success("Brief submitted — generating 3 plot variants...", {
      description: "This is a wireframe: navigating to mock results.",
    });
    router.push("/variants");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Genre &amp; Audience</CardTitle>
          <CardDescription>CT-01, CT-02 — pick up to {MAX_GENRES} genres and a target audience band.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label>Genre</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENRES.map((g) => (
                <label
                  key={g.code}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox
                    checked={genres.includes(g.code)}
                    onCheckedChange={() => toggleGenre(g.code)}
                  />
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
                {AUDIENCES.map((a) => (
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
            {BUDGET_TIERS.map((b) => (
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
                {REGIONS.map((r) => (
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
                {LANGUAGES.map((l) => (
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
                setRating(CENSORSHIP_FRAMEWORKS[v].ratings[0]);
              })}
            >
              <SelectTrigger id="framework"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CENSORSHIP_FRAMEWORKS).map(([code, fw]) => (
                  <SelectItem key={code} value={code}>{fw.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rating">Target rating</Label>
            <Select value={rating} onValueChange={onSelect(setRating)}>
              <SelectTrigger id="rating"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CENSORSHIP_FRAMEWORKS[framework].ratings.map((r) => (
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
                {LOCATION_TYPES.map((l) => (
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
                {CAST_SIZES.map((c) => (
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
                {VFX_LEVELS.map((v) => (
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
            <Badge key={g} variant="secondary">{GENRES.find((x) => x.code === g)?.label}</Badge>
          ))}
        </div>
        <Button type="submit" size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" /> Generate variants
        </Button>
      </div>
    </form>
  );
}
