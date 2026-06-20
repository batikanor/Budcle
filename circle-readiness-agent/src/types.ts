export interface RepoInput {
  repoPath: string;
  name: string;
  url?: string;
  existingIssueUrl?: string;
}

export interface Evidence {
  file: string;
  line: number;
  text: string;
}

export interface EndpointEvidence extends Evidence {
  method: string;
  path: string;
  nearbyMiddleware: string[];
}

export interface Signal {
  id: string;
  label: string;
  present: boolean;
  weight: number;
  evidence: Evidence[];
}

export interface Finding {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  evidence: Evidence[];
  recommendation: string;
}

export interface AnalysisResult {
  input: RepoInput;
  analyzedAt: string;
  summary: {
    score: number;
    verdict: string;
    estimatedEffort: "low" | "medium" | "high";
  };
  filesScanned: number;
  endpoints: EndpointEvidence[];
  signals: Signal[];
  findings: Finding[];
  issueDraft: {
    title: string;
    body: string;
  };
}
