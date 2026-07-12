"use client";

/** FR-08 — export a selected variant as PDF or plain text. Generates and downloads via /api/variants/[id]/export (see lib/export.ts). */

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, File, Loader2 } from "lucide-react";

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
import { exportVariant } from "@/hooks/use-variants";
import type { ApiVariant } from "@/lib/types";

export function ExportDialog({ variant }: { variant: ApiVariant }) {
  const [format, setFormat] = useState<"pdf" | "text">("pdf");
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportVariant(variant.id, format);
      toast.success(`Exported as ${format === "pdf" ? "PDF" : "plain text"}`);
    } catch {
      toast.error("Export failed. Try again.");
    } finally {
      setIsExporting(false);
    }
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
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition-colors duration-150 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-accent">
            <RadioGroupItem value="pdf" />
            <File className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Formatted PDF</span>
              <span className="text-xs text-muted-foreground">Best for sharing with collaborators</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 transition-colors duration-150 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-accent">
            <RadioGroupItem value="text" />
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Plain text</span>
              <span className="text-xs text-muted-foreground">Best for pasting into other tools</span>
            </div>
          </label>
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isExporting ? "Preparing…" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
