import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const calcGrowth = (start, monthly, rate, years) => {
  const data = [];
  let balance = start;
  for (let y = 0; y <= years; y++) {
    data.push({ year: `Yr ${y}`, value: Math.round(balance) });
    for (let m = 0; m < 12; m++) balance = balance * (1 + rate / 100 / 12) + monthly;
  }
  return data;
};
const SEED = [
  { id: 1, ticker: "VOO",  name: "Vanguard S&P 500",   price: 512.4,  change: 1.2,  type: "stock"  },
  { id: 2, ticker: "QQQ",  name: "Invesco Nasdaq 100", price: 448.9,  change: 2.1,  type: "stock"  },
  { id: 3, ticker: "NVDA", name: "Nvidia",              price: 875.3,  change: 3.4,  type: "stock"  },
  { id: 4, ticker: "BTC",  name: "Bitcoin",             price: 68200,  change: -1.8, type: "crypto" },
  { id: 5, ticker: "ETH",  name: "Ethereum",            price: 3540,   change: 0.9,  type: "crypto" },
];
const DEFAULT_CATS = [
  { id: 1, name: "Income",     amount: 0, type: "income"  },
  { id: 2, name: "Rent/Bills", amount: 0, type: "expense" },
  { id: 3, name: "Food",       amount: 0, type: "expense" },
  { id: 4, name: "Investing",  amount: 0, type: "invest"  },
  { id: 5, name: "Fun/Other",  amount: 0, type: "expense" },
];
const G = {
  bg: "#0a0a0f", surface: "#13131f", border: "#1e1e30",
  text: "#e8e8f0", muted: "#555570",
  green: "#00e5a0", blue: "#00b4d8", purple: "#a78bfa", red: "#ff6b6b",
};
function Card({ children, style }) {
  return (
    <div style={{ background: G.surface, borderRadius: 14, border: `1px solid ${G.border}`, padding: 16, ...style }}>
      {children}
    </div>
  );
}
function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 20, border: `1px solid ${active ? G.green : G.border}`,
      background: active ? G.green + "18" : "transparent",
      color: active ? G.green : G.muted,
      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );
}
// ── CALCULATOR ────────────────────────────────────────────────────────────────
function Calculator() {
  const [start,   setStart]   = useState(300);
  const [monthly, setMonthly] = useState(50);
  const [rate,    setRate]    = useState(10);
  const [years,   setYears]   = useState(10);
  const data     = calcGrowth(start, monthly, rate, years);
  const final    = data[data.length - 1].value;
  const invested = start + monthly * 12 * years;
  const profit   = final - invested;
  const Row = ({ label, value, min, max, step, onChange, display }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: G.muted }}>{label}</span>
        <span style={{ fontSize: 13, fontFamily: "monospace", color: G.green, fontWeight: 600 }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: G.green, cursor: "pointer" }} />
    </div>
  );
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <Row label="Starting Amount" value={start} min={0} max={5000} step={50} onChange={setStart} display={fmt(start)} />
        <Row label="Monthly Contribution" value={monthly} min={0} max={500} step={10} onChange={setMonthly} display={fmt(monthly) + "/mo"} />
        <Row label="Annual Return" value={rate} min={1} max={30} step={0.5} onChange={setRate} display={rate + "%"} />
        <Row label="Years" value={years} min={1} max={40} step={1} onChange={setYears} display={years + " yrs"} />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Final Value",  val: fmt(final),    color: G.green  },
          { label: "You Invested", val: fmt(invested), color: G.blue   },
          { label: "Profit",       val: fmt(profit),   color: G.purple },
        ].map(s => (
          <Card key={s.label} style={{ padding: "12px 10px" }}>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
          </Card>
        ))}
      </div>
      <Card>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
            <XAxis dataKey="year" tick={{ fill: G.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, fontSize: 12 }}
              formatter={v => [fmt(v), "Value"]} />
            <Line type="monotone" dataKey="value" stroke={G.green} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <p style={{ fontSize: 11, color: G.muted, textAlign: "center", marginTop: 10 }}>
        Estimates only. Past performance doesn't guarantee future results.
      </p>
    </div>
  );
}
// ── WATCHLIST ─────────────────────────────────────────────────────────────────
function Watchlist() {
  const [list,    setList]   = useState(SEED);
  const [filter,  setFilter] = useState("all");
  const [adding,  setAdding] = useState(false);
  const [newT,    setNewT]   = useState("");
  const [newN,    setNewN]   = useState("");
  const [newP,    setNewP]   = useState("");
  const [newType, setNewType]= useState("stock");
  const visible = filter === "all" ? list : list.filter(i => i.type === filter);
  const addItem = () => {
    if (!newT || !newP) return;
    setList(l => [...l, { id: Date.now(), ticker: newT.toUpperCase(), name: newN || newT, price: parseFloat(newP), change: 0, type: newType }]);
    setNewT(""); setNewN(""); setNewP(""); setAdding(false);
  };
  const removeItem = (id) => setList(l => l.filter(i => i.id !== id));
  const inp = { background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: "9px 12px", color: G.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "stock", "crypto"].map(f => <Pill key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map(item => (
          <Card key={item.id} style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, fontFamily: "monospace",
                background: item.type === "crypto" ? G.purple + "25" : G.blue + "25",
                color: item.type === "crypto" ? G.purple : G.blue,
              }}>{item.ticker.slice(0, 3)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.ticker}</div>
                <div style={{ fontSize: 11, color: G.muted }}>{item.name}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 14 }}>{fmt(item.price)}</div>
                <div style={{ fontSize: 12, color: item.change >= 0 ? G.green : G.red }}>
                  {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change)}%
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: G.muted, cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
            </div>
          </Card>
        ))}
      </div>
      {adding ? (
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <input style={inp} placeholder="Ticker (e.g. AAPL)" value={newT} onChange={e => setNewT(e.target.value)} />
            <input style={inp} placeholder="Name (optional)" value={newN} onChange={e => setNewN(e.target.value)} />
            <input style={inp} placeholder="Price ($)" type="number" value={newP} onChange={e => setNewP(e.target.value)} />
            <select value={newType} onChange={e => setNewType(e.target.value)}
              style={{ ...inp, cursor: "pointer" }}>
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addItem} style={{ flex: 1, padding: 10, border: "none", borderRadius: 8, background: G.green, color: G.bg, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, padding: 10, border: "none", borderRadius: 8, background: G.border, color: G.muted, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          width: "100%", marginTop: 12, padding: 13, border: `1px dashed ${G.border}`,
          borderRadius: 12, background: "transparent", color: G.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
        }}>+ Add to watchlist</button>
      )}
    </div>
  );
}
// ── BUDGET ────────────────────────────────────────────────────────────────────
function Budget() {
  const [cats, setCats] = useState(DEFAULT_CATS);
  const update = (id, val) => setCats(cs => cs.map(c => c.id === id ? { ...c, amount: parseFloat(val) || 0 } : c));
  const income   = cats.filter(c => c.type === "income").reduce((s, c) => s + c.amount, 0);
  const expenses = cats.filter(c => c.type === "expense").reduce((s, c) => s + c.amount, 0);
  const investing= cats.filter(c => c.type === "invest").reduce((s, c) => s + c.amount, 0);
  const left     = income - expenses - investing;
  const typeColor= { income: G.green, expense: G.red, invest: G.purple };
  const inp = { background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: "8px 10px", color: G.text, fontSize: 13, fontFamily: "monospace", textAlign: "right", outline: "none", width: 90 };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Monthly Income",   val: fmt(income),    color: G.green  },
          { label: "Expenses",         val: fmt(expenses),  color: G.red    },
          { label: "Investing",        val: fmt(investing), color: G.purple },
          { label: "Left Over",        val: fmt(left),      color: left >= 0 ? G.blue : G.red },
        ].map(s => (
          <Card key={s.label} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cats.map(cat => (
          <Card key={cat.id} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor[cat.type] }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: typeColor[cat.type] + "20", color: typeColor[cat.type], fontWeight: 600 }}>{cat.type}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: G.muted, fontSize: 13 }}>$</span>
              <input type="number" value={cat.amount || ""} onChange={e => update(cat.id, e.target.value)} placeholder="0" style={inp} />
            </div>
          </Card>
        ))}
      </div>
      {income > 0 && (
        <Card style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: G.green, fontWeight: 700, marginBottom: 6 }}>💡 Quick Insight</div>
          <div style={{ fontSize: 13, color: "#888899", lineHeight: 1.6 }}>
            {investing / income >= 0.2
              ? `You're investing ${Math.round(investing / income * 100)}% of income — great discipline!`
              : investing > 0
              ? `You're investing ${Math.round(investing / income * 100)}% of income. Try to reach 20% for faster growth.`
              : `No investing amount set yet. Even $20–$50/month makes a big difference over time.`}
          </div>
        </Card>
      )}
    </div>
  );
}
// ── MAIN APP ──────────────────────────────────────────────────────────────────
const TABS = ["📈 Calculator", "👀 Watchlist", "💰 Budget"];
export default function App() {
  const [tab, setTab] = useState("📈 Calculator");
  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text, fontFamily: "'DM Sans', sans-serif", paddingBottom: 60 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "32px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${G.green}, ${G.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>$</div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>WealthKit</span>
        </div>
        <p style={{ color: G.muted, fontSize: 13, margin: "0 0 24px" }}>Your personal money dashboard</p>
        <div style={{ display: "flex", gap: 4, background: G.surface, borderRadius: 13, padding: 4, marginBottom: 24, border: `1px solid ${G.border}` }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 9,
              fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? G.green + "20" : "transparent",
              color: tab === t ? G.green : G.muted,
              outline: tab === t ? `1px solid ${G.green}35` : "none",
              transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>
        {tab === "📈 Calculator" && <Calculator />}
        {tab === "👀 Watchlist"  && <Watchlist />}
        {tab === "💰 Budget"     && <Budget />}
      </div>
    </div>
  );
}
