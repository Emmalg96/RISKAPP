import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterHer2ExplorerRows,
  groupHer2ExplorerRowsByProductRequirement,
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

  it("groups rows by product requirement and dedupes risks and protocols", () => {
    const rows = [
      sample,
      { ...sample, Protocol: "DP52-VEP-010", RiskLine: "dRMW-risk-002" },
      { ...sample, ProductRequirement: "PR.02", Protocol: "DP52-VEP-012" },
    ];
    const blocks = groupHer2ExplorerRowsByProductRequirement(rows);
    assert.equal(blocks.length, 2);
    const pr01 = blocks.find((b) => b.productRequirement === "PR.01");
    assert.ok(pr01);
    assert.equal(pr01.risks.length, 2);
    assert.equal(pr01.protocols.length, 2);
    assert.equal(pr01.rowCount, 2);
  });

  it("keeps only filtered risks and protocols inside a PR block", () => {
    const rows = [
      sample,
      { ...sample, RiskSource: "LBN-euRMW-020", RiskLine: "euRMW-risk-001", Protocol: "DP52-VEP-010" },
    ];
    const euOnly = filterHer2ExplorerRows(rows, {
      project: "all",
      rmwFamilies: ["euRMW"],
      riskSources: [],
      riskScopes: [],
      search: "",
    });
    const blocks = groupHer2ExplorerRowsByProductRequirement(euOnly);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.risks.length, 1);
    assert.equal(blocks[0]?.risks[0]?.riskLine, "euRMW-risk-001");
    assert.equal(blocks[0]?.protocols.length, 1);
    assert.equal(blocks[0]?.protocols[0]?.protocol, "DP52-VEP-010");
  });
});
