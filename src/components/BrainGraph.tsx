"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import type { BrainNode, BrainEdge, BrainGraph } from "@/lib/graph-types";
import { DOMAIN_COLORS, STATUS_COLORS, NODE_SIZE } from "@/lib/graph-types";
import { MOCK_GRAPH, ALERTS } from "@/lib/mock-graph-data";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface SimNode extends BrainNode, d3.SimulationNodeDatum {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  relationship: string;
  strength: number;
}

function getNodeRadius(node: BrainNode): number {
  if (node.type === "center") return NODE_SIZE.center;
  if (node.type === "domain") {
    // Scale domain nodes by urgency (reflects child alert count)
    const base = NODE_SIZE.domain;
    return base + node.urgency * 8; // 20-28 range
  }
  const range = NODE_SIZE[node.type] || NODE_SIZE.entity;
  if (typeof range === "number") return range;
  return range.min + (range.max - range.min) * node.urgency;
}

function getNodeColor(node: BrainNode): string {
  if (node.type === "center") return "#ffffff";
  if (node.type === "domain") return DOMAIN_COLORS[node.domain] || "#64748b";
  return STATUS_COLORS[node.status] || "#64748b";
}

function getNodeOpacity(node: BrainNode): number {
  return 0.4 + 0.6 * node.freshness;
}

