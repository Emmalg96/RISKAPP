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

export type Her2ViewMode = "byPr" | "allRows";

export type Her2LinkedRisk = {
  riskLine: string;
  riskSummary: string;
  riskSource: string;
  riskScope: string;
  rmwFamily: RmwFamily | "other";
};

export type Her2LinkedProtocol = {
  protocol: string;
  acceptanceCriteriaStatus: string;
  protocolAcceptanceCriteria: string;
  overarchingAcceptanceCriteria: string;
};

export type Her2ProductRequirementBlock = {
  productRequirement: string;
  requirementText: string;
  projects: string[];
  riskScopes: string[];
  risks: Her2LinkedRisk[];
  protocols: Her2LinkedProtocol[];
  rowCount: number;
};

function linkedRiskKey(row: Her2ExplorerRow): string {
  const line = (row.RiskLine ?? "").trim().toLowerCase();
  if (line) return `line:${line}`;
  const summary = (row.RiskSummary ?? "").trim().toLowerCase();
  const source = (row.RiskSource ?? "").trim().toLowerCase();
  return `fallback:${summary}|${source}`;
}

function linkedProtocolKey(row: Her2ExplorerRow): string | null {
  const protocol = (row.Protocol ?? "").trim();
  if (!protocol || protocol.toLowerCase() === "nan") return null;
  return protocol.toLowerCase();
}

function preferLongerText(current: string, next: string): string {
  const a = (current ?? "").trim();
  const b = (next ?? "").trim();
  if (!a) return b;
  if (!b) return a;
  return b.length > a.length ? b : a;
}

function mergeProtocol(existing: Her2LinkedProtocol, row: Her2ExplorerRow): Her2LinkedProtocol {
  return {
    protocol: existing.protocol || row.Protocol,
    acceptanceCriteriaStatus: preferLongerText(existing.acceptanceCriteriaStatus, row.AcceptanceCriteriaStatus),
    protocolAcceptanceCriteria: preferLongerText(
      existing.protocolAcceptanceCriteria,
      row.ProtocolAcceptanceCriteria,
    ),
    overarchingAcceptanceCriteria: preferLongerText(
      existing.overarchingAcceptanceCriteria,
      row.OverarchingAcceptanceCriteria,
    ),
  };
}

export function groupHer2ExplorerRowsByProductRequirement(
  rows: Her2ExplorerRow[],
): Her2ProductRequirementBlock[] {
  const groups = new Map<string, Her2ExplorerRow[]>();

  for (const row of rows) {
    const pr = (row.ProductRequirement ?? "").trim();
    const key = pr || "—";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const blocks: Her2ProductRequirementBlock[] = [];

  for (const [productRequirement, groupRows] of groups) {
    const riskMap = new Map<string, Her2LinkedRisk>();
    const protocolMap = new Map<string, Her2LinkedProtocol>();
    let requirementText = "";

    for (const row of groupRows) {
      requirementText = preferLongerText(requirementText, row.RequirementText);

      const rk = linkedRiskKey(row);
      if (!riskMap.has(rk)) {
        riskMap.set(rk, {
          riskLine: row.RiskLine,
          riskSummary: row.RiskSummary,
          riskSource: row.RiskSource,
          riskScope: row.RiskScope,
          rmwFamily: rowRmwFamily(row),
        });
      }

      const pk = linkedProtocolKey(row);
      if (pk) {
        const existing = protocolMap.get(pk);
        if (!existing) {
          protocolMap.set(pk, {
            protocol: row.Protocol,
            acceptanceCriteriaStatus: row.AcceptanceCriteriaStatus,
            protocolAcceptanceCriteria: row.ProtocolAcceptanceCriteria,
            overarchingAcceptanceCriteria: row.OverarchingAcceptanceCriteria,
          });
        } else {
          protocolMap.set(pk, mergeProtocol(existing, row));
        }
      }
    }

    const sortRisk = (a: Her2LinkedRisk, b: Her2LinkedRisk) =>
      displayValue(a.riskLine).localeCompare(displayValue(b.riskLine), undefined, {
        sensitivity: "base",
        numeric: true,
      });

    const sortProtocol = (a: Her2LinkedProtocol, b: Her2LinkedProtocol) =>
      displayValue(a.protocol).localeCompare(displayValue(b.protocol), undefined, {
        sensitivity: "base",
        numeric: true,
      });

    blocks.push({
      productRequirement,
      requirementText,
      projects: uniqueSorted(groupRows.map((r) => r.Project)),
      riskScopes: uniqueSorted(groupRows.map((r) => r.RiskScope)),
      risks: [...riskMap.values()].sort(sortRisk),
      protocols: [...protocolMap.values()].sort(sortProtocol),
      rowCount: groupRows.length,
    });
  }

  return blocks.sort((a, b) =>
    a.productRequirement.localeCompare(b.productRequirement, undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  );
}
