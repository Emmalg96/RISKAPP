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
  rowRmwFamily,
  toggleMultiValue,
  toggleRmwFamily,
  uniqueSorted,
  type Her2ExplorerDataset,
  type Her2ExplorerFilters,
  type Her2ExplorerRow,
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

export function Her2RiskDashboard() {
  const [dataset, setDataset] = useState<Her2ExplorerDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Her2ExplorerFilters>(EMPTY_HER2_FILTERS);

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
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredRows.length}</span> of{" "}
              {dataset.rowCount}
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
        ) : (
          filteredRows.map((row) => (
            <RiskCard key={`${row.RiskLine}-${row.Protocol}-${row.ProductRequirement}-${row.RiskSummary}`} row={row} />
          ))
        )}
      </div>
    </div>
  );
}
