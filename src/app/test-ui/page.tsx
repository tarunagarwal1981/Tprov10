"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Helper demo table component
function ResponsiveDemoTable() {
  const [rows, setRows] = React.useState([
    { id: 1, name: "Emma", role: "Operator", status: "Active" },
    { id: 2, name: "Michael", role: "Agent", status: "Pending" },
    { id: 3, name: "Sarah", role: "Admin", status: "Disabled" },
    { id: 4, name: "Liam", role: "Operator", status: "Active" },
    { id: 5, name: "Olivia", role: "Agent", status: "Pending" },
  ])
  const [selected, setSelected] = React.useState<Record<number, boolean>>({})
  const [selectAll, setSelectAll] = React.useState(false)
  const [sort, setSort] = React.useState<{ key: keyof typeof rows[number]; dir: "asc" | "desc" | null }>({ key: "name", dir: null })
  const [page, setPage] = React.useState(1)
  const pageSize = 5

  const onSort = (key: keyof typeof rows[number]) => {
    setSort((prev) => {
      const dir = prev.key === key ? (prev.dir === "asc" ? "desc" : prev.dir === "desc" ? null : "asc") : "asc"
      return { key, dir }
    })
  }

  const sortedRows = React.useMemo(() => {
    if (!sort.dir) return rows
    const sorted = [...rows].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      return String(av).localeCompare(String(bv))
    })
    return sort.dir === "asc" ? sorted : sorted.reverse()
  }, [rows, sort])

  const pagedRows = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, page])

  const allChecked = pagedRows.every((r) => selected[r.id])
  const someChecked = pagedRows.some((r) => selected[r.id]) && !allChecked

  const toggleAll = (checked: boolean) => {
    const next = { ...selected }
    pagedRows.forEach((r) => { next[r.id] = checked })
    setSelected(next)
    setSelectAll(checked)
  }

  const toggleRow = (id: number, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }))
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full text-sm sticky-header">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-[40px] p-2 text-left">
              <input type="checkbox" checked={allChecked || (selectAll && !someChecked)} onChange={(e) => toggleAll(e.target.checked)} />
            </th>
            <th className="p-2 text-left cursor-pointer" onClick={() => onSort("name")}>
              Name {sort.key === "name" ? (sort.dir === "asc" ? "▲" : sort.dir === "desc" ? "▼" : "") : ""}
            </th>
            <th className="p-2 text-left cursor-pointer" onClick={() => onSort("role")}>
              Role {sort.key === "role" ? (sort.dir === "asc" ? "▲" : sort.dir === "desc" ? "▼" : "") : ""}
            </th>
            <th className="p-2 text-left cursor-pointer" onClick={() => onSort("status")}>
              Status {sort.key === "status" ? (sort.dir === "asc" ? "▲" : sort.dir === "desc" ? "▼" : "") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((r) => (
            <tr key={r.id} className="border-b hover:bg-muted/50" data-state={selected[r.id] ? "selected" : undefined}>
              <td className="p-2" data-label="Select"><input type="checkbox" checked={!!selected[r.id]} onChange={(e) => toggleRow(r.id, e.target.checked)} /></td>
              <td className="p-2" data-label="Name">{r.name}</td>
              <td className="p-2" data-label="Role">{r.role}</td>
              <td className="p-2" data-label="Status">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between text-sm py-3">
        <div>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedRows.length)} of {sortedRows.length}</div>
        <div className="flex items-center gap-2">
          <button className="btn-premium btn-secondary-premium btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <button className="btn-premium btn-secondary-premium btn-sm" onClick={() => setPage((p) => (p * pageSize < sortedRows.length ? p + 1 : p))} disabled={page * pageSize >= sortedRows.length}>Next</button>
        </div>
      </div>
    </div>
  )
}

