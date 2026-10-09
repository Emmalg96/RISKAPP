"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPTY_HER2_FILTERS,
  displayValue,
  filterHer2ExplorerRows,
  groupHer2ExplorerRowsByProductRequirement,
  rowRmwFamily,
  toggleMultiValue,
  toggleRmwFamily,
  uniqueSorted,
  type Her2ExplorerDataset,
  type Her2ExplorerFilters,
  type Her2ExplorerRow,
  type Her2LinkedProtocol,
  type Her2LinkedRisk,
  type Her2ProductRequirementBlock,
  type Her2ViewMode,
  type ProjectFilter,
  type RmwFamily,
} from "@/lib/her2-explorer";

function MultiCheckboxFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (!options.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {selected.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </div>
      <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-border/80 bg-background/60 p-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-start gap-2 text-sm leading-snug">
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => onChange(toggleMultiValue(selected, option))}
              className="mt-0.5"
            />
            <span className="break-words">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RiskCard({ row }: { row: Her2ExplorerRow }) {
  const family = rowRmwFamily(row);

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[11px] uppercase tracking-wide">
            {displayValue(row.RiskLine)}
          </Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            Protocol: {displayValue(row.Protocol)}
          </Badge>
          <Badge variant="outline">PR: {displayValue(row.ProductRequirement)}</Badge>
          <Badge variant="outline">{displayValue(row.Project)}</Badge>
          {family !== "other" && <Badge variant="outline">{family}</Badge>}
        </div>
        <CardTitle className="text-base font-semibold leading-snug text-foreground">
          {displayValue(row.RiskSummary)}
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>
            <span className="font-medium text-foreground">RiskSource:</span> {displayValue(row.RiskSource)}
          </span>
          <span>
            <span className="font-medium text-foreground">RiskScope:</span> {displayValue(row.RiskScope)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 border-t border-border/60 pt-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Requirement</p>
          <p className="mt-0.5 whitespace-pre-wrap break-words">{displayValue(row.RequirementText)}</p>
        </div>
        {row.OverarchingAcceptanceCriteria.trim() && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Overarching AC
            </p>
            <p className="mt-0.5 line-clamp-6 whitespace-pre-wrap break-words text-muted-foreground">
              {displayValue(row.OverarchingAcceptanceCriteria)}
            </p>
          </div>
        )}
        {row.ProtocolAcceptanceCriteria.trim() && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Protocol AC</p>
            <p className="mt-0.5 line-clamp-6 whitespace-pre-wrap break-words text-muted-foreground">
              {displayValue(row.ProtocolAcceptanceCriteria)}
            </p>
          </div>
        )}
        {row.AcceptanceCriteriaStatus.trim() && (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AC status</p>
            <p className="mt-0.5">{displayValue(row.AcceptanceCriteriaStatus)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LinkedRiskItem({ risk }: { risk: Her2LinkedRisk }) {
  return (
    <li className="rounded-md border border-border/70 bg-background/50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono text-[11px] uppercase tracking-wide">
          {displayValue(risk.riskLine)}
        </Badge>
        {risk.rmwFamily !== "other" && (
          <Badge variant="outline" className="text-[10px]">
            {risk.rmwFamily}
          </Badge>
        )}
      </div>
      <p className="mt-2 font-medium leading-snug text-foreground">{displayValue(risk.riskSummary)}</p>
      <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div>
          <dt className="sr-only">Risk source</dt>
          <dd>
            <span className="font-medium text-foreground/80">Source:</span> {displayValue(risk.riskSource)}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Risk scope</dt>
          <dd>
            <span className="font-medium text-foreground/80">Scope:</span> {displayValue(risk.riskScope)}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function LinkedProtocolItem({ protocol }: { protocol: Her2LinkedProtocol }) {
  const acSnippet =
    protocol.acceptanceCriteriaStatus.trim() ||
    protocol.protocolAcceptanceCriteria.trim() ||
    protocol.overarchingAcceptanceCriteria.trim();

  return (
    <li className="rounded-md border border-border/70 bg-background/50 p-3 text-sm">
      <Badge className="bg-primary/10 font-mono text-[11px] text-primary hover:bg-primary/15">
        {displayValue(protocol.protocol)}
      </Badge>
      {protocol.acceptanceCriteriaStatus.trim() && (
        <p className="mt-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">AC status</span>
          <span className="mt-0.5 block text-foreground">{displayValue(protocol.acceptanceCriteriaStatus)}</span>
        </p>
      )}
      {acSnippet && !protocol.acceptanceCriteriaStatus.trim() && (
        <p className="mt-2 line-clamp-4 text-xs text-muted-foreground">{displayValue(acSnippet)}</p>
      )}
      {protocol.acceptanceCriteriaStatus.trim() && acSnippet !== protocol.acceptanceCriteriaStatus.trim() && (
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
          {displayValue(protocol.protocolAcceptanceCriteria || protocol.overarchingAcceptanceCriteria)}
        </p>
      )}
    </li>
  );
}

function ProductRequirementHubBlock({ block }: { block: Her2ProductRequirementBlock }) {
  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6 lg:p-6">
        <section aria-labelledby={`pr-${block.productRequirement}-risks`} className="min-w-0 space-y-2">
          <h3
            id={`pr-${block.productRequirement}-risks`}
            className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Linked risks ({block.risks.length})
          </h3>
          {block.risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No risks in filtered rows.</p>
          ) : (
            <ul className="space-y-2">
              {block.risks.map((risk) => (
                <LinkedRiskItem key={`${block.productRequirement}-${displayValue(risk.riskLine)}`} risk={risk} />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby={`pr-${block.productRequirement}-center`}
          className="min-w-0 rounded-lg border border-primary/20 bg-primary/[0.03] p-4 lg:px-5"
        >
          <h3 id={`pr-${block.productRequirement}-center`} className="sr-only">
            Product requirement {block.productRequirement}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-sm">
              {displayValue(block.productRequirement)}
            </Badge>
            {block.projects.map((project) => (
              <Badge key={project} variant="secondary">
                {project}
              </Badge>
            ))}
          </div>
          {block.riskScopes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {block.riskScopes.map((scope) => (
                <Badge key={scope} variant="outline" className="max-w-full whitespace-normal text-left text-[10px] font-normal">
                  {scope}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
            {displayValue(block.requirementText)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {block.rowCount} explorer row{block.rowCount === 1 ? "" : "s"} for this PR under current filters
          </p>
        </section>

        <section aria-labelledby={`pr-${block.productRequirement}-protocols`} className="min-w-0 space-y-2">
          <h3
            id={`pr-${block.productRequirement}-protocols`}
            className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Linked protocols ({block.protocols.length})
          </h3>
          {block.protocols.length === 0 ? (
            <p className="text-sm text-muted-foreground">No protocols in filtered rows.</p>
          ) : (
            <ul className="space-y-2">
              {block.protocols.map((protocol) => (
                <LinkedProtocolItem
                  key={`${block.productRequirement}-${displayValue(protocol.protocol)}`}
                  protocol={protocol}
                />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export function Her2RiskDashboard() {
  const [dataset, setDataset] = useState<Her2ExplorerDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Her2ExplorerFilters>(EMPTY_HER2_FILTERS);
  const [viewMode, setViewMode] = useState<Her2ViewMode>("byPr");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/her2-explorer.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Missing dataset (${res.status}). Run npm run her2:export.`);
        const json = (await res.json()) as Her2ExplorerDataset;
        if (!cancelled) {
          setDataset(json);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load HER2 data");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(() => {
    if (!dataset) return { riskSources: [], riskScopes: [] };
    return {
      riskSources: uniqueSorted(dataset.rows.map((r) => r.RiskSource)),
      riskScopes: uniqueSorted(dataset.rows.map((r) => r.RiskScope)),
    };
  }, [dataset]);

  const filteredRows = useMemo(
    () => (dataset ? filterHer2ExplorerRows(dataset.rows, filters) : []),
    [dataset, filters],
  );

  const prBlocks = useMemo(
    () => groupHer2ExplorerRowsByProductRequirement(filteredRows),
    [filteredRows],
  );

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>HER2 data not loaded</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{loadError}</p>
          <p className="text-sm">
            Refresh from the workbook:{" "}
            <code className="rounded bg-muted px-1 py-0.5">npm run her2:export</code>
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (!dataset) {
    return <p className="text-sm text-muted-foreground">Loading HER2 Explorer data…</p>;
  }

  const rmwFamilies: RmwFamily[] = ["euRMW", "dRMW"];

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Explorer sheet · {dataset.rowCount} rows · exported {new Date(dataset.generatedAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                RMW family
              </Label>
              <div className="flex flex-wrap gap-3">
                {rmwFamilies.map((family) => (
                  <label key={family} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.rmwFamilies.includes(family)}
                      onCheckedChange={() =>
                        setFilters((f) => ({ ...f, rmwFamilies: toggleRmwFamily(f.rmwFamilies, family) }))
                      }
                    />
                    {family}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Matches <span className="font-medium">RiskSource</span> (euRMW / dRMW) or{" "}
                <span className="font-medium">RiskLine</span> prefix.
              </p>
            </div>
            <MultiCheckboxFilter
              label="RiskSource (workbook doc)"
              options={filterOptions.riskSources}
              selected={filters.riskSources}
              onChange={(riskSources) => setFilters((f) => ({ ...f, riskSources }))}
            />
          </div>
          <MultiCheckboxFilter
            label="RiskScope"
            options={filterOptions.riskScopes}
            selected={filters.riskScopes}
            onChange={(riskScopes) => setFilters((f) => ({ ...f, riskScopes }))}
          />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</Label>
              <Select
                value={filters.project}
                onValueChange={(value) => setFilters((f) => ({ ...f, project: value as ProjectFilter }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="DP52 / DP61" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  <SelectItem value="DP52">DP52</SelectItem>
                  <SelectItem value="DP61">DP61</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="her2-search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </Label>
              <Input
                id="her2-search"
                placeholder="Risk line, summary, PR, protocol…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">View</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Result layout">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "byPr" ? "default" : "outline"}
                  onClick={() => setViewMode("byPr")}
                >
                  By PR
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "allRows" ? "default" : "outline"}
                  onClick={() => setViewMode("allRows")}
                >
                  All rows
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {viewMode === "byPr" ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-foreground">{prBlocks.length}</span> PR block
                  {prBlocks.length === 1 ? "" : "s"} (
                  <span className="font-medium text-foreground">{filteredRows.length}</span> rows)
                </>
              ) : (
                <>
                  Showing <span className="font-medium text-foreground">{filteredRows.length}</span> of{" "}
                  {dataset.rowCount} rows
                </>
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFilters(EMPTY_HER2_FILTERS)}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No rows match the current filters.
          </p>
        ) : viewMode === "byPr" ? (
          prBlocks.map((block) => (
            <ProductRequirementHubBlock key={block.productRequirement} block={block} />
          ))
        ) : (
          filteredRows.map((row) => (
            <RiskCard key={`${row.RiskLine}-${row.Protocol}-${row.ProductRequirement}-${row.RiskSummary}`} row={row} />
          ))
        )}
      </div>
    </div>
  );
}