export default function BrainGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<BrainNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const toggleDomain = useCallback((domainId: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }, []);

  const zoomToNode = useCallback((nodeId: string) => {
    if (!svgRef.current || !zoomRef.current) return;
    const node = simNodesRef.current.find(n => n.id === nodeId);
    if (!node || node.x === undefined || node.y === undefined) return;
    const svg = d3.select(svgRef.current);
    const sidebarWidth = 350;
    const graphWidth = dimensions.width - 320 - sidebarWidth;
    svg.transition().duration(750).call(
      zoomRef.current.transform,
      d3.zoomIdentity
        .translate(graphWidth / 2, dimensions.height / 2)
        .scale(1.5)
        .translate(-node.x, -node.y)
    );
  }, [dimensions]);

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const leftPanelWidth = 320;
    const sidebarWidth = selectedNode ? 350 : 0;
    const graphWidth = width - leftPanelWidth - sidebarWidth;

    // Filter nodes based on expanded domains — collapsed = center + domains only
    const visibleNodes = MOCK_GRAPH.nodes.filter((n) => {
      if (n.type === "center" || n.type === "domain") return true;
      // Show entity if its parent domain is expanded
      const parentDomain = MOCK_GRAPH.nodes.find(
        d => d.type === "domain" && d.children?.includes(n.id)
      );
      return parentDomain ? expandedDomains.has(parentDomain.id) : false;
    });
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = MOCK_GRAPH.edges.filter(
      e => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    // Deep copy for D3 mutation
    const nodes: SimNode[] = visibleNodes.map((n) => ({ ...n }));
    const edges: SimEdge[] = visibleEdges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.id)
          .distance((d) => {
            if (d.relationship === "domain") return 120;
            if (d.relationship === "contains") return 60;
            return 150; // cross-domain
          })
          .strength((d) => d.strength * 0.5)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(graphWidth / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) => getNodeRadius(d) + 4)
      )
      .force(
        "cluster",
        d3.forceRadial<SimNode>(
          (d) => {
            if (d.type === "center") return 0;
            if (d.type === "domain") return 140;
            return 220;
          },
          graphWidth / 2,
          height / 2
        ).strength(0.3)
      );

    // Container with zoom
    const g = svg
      .append("g")
      .attr("class", "graph-container");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;
    simNodesRef.current = nodes;

    // Glow filter for pulsing nodes
    const defs = svg.append("defs");
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw edges
    const link = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", (d) =>
        d.relationship === "related_to" || d.relationship === "lawsuit" || d.relationship === "legal_for"
          ? "#6366f140"
          : "#334155"
      )
      .attr("stroke-width", (d) =>
        d.relationship === "domain" ? 1.5 : d.relationship === "contains" ? 1 : 0.5
      )
      .attr("stroke-dasharray", (d) =>
        d.relationship !== "domain" && d.relationship !== "contains"
          ? "4,4"
          : "none"
      );

    // Draw nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => getNodeRadius(d))
      .attr("fill", (d) => getNodeColor(d))
      .attr("opacity", (d) => getNodeOpacity(d))
      .attr("stroke", (d) =>
        d.status === "critical" ? STATUS_COLORS.critical : "transparent"
      )
      .attr("stroke-width", (d) => (d.status === "critical" ? 2 : 0))
      .attr("filter", (d) =>
        d.status === "critical" || d.type === "center" ? "url(#glow)" : "none"
      );

    // Pulse animation for critical nodes
    node
      .filter((d) => d.status === "critical")
      .append("circle")
      .attr("r", (d) => getNodeRadius(d))
      .attr("fill", "none")
      .attr("stroke", STATUS_COLORS.critical)
      .attr("stroke-width", 1)
      .attr("opacity", 0.6)
      .each(function pulse() {
        d3.select(this)
          .transition()
          .duration(1500)
          .attr("r", (d) => getNodeRadius(d as BrainNode) + 8)
          .attr("opacity", 0)
          .transition()
          .duration(0)
          .attr("r", (d) => getNodeRadius(d as BrainNode))
          .attr("opacity", 0.6)
          .on("end", pulse);
      });

    // Node labels
    node
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getNodeRadius(d) + 14)
      .attr("fill", "#94a3b8")
      .attr("font-size", (d) => {
        if (d.type === "center") return "14px";
        if (d.type === "domain") return "12px";
        return "9px";
      })
      .attr("font-weight", (d) =>
        d.type === "center" || d.type === "domain" ? "600" : "400"
      )
      .attr("font-family", "system-ui, -apple-system, sans-serif");

    // Interactions
    node
      .on("click", (_event, d) => {
        if (d.type === "domain") {
          toggleDomain(d.id);
        }
        setSelectedNode((prev) => (prev?.id === d.id ? null : d));
      })
      .on("mouseenter", (_event, d) => {
        setHoveredNode(d);
        // Highlight connected edges
        link
          .attr("stroke-opacity", (l) => {
            const src = typeof l.source === "object" ? (l.source as SimNode).id : l.source;
            const tgt = typeof l.target === "object" ? (l.target as SimNode).id : l.target;
            return src === d.id || tgt === d.id ? 1 : 0.15;
          })
          .attr("stroke-width", (l) => {
            const src = typeof l.source === "object" ? (l.source as SimNode).id : l.source;
            const tgt = typeof l.target === "object" ? (l.target as SimNode).id : l.target;
            return src === d.id || tgt === d.id ? 2.5 : 0.5;
          });
        // Dim non-connected nodes
        node.select("circle").attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const connected = edges.some((e) => {
            const src = typeof e.source === "object" ? (e.source as SimNode).id : e.source;
            const tgt = typeof e.target === "object" ? (e.target as SimNode).id : e.target;
            return (src === d.id && tgt === n.id) || (tgt === d.id && src === n.id);
          });
          return connected ? getNodeOpacity(n) : 0.15;
        });
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
        link
          .attr("stroke-opacity", 1)
          .attr("stroke-width", (d) =>
            d.relationship === "domain" ? 1.5 : d.relationship === "contains" ? 1 : 0.5
          );
        node.select("circle").attr("opacity", (d) => getNodeOpacity(d));
      });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [dimensions, selectedNode, expandedDomains]);

  const activeNode = selectedNode || hoveredNode;

  // Domain summaries for glance panel
  const domainNodes = MOCK_GRAPH.nodes.filter(n => n.type === "domain");
  const criticalAlerts = ALERTS.filter(a => a.priority === "critical");
  const highAlerts = ALERTS.filter(a => a.priority === "high");

  return (
    <div className="relative w-full h-screen bg-[#0a0e1a] overflow-hidden flex flex-col md:flex-row">
      {/* LEFT: Glance Panel */}
      <div className="w-full md:w-[320px] max-h-[50vh] md:max-h-full md:h-full bg-[#0f1425] border-b md:border-b-0 md:border-r border-[#1e293b] overflow-y-auto shrink-0 z-20">
        <div className="p-4">
          {/* Branding */}
          <div className="mb-4">
            <div className="text-[10px] tracking-[3px] text-[#6366f1] uppercase">
              Open Brain
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
              ABE
            </h1>
            <div className="text-[10px] text-[#475569] mt-1">
              {MOCK_GRAPH.metadata.nodeCount} data points · {MOCK_GRAPH.metadata.criticalCount} critical
            </div>
          </div>

          {/* What's On Fire */}
          {criticalAlerts.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] text-[#ef4444] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle size={11} /> Needs Action Now
              </div>
              {criticalAlerts.map((alert, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const node = MOCK_GRAPH.nodes.find(n => n.id === alert.nodeId);
                    if (node) { setSelectedNode(node); zoomToNode(alert.nodeId); }
                  }}
                  className="w-full text-left mb-1.5 px-3 py-2 rounded-lg border-none cursor-pointer transition-all hover:brightness-125"
                  style={{ background: "rgba(239,68,68,0.1)", borderLeft: "3px solid #ef4444" }}
                >
                  <div className="text-[12px] text-[#fca5a5] font-medium">{alert.text}</div>
                  <div className="text-[9px] text-[#64748b] mt-0.5">{alert.domain}</div>
                </button>
              ))}
            </div>
          )}

          {/* High Priority */}
          {highAlerts.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] text-[#f59e0b] uppercase tracking-wider font-semibold mb-2">
                Attention Needed
              </div>
              {highAlerts.map((alert, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const node = MOCK_GRAPH.nodes.find(n => n.id === alert.nodeId);
                    if (node) { setSelectedNode(node); zoomToNode(alert.nodeId); }
                  }}
                  className="w-full text-left mb-1.5 px-3 py-2 rounded-lg border-none cursor-pointer transition-all hover:brightness-125"
                  style={{ background: "rgba(245,158,11,0.06)", borderLeft: "3px solid #f59e0b" }}
                >
                  <div className="text-[12px] text-[#fbbf24] font-medium">{alert.text}</div>
                  <div className="text-[9px] text-[#64748b] mt-0.5">{alert.domain}</div>
                </button>
              ))}
            </div>
          )}

          {/* Domain Summary Cards */}
          <div className="mb-4">
            <div className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-2">
              Life Domains
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {domainNodes.map(domain => {
                const childCount = MOCK_GRAPH.nodes.filter(
                  n => n.type === "entity" && n.domain === domain.domain
                ).length;
                const alertCount = MOCK_GRAPH.nodes.filter(
                  n => n.domain === domain.domain && (n.status === "critical" || n.status === "attention")
                ).length;
                const color = DOMAIN_COLORS[domain.domain] || "#64748b";
                return (
                  <button
                    key={domain.id}
                    onClick={() => {
                      setSelectedNode(domain);
                      zoomToNode(domain.id);
                    }}
                    className="text-left p-2.5 rounded-lg border-none cursor-pointer transition-all hover:brightness-125"
                    style={{ background: `${color}10`, border: `1px solid ${color}20` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: STATUS_COLORS[domain.status] || color,
                          boxShadow: domain.status === "critical" ? `0 0 6px ${STATUS_COLORS.critical}` : "none",
                        }}
                      />
                      {alertCount > 0 && (
                        <span className="text-[9px] font-bold" style={{ color: STATUS_COLORS[domain.status] || color }}>
                          {alertCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-[#e2e8f0]">
                      {domain.label}
                    </div>
                    <div className="text-[9px] text-[#64748b]">
                      {childCount} items
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick tip */}
          <div className="text-[9px] text-[#334155] text-center mt-4">
            Click any item to explore in the graph →
          </div>
        </div>
      </div>

      {/* RIGHT: Graph Area */}
      <div className="flex-1 relative">

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#0f172a90] backdrop-blur rounded-lg p-3">
        <div className="text-[9px] text-[#64748b] uppercase tracking-wider mb-2">
          Domains
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(DOMAIN_COLORS)
            .filter(([k]) => k !== "center")
            .map(([domain, color]) => (
              <div key={domain} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[10px] text-[#94a3b8] capitalize">
                  {domain}
                </span>
              </div>
            ))}
        </div>
        <div className="text-[9px] text-[#64748b] uppercase tracking-wider mt-3 mb-1">
          Status
        </div>
        <div className="flex gap-3">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: color }}
              />
              <span className="text-[9px] text-[#94a3b8] capitalize">
                {status}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[8px] text-[#475569] mt-2">
          Scroll to zoom · Drag nodes · Click for details
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width - 320 - (selectedNode ? 350 : 0)}
        height={dimensions.height}
        className="transition-all duration-300"
      />

      {/* Detail Sidebar */}
      {selectedNode && (
        <div className="absolute top-0 right-0 w-[350px] h-full bg-[#0f172a] border-l border-[#1e293b] z-20 overflow-y-auto animate-fadeIn">
          <div className="p-5">
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[#6366f1] text-xs cursor-pointer bg-transparent border-none mb-4"
            >
              ← Close
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `${DOMAIN_COLORS[selectedNode.domain]}20`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: getNodeColor(selectedNode),
                    boxShadow: `0 0 8px ${getNodeColor(selectedNode)}60`,
                  }}
                />
              </div>
              <div>
                <div className="text-base font-semibold text-[#e2e8f0]">
                  {selectedNode.label}
                </div>
                <div className="text-[11px] text-[#94a3b8] capitalize">
                  {selectedNode.domain} · {selectedNode.status}
                </div>
              </div>
            </div>
            <div className="bg-[#1e1e2e] rounded-xl p-3 mb-4 border border-[#334155]">
              <div className="text-[13px] text-[#94a3b8] leading-relaxed">
                {selectedNode.summary}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#64748b]">Urgency</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#334155] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedNode.urgency * 100}%`,
                        background:
                          selectedNode.urgency > 0.7
                            ? "#ef4444"
                            : selectedNode.urgency > 0.4
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    />
                  </div>
                  <span className="text-[#94a3b8]">
                    {Math.round(selectedNode.urgency * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#64748b]">Data Freshness</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#334155] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6366f1]"
                      style={{
                        width: `${selectedNode.freshness * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[#94a3b8]">
                    {Math.round(selectedNode.freshness * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Connected nodes */}
            <div className="mt-5">
              <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">
                Connected To
              </div>
              {MOCK_GRAPH.edges
                .filter(
                  (e) =>
                    e.source === selectedNode.id ||
                    e.target === selectedNode.id
                )
                .map((e) => {
                  const otherId =
                    e.source === selectedNode.id ? e.target : e.source;
                  const otherNode = MOCK_GRAPH.nodes.find(
                    (n) => n.id === otherId
                  );
                  if (!otherNode) return null;
                  return (
                    <div
                      key={otherId}
                      onClick={() => setSelectedNode(otherNode)}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#1e293b] cursor-pointer transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            DOMAIN_COLORS[otherNode.domain] || "#64748b",
                        }}
                      />
                      <span className="text-[12px] text-[#e2e8f0]">
                        {otherNode.label}
                      </span>
                      <span className="text-[9px] text-[#475569] ml-auto">
                        {e.relationship}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip for hovered node */}
      {hoveredNode && !selectedNode && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 bg-[#1e1e2e] border border-[#334155] rounded-lg px-4 py-2 pointer-events-none">
          <div className="text-[13px] font-semibold text-[#e2e8f0]">
            {hoveredNode.label}
          </div>
          <div className="text-[11px] text-[#94a3b8]">
            {hoveredNode.summary}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
      </div>{/* end graph area */}
    </div>
  );
}
