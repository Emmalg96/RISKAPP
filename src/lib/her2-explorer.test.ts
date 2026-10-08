import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterHer2ExplorerRows,
  rowRmwFamily,
  type Her2ExplorerRow,
} from "./her2-explorer";

const sample: Her2ExplorerRow = {
  Project: "DP52",
  RiskScope: "DP52-specific design risk",
  RiskSource: "LBN-dRMW-016",
  RiskLine: "dRMW-risk-001",
  RiskSummary: "Example",
  RiskVerification: "",
  ProductRequirement: "PR.01",
  RequirementText: "",
  Protocol: "DP52-VEP-011",
  OverarchingAcceptanceCriteria: "",
  ProtocolAcceptanceCriteria: "",
  AcceptanceCriteriaStatus: "",
};

describe("her2-explorer", () => {
  it("detects dRMW family from RiskSource and RiskLine", () => {
    assert.equal(rowRmwFamily(sample), "dRMW");
    assert.equal(
      rowRmwFamily({ ...sample, RiskSource: "LBN-euRMW-020", RiskLine: "euRMW-risk-001" }),
      "euRMW",
    );
  });

  it("filters by project and RMW family", () => {
    const rows = [
      sample,
      { ...sample, Project: "DP61", RiskSource: "LBN-euRMW-020", RiskLine: "euRMW-risk-001" },
    ];
    const dp52Only = filterHer2ExplorerRows(rows, {
      project: "DP52",
      rmwFamilies: [],
      riskSources: [],
      riskScopes: [],
      search: "",
    });
    assert.equal(dp52Only.length, 1);
    assert.equal(dp52Only[0]?.Project, "DP52");

    const euOnly = filterHer2ExplorerRows(rows, {
      project: "all",
      rmwFamilies: ["euRMW"],
      riskSources: [],
      riskScopes: [],
      search: "",
    });
    assert.equal(euOnly.length, 1);
    assert.equal(euOnly[0]?.RiskLine, "euRMW-risk-001");
  });
});
