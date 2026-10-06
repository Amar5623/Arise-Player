/** Parses the System's plain-text weekly report into its labelled sections. */
export const REPORT_HEADINGS = ['STATUS', 'STRENGTHS', 'WEAK POINTS', 'NEXT WEEK'] as const;

export interface ReportSection {
  heading: string;
  lines: string[];
}

export function parseReport(text: string): ReportSection[] {
  const sections: ReportSection[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const bare = line.toUpperCase().replace(/[:#*]/g, '').trim();
    const heading = REPORT_HEADINGS.find((h) => bare === h);
    if (heading) {
      sections.push({ heading, lines: [] });
      continue;
    }
    if (!sections.length) sections.push({ heading: 'STATUS', lines: [] });
    sections[sections.length - 1]?.lines.push(line.replace(/^[-*•]\s*/, ''));
  }
  return sections;
}
