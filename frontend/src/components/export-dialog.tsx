"use client";

/**
 * FR-08 — export a selected variant as PDF or plain text.
 *
 * Wireframe scope: the export *service* is a Phase 2 backend dependency
 * (source plan §5, Phase 2 task "Build export service"). This dialog
 * establishes the UX (format choice, confirmation) without a real file
 * being produced — the "Download" action here is explicitly mocked and
 * says so, rather than silently doing nothing on click.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, File } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Variant } from "@/lib/types";

export function ExportDialog({ variant }: { variant: Variant }) {
  const [format, setFormat] = useState<"pdf" | "text">("pdf");

  function handleExport() {
    toast.success(`Export queued as ${format === "pdf" ? "PDF" : "plain text"}`, {
      description: "Wireframe only — the export service ships in Phase 2 (FR-08).",
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" className="gap-2" />}>
        <Download className="h-4 w-4" /> Export
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export variant</DialogTitle>
          <DialogDescription>
            Choose a format for &ldquo;{variant.logline.slice(0, 60)}…&rdquo;
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={format} onValueChange={(v) => setFormat(v as "pdf" | "text")} className="gap-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem value="pdf" />
            <File className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Formatted PDF</span>
              <span className="text-xs text-muted-foreground">Best for sharing with collaborators</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem value="text" />
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Plain text</span>
              <span className="text-xs text-muted-foreground">Best for pasting into other tools</span>
            </div>
          </label>
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
