export type Her2ExplorerRow = {
  Project: string;
  RiskScope: string;
  RiskSource: string;
  RiskLine: string;
  RiskSummary: string;
  RiskVerification: string;
  ProductRequirement: string;
  RequirementText: string;
  Protocol: string;
  OverarchingAcceptanceCriteria: string;
  ProtocolAcceptanceCriteria: string;
  AcceptanceCriteriaStatus: string;
};

export type Her2ExplorerDataset = {
  generatedAt: string;
  sourceFile: string;
  sheetName: string;
  rowCount: number;
  rows: Her2ExplorerRow[];
};

export type ProjectFilter = "all" | "DP52" | "DP61";

export type RmwFamily = "euRMW" | "dRMW";

export type Her2ExplorerFilters = {
  project: ProjectFilter;
  rmwFamilies: RmwFamily[];
  riskSources: string[];
  riskScopes: string[];
  search: string;
};

export const EMPTY_HER2_FILTERS: Her2ExplorerFilters = {
  project: "all",
  rmwFamilies: [],
  riskSources: [],
  riskScopes: [],
  search: "",
};

export function displayValue(value: string | undefined | null): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed.toLowerCase() === "nan") return "—";
  return trimmed;
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => v && v.toLowerCase() !== "nan"))].sort(
    (a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }),
  );
}

export function rowRmwFamily(row: Her2ExplorerRow): RmwFamily | "other" {
  const source = row.RiskSource ?? "";
  const line = row.RiskLine ?? "";
  if (source.includes("euRMW") || line.startsWith("euRMW")) return "euRMW";
  if (source.includes("dRMW") || line.startsWith("dRMW")) return "dRMW";
  return "other";
}

export function filterHer2ExplorerRows(rows: Her2ExplorerRow[], filters: Her2ExplorerFilters): Her2ExplorerRow[] {
  const search = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.project !== "all" && row.Project !== filters.project) return false;

    if (filters.riskScopes.length && !filters.riskScopes.includes((row.RiskScope ?? "").trim())) {
      return false;
    }

    if (filters.riskSources.length && !filters.riskSources.includes((row.RiskSource ?? "").trim())) {
      return false;
    }

    if (filters.rmwFamilies.length) {
      const family = rowRmwFamily(row);
      if (!filters.rmwFamilies.includes(family as RmwFamily)) return false;
    }

    if (search) {
      const haystack = [
        row.RiskLine,
        row.RiskSummary,
        row.ProductRequirement,
        row.Protocol,
        row.RiskSource,
        row.RequirementText,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function toggleMultiValue(current: string[], value: string): string[] {
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

export function toggleRmwFamily(current: RmwFamily[], family: RmwFamily): RmwFamily[] {
  return current.includes(family) ? current.filter((f) => f !== family) : [...current, family];
}