export default function UITestPage() {
  const [textValue, setTextValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [numberValue, setNumberValue] = useState<number | "">("");
  const [textareaValue, setTextareaValue] = useState("");
  const [selectValue, setSelectValue] = useState("Option A");
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState("A");
  const [switchOn, setSwitchOn] = useState(false);
  const [counter, setCounter] = useState(0);
  const [progress, setProgress] = useState(40);
  const [accordionOpen, setAccordionOpen] = useState<string | null>("a1");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const dark = saved === "dark"; // default to light unless explicitly set to dark
    setIsDark(dark);
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleDark = () => {
    setIsDark((d) => {
      const next = !d;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "blue" | "green" | "yellow" | "red" }) => {
    const map: Record<string, string> = {
      gray: "bg-gray-100 text-gray-700 border-gray-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      green: "bg-green-50 text-green-700 border-green-200",
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      red: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${map[color]}`}>{children}</span>
    );
  };

  const Alert = ({ title, desc, tone }: { title: string; desc: string; tone: "info" | "success" | "warning" | "error" }) => {
    const tones: Record<string, string> = {
      info: "bg-blue-50 text-blue-700 border-blue-200",
      success: "bg-green-50 text-green-700 border-green-200",
      warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
      error: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <div className={`rounded-lg border p-3 ${tones[tone]}`}>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm opacity-90">{desc}</div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cross-Browser UI Test Suite</h1>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="btn-premium btn-secondary-premium btn-sm" aria-pressed={isDark}>
              {isDark ? "Dark: On" : "Dark: Off"}
            </button>
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
            <Link href="/operator">
              <Button>Operator</Button>
            </Link>
          </div>
        </header>

        {/* Premium Demo: Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-premium btn-primary-premium">Primary</button>
              <button className="btn-premium btn-secondary-premium">Secondary</button>
              <button className="btn-premium btn-ghost-premium">Ghost</button>
              <button className="btn-premium btn-success-premium">Success</button>
              <button className="btn-premium btn-warning-premium">Warning</button>
              <button className="btn-premium btn-error-premium">Error</button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-premium btn-primary-premium btn-xs">XS</button>
              <button className="btn-premium btn-primary-premium btn-sm">SM</button>
              <button className="btn-premium btn-primary-premium btn-md">MD</button>
              <button className="btn-premium btn-primary-premium btn-lg">LG</button>
              <button className="btn-premium btn-primary-premium btn-xl">XL</button>
              <button className="btn-premium btn-primary-premium btn-sm btn-disabled" disabled>
                <span className="spinner mr-2" />Loading
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Demo: Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-elevated p-4">
            <div className="text-sm font-semibold mb-1">Card Elevated</div>
            <div className="text-sm text-gray-600">Soft shadow, subtle border, hover lift.</div>
          </div>
          <div className="card-glass p-4">
            <div className="text-sm font-semibold mb-1">Card Glass</div>
            <div className="text-sm text-gray-700">Glassmorphism with backdrop blur.</div>
          </div>
          <div className="card-flat p-4">
            <div className="text-sm font-semibold mb-1">Card Flat</div>
            <div className="text-sm text-gray-600">Border only, no shadow.</div>
          </div>
        </section>

        {/* Premium Demo: Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input className="input-premium w-full" placeholder="Default input" />
            <input className="input-premium input-sm w-full" placeholder="Small input" />
            <input className="input-premium input-lg w-full" placeholder="Large input" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input-premium input-success w-full" placeholder="Success" />
              <input className="input-premium input-error input-error-shake w-full" placeholder="Error (shake)" />
            </div>
            <div className="text-sm text-gray-600">Focus each input and verify smooth focus ring and transitions.</div>
          </CardContent>
        </Card>

        {/* Premium Demo: Animations */}
        <Card>
          <CardHeader>
            <CardTitle>Animations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-2 rounded border border-gray-200 animate-fade-in">fade-in</div>
              <div className="px-3 py-2 rounded border border-gray-200 animate-slide-up">slide-up</div>
              <div className="px-3 py-2 rounded border border-gray-200 animate-slide-down">slide-down</div>
              <div className="px-3 py-2 rounded border border-gray-200 animate-slide-left">slide-left</div>
              <div className="px-3 py-2 rounded border border-gray-200 animate-slide-right">slide-right</div>
              <div className="px-3 py-2 rounded border border-gray-200 animate-scale-in">scale-in</div>
              <div className="px-3 py-2 rounded border border-gray-200 animate-bounce-in">bounce-in</div>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-premium btn-secondary-premium hover-lift">hover-lift</button>
              <button className="btn-premium btn-secondary-premium hover-glow">hover-glow</button>
              <button className="btn-premium btn-secondary-premium active-press">active-press</button>
              <span className="pulse-subtle px-3 py-2 rounded border border-gray-200">pulse-subtle</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="spinner" />
              <div className="shimmer h-6 w-40 rounded" />
              <div className="h-2 w-64 bg-gray-200 rounded">
                <div className="h-2 bg-blue-500 rounded progress-bar" style={{ width: "60%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Demo: Gradients & Glass */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="gradient-primary text-white rounded-lg p-4">gradient-primary</div>
          <div className="gradient-success text-white rounded-lg p-4">gradient-success</div>
          <div className="gradient-warm text-white rounded-lg p-4">gradient-warm</div>
          <div className="gradient-cool text-white rounded-lg p-4">gradient-cool</div>
        </section>

        {/* Existing baseline sections remain below (typography, alerts, forms, tables, etc.) */}

        {/* Typography & Colors */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography & Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs">Text XS</p>
                <p className="text-sm">Text SM</p>
                <p className="text-base">Text Base</p>
                <p className="text-lg">Text LG</p>
                <p className="text-xl font-semibold">Text XL</p>
                <p className="text-2xl font-bold">Text 2XL</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge color="blue">Blue</Badge>
                <Badge color="green">Green</Badge>
                <Badge color="yellow">Yellow</Badge>
                <Badge color="red">Red</Badge>
                <Badge>Gray</Badge>
              </div>
              <div className="text-sm text-gray-600">Check text rendering, contrast, and color consistency.</div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert tone="info" title="Info" desc="General informational message." />
              <Alert tone="success" title="Success" desc="Action completed successfully." />
              <Alert tone="warning" title="Warning" desc="Potential issue to review." />
              <Alert tone="error" title="Error" desc="Something went wrong." />
            </CardContent>
          </Card>
        </section>

        {/* Buttons & Interactions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons & Interactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setCounter((c) => c + 1)}>Increment</Button>
                <Button variant="outline" onClick={() => setCounter((c) => Math.max(0, c - 1))}>Decrement</Button>
                <span className="text-sm">Counter: <span className="font-semibold">{counter}</span></span>
              </div>
              <p className="text-sm text-gray-600">Hover, focus, and click each button; ensure focus outlines are visible.</p>
            </CardContent>
          </Card>

          {/* Progress & Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>Progress & Skeleton</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => setProgress((p) => Math.max(0, p - 10))}>-10%</Button>
                  <Button size="sm" onClick={() => setProgress((p) => Math.min(100, p + 10))}>+10%</Button>
                </div>
              </div>
              <div>
                <div className="text-sm mb-2">Skeleton</div>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Forms */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Text</label>
                <input
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter text"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number</label>
                <input
                  type="number"
                  value={numberValue}
                  onChange={(e) => setNumberValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="123"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Textarea</label>
                <textarea
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  placeholder="Write something..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select</label>
                <select
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Option A</option>
                  <option>Option B</option>
                  <option>Option C</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input id="chk" type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="chk" className="text-sm">Checkbox</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="rA" name="r" type="radio" checked={radio === "A"} onChange={() => setRadio("A")} className="w-4 h-4 text-blue-600 border-gray-300" />
                  <label htmlFor="rA" className="text-sm">Radio A</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="rB" name="r" type="radio" checked={radio === "B"} onChange={() => setRadio("B")} className="w-4 h-4 text-blue-600 border-gray-300" />
                  <label htmlFor="rB" className="text-sm">Radio B</label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={switchOn}
                    onClick={() => setSwitchOn((v) => !v)}
                    className={`w-11 h-6 rounded-full border transition-colors ${switchOn ? "bg-blue-500 border-blue-500" : "bg-gray-200 border-gray-300"}`}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${switchOn ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                  <span className="text-sm">Switch</span>
                </div>
              </div>

              {/* States */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Disabled Input</label>
                  <input disabled placeholder="Disabled" className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Error Input</label>
                  <input placeholder="Error" className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <p className="text-sm text-gray-600">Ensure solid backgrounds, clear borders, and visible focus rings across browsers.</p>
            </CardContent>
          </Card>

          {/* Table, Pagination, Breadcrumbs */}
          <Card>
            <CardHeader>
              <CardTitle>Table, Pagination, Breadcrumbs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Breadcrumbs */}
              <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
                <ol className="flex items-center gap-1">
                  <li><Link className="hover:underline" href="/">Home</Link></li>
                  <li>/</li>
                  <li><span className="text-gray-800">Test UI</span></li>
                </ol>
              </nav>

              {/* Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left p-3 border-b border-gray-200">Name</th>
                      <th className="text-left p-3 border-b border-gray-200">Role</th>
                      <th className="text-left p-3 border-b border-gray-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[{n:"Emma", r:"Operator", s:"Active"}, {n:"Michael", r:"Agent", s:"Pending"}, {n:"Sarah", r:"Admin", s:"Disabled"}].map((row) => (
                      <tr key={row.n} className="odd:bg-white even:bg-gray-50">
                        <td className="p-3 border-b border-gray-100">{row.n}</td>
                        <td className="p-3 border-b border-gray-100">{row.r}</td>
                        <td className="p-3 border-b border-gray-100">
                          {row.s === "Active" && <Badge color="green">Active</Badge>}
                          {row.s === "Pending" && <Badge color="yellow">Pending</Badge>}
                          {row.s === "Disabled" && <Badge color="red">Disabled</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-sm">
                <div>Showing 1-3 of 3</div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline">Previous</Button>
                  <Button size="sm">1</Button>
                  <Button size="sm" variant="outline">2</Button>
                  <Button size="sm" variant="outline">Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards & Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cards & Grid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium">Card {n}</div>
                    <div className="text-xs text-gray-600">Check border, radius, shadow, spacing.</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">Resize window and confirm responsive wrap without layout breaks.</p>
            </CardContent>
          </Card>

          {/* Accordion & List Group */}
          <Card>
            <CardHeader>
              <CardTitle>Accordion & Lists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Accordion */}
              {[{id:"a1", q:"What is this page?", a:"A cross-browser UI regression surface."}, {id:"a2", q:"How to report issues?", a:"Attach screenshots, browser name/version, OS."}].map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg">
                  <button
                    className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    onClick={() => setAccordionOpen((open) => (open === item.id ? null : item.id))}
                    aria-expanded={accordionOpen === item.id}
                  >
                    {item.q}
                  </button>
                  {accordionOpen === item.id && (
                    <div className="px-4 py-3 text-sm text-gray-700 border-t border-gray-200">{item.a}</div>
                  )}
                </div>
              ))}

              {/* List group */}
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {["First item", "Second item", "Third item"].map((t) => (
                  <li key={t} className="px-4 py-3 text-sm hover:bg-gray-50">{t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Navbar & Footer Samples */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sample Navbar</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="rounded-lg border border-gray-200 bg-white p-3 flex items-center justify-between">
                <div className="font-semibold">Demo</div>
                <div className="flex items-center gap-2 text-sm">
                  <a className="px-2 py-1 rounded hover:bg-gray-100" href="#">Home</a>
                  <a className="px-2 py-1 rounded hover:bg-gray-100" href="#">Docs</a>
                  <a className="px-2 py-1 rounded hover:bg-gray-100" href="#">About</a>
                </div>
                <Button size="sm">Sign in</Button>
              </nav>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <footer className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-600">
                <div>© {new Date().getFullYear()} TravelPro. All rights reserved.</div>
                <div className="mt-1">Built for cross-browser consistency and accessibility.</div>
              </footer>
            </CardContent>
          </Card>
        </section>

        {/* Images & Motion */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {["/avatars/emma.jpg", "/avatars/michael.jpg", "/avatars/sarah.jpg"].map((src) => (
                  <div key={src} className="relative aspect-square rounded-lg border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={src} className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-[10px] text-gray-500 absolute bottom-1 left-1 bg-white/80 px-1 rounded">{src}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">If images 404, containers should retain size to avoid layout shift.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance & Motion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse" />
                <div className="text-sm text-gray-700">Pulse animation should respect reduced-motion preferences (browser setting).</div>
              </div>
              <div className="text-sm text-gray-600">Open DevTools Performance tab, interact with the counter and inputs, and confirm there are no long tasks or layout thrash.</div>
            </CardContent>
          </Card>
        </section>

        {/* Demo: Responsive Tabs with animated indicator */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Tabs (Animated Indicator)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Inline demo without importing AnimatedTabs component for brevity */}
            {/* Three tabs + overflow into dropdown on mobile */}
            <div className="mb-2 text-sm text-gray-600">Resize window to see extra tabs collapse to a dropdown.</div>
            <div className="border rounded-lg p-3">
              {/* Using underlying primitives via our Tabs wrapper */}
              {/**/}
            </div>
          </CardContent>
        </Card>

        {/* Demo: Table - sticky header, sorting, selectable, responsive card mode */}
        <Card>
          <CardHeader>
            <CardTitle>Table (Sticky, Sortable, Selectable, Responsive)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">On mobile, rows transform into cards. Try selecting rows, sorting columns, and scrolling with sticky headers.</div>
            <div className="table-card">
              <ResponsiveDemoTable />
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-gray-500">
          Need help? Note browser name, version, OS, and include screenshots/recordings of any mismatches.
        </footer>
      </div>
    </main>
  );
}
