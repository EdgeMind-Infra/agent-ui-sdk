"use client";

import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "src/components/ai-elements/sources";
import type { SourcePartProps } from "../../types";

export function SourcePart({ sources }: SourcePartProps) {
  if (sources.length === 0) return null;

  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((source) => (
          <Source href={source.url} key={source.sourceId} title={source.title ?? source.url} />
        ))}
      </SourcesContent>
    </Sources>
  );
}
