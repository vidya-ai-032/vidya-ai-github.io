// Rule-based segmentation utility for educational content

export interface Subtopic {
  title: string;
  summary: string;
  keyPoints: string[];
  subtopics?: Subtopic[];
  estimatedTime?: string;
}

/**
 * Splits text into subtopics using simple rules (headings, numbers, keywords).
 * Returns an array of Subtopic objects.
 */
export function segmentTextToSubtopics(text: string): Subtopic[] {
  const lines = text.split(/\r?\n/);
  const subtopics: Subtopic[] = [];
  let current: Subtopic | null = null;
  let summary: string = "";
  const keyPoints: string[] = [];
  let foundFirstHeading = false;

  const headingRegex = /^(\d+\.|Chapter|Section)\s*(.+)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const headingMatch = trimmed.match(headingRegex);
    if (headingMatch) {
      foundFirstHeading = true;
      if (current) subtopics.push(current);
      current = {
        title: headingMatch[2] || headingMatch[0],
        summary: "",
        keyPoints: [],
      };
    } else if (current) {
      if (!current.summary) {
        current.summary = trimmed;
      } else {
        current.keyPoints.push(trimmed);
      }
    } else if (!foundFirstHeading) {
      // Before the first heading: treat as summary/key points for the top-level topic
      if (!summary) {
        summary = trimmed;
      } else {
        keyPoints.push(trimmed);
      }
    }
  }
  if (current) subtopics.push(current);

  // Always return a top-level topic with summary/keyPoints and subtopics
  return [
    {
      title: "Extracted Content",
      summary,
      keyPoints,
      subtopics,
    },
  ];
}
