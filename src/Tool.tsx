// Moneydate: a 20-minute monthly money meeting for couples, with an agenda built from their own numbers.
import { useEffect, useState } from "react";
import { moneyFmt } from "./lib/money";
import { uid, useStored } from "./lib/store";
import { todayISO } from "./lib/time";
import { CurrencySelect, Section, Stat, Stats } from "./ui/kit";

const T = "moneydate";
type Cat = { id: string; name: string; plan: number; actual: number };
type Goal = { id: string; name: string; target: number; saved: number; by: string };
type Upcoming = { id: string; what: string; amount: number; when: string };
type Meeting = { month: string; notes: string; decisions: string[]; mood: number };

export default function Moneydate() {
  const [names, setNames] = useStored(T, "names", { a: "Sami", b: "Leila" });
  const [cur, setCur] = useStored(T, "cur", "TND");
  const [income, setIncome] = useStored(T, "income", 5000);
  const [cats, setCats] = useStored<Cat[]>(T, "cats", [
    { id: "c1", name: "Rent", plan: 1200, actual: 1200 }, { id: "c2", name: "Groceries", plan: 700, actual: 842 }, { id: "c3", name: "Transport", plan: 300, actual: 260 },
    { id: "c4", name: "Eating out", plan: 250, actual: 410 }, { id: "c5", name: "Bills", plan: 350, actual: 338 }, { id: "c6", name: "Fun money", plan: 400, actual: 380 },
  ]);
  const [goals, setGoals] = useStored<Goal[]>(T, "goals", [{ id: "g1", name: "Emergency fund", target: 15000, saved: 9200, by: "2027-06-01" }, { id: "g2", name: "Summer trip", target: 4000, saved: 1500, by: "2027-07-01" }]);
  const [upcoming, setUpcoming] = useStored<Upcoming[]>(T, "upcoming", [{ id: "u1", what: "Car insurance renewal", amount: 960, when: "Next month" }, { id: "u2", what: "Nour's school fees", amount: 1800, when: "In 2 months" }]);
  const [history, setHistory] = useStored<Meeting[]>(T, "history", []);
  const [month] = useState(todayISO().slice(0, 7));
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [mood, setMood] = useState(3);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const money = moneyFmt(cur);
  useEffect(() => { if (!running) return; const id = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(id); }, [running]);

  const spent = cats.reduce((a, c) => a + c.actual, 0), planned = cats.reduce((a, c) => a + c.plan, 0);
  const left = income - spent;
  const over = cats.filter(c => c.actual > c.plan * 1.05).sort((a, b) => (b.actual - b.plan) - (a.actual - a.plan));
  const under = cats.filter(c => c.actual < c.plan * 0.95);
  const monthsTo = (d: string) => Math.max(1, Math.round((new Date(d).getTime() - Date.now()) / 2.63e9));
  const agenda = [
    { title: "Start with a win", mins: 2, body: under.length ? `You spent less than planned on ${under.map(c => c.name.toLowerCase()).join(", ")}. ${left > 0 ? `${money(left)} is left over this month.` : ""}` : left > 0 ? `${money(left)} is left over this month.` : "Name one thing that went well with money this month." },
    { title: "Where it went over", mins: 5, body: over.length ? over.map(c => `${c.name}: ${money(c.actual)} against ${money(c.plan)} planned (${money(c.actual - c.plan)} over).`).join(" ") + " Why, and is the plan or the spending wrong?" : "Nothing went over plan. Nice." },
    { title: "Goals", mins: 5, body: goals.map(g => `${g.name}: ${Math.round((g.saved / g.target) * 100)}% there, needs ${money(Math.max(0, g.target - g.saved) / monthsTo(g.by))} a month to hit it on time.`).join(" ") },
    { title: "Coming up", mins: 4, body: upcoming.length ? upcoming.map(u => `${u.what}, ${money(u.amount)}, ${u.when.toLowerCase()}.`).join(" ") + " Do we have it set aside?" : "Anything big coming in the next three months?" },
    { title: "Decide and close", mins: 4, body: "Agree on one or two changes for next month. Then each say one thing you appreciate about how the other handles money." },
  ];
  const finish = () => { setHistory([{ month, notes, decisions, mood }, ...history.filter(h => h.month !== month)]); setRunning(false); };
  const setCat = (id: string, p: Partial<Cat>) => setCats(cats.map(c => (c.id === id ? { ...c, ...p } : c)));

  return (
    <div className="stack">
      <Section title={`${names.a} and ${names.b}, ${new Date(month + "-15").toLocaleDateString(undefined, { month: "long", year: "numeric" })}`} aside={<CurrencySelect id="md-cur" value={cur} onChange={setCur} />}>
        <Stats><Stat value={money(income)} label="Came in" /><Stat value={money(spent)} label="Went out" /><Stat value={money(left)} label={left >= 0 ? "Left over" : "Short"} tone={left >= 0 ? "good" : "bad"} /><Stat value={money(planned - spent)} label="Vs plan" tone={planned >= spent ? "good" : "bad"} /></Stats>
      </Section>

      <section className="panel md-meet">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>This month's money date</h2>
          <div className="row" style={{ alignItems: "center" }}><span className="md-clock num">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} / 20:00</span><button className="btn primary small" onClick={() => setRunning(!running)}>{running ? "Pause" : secs ? "Resume" : "Start the timer"}</button></div>
        </div>
        <ol className="md-agenda">{agenda.map((a, i) => (
          <li key={i} className={i === step ? "on" : i < step ? "done" : ""} onClick={() => setStep(i)}>
            <div className="row" style={{ justifyContent: "space-between" }}><strong>{a.title}</strong><span className="note">{a.mins} min</span></div>
            {i === step && <p style={{ marginTop: 6 }}>{a.body}</p>}
          </li>
        ))}</ol>
        <div className="row"><button className="btn small" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button className="btn small" disabled={step === agenda.length - 1} onClick={() => setStep(step + 1)}>Next topic</button></div>
        <div className="grid2" style={{ marginTop: 16 }}>
          <label className="field"><span>Notes</span><textarea id="md-notes" className="input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          <div className="stack" style={{ gap: 8 }}>
            <form className="row" onSubmit={e => { e.preventDefault(); if (decision.trim()) { setDecisions([...decisions, decision.trim()]); setDecision(""); } }}><label className="field"><span>We decided</span><input id="md-dec" className="input" value={decision} onChange={e => setDecision(e.target.value)} placeholder="Eating out capped at 300 next month" /></label><button className="btn small" type="submit" style={{ alignSelf: "flex-end" }}>Add</button></form>
            <ul style={{ margin: 0, paddingLeft: 18 }}>{decisions.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <div className="field"><span>How did that feel? (1 tense, 5 great)</span><div className="row" style={{ gap: 6 }}>{[1, 2, 3, 4, 5].map(n => <button key={n} className="btn small" aria-pressed={mood === n} style={mood === n ? { background: "var(--ink)", color: "var(--bg)" } : undefined} onClick={() => setMood(n)}>{n}</button>)}</div></div>
            <button className="btn primary" style={{ alignSelf: "flex-start" }} onClick={finish}>Save this money date</button>
          </div>
        </div>
      </section>

      <div className="grid2">
        <Section title="Spending vs plan">
          <div className="table-wrap"><table className="t"><thead><tr><th>Category</th><th className="r">Plan</th><th className="r">Actual</th><th /></tr></thead>
            <tbody>{cats.map(c => <tr key={c.id}><td><input className="input" aria-label="Category" value={c.name} onChange={e => setCat(c.id, { name: e.target.value })} /></td><td><input className="input num" style={{ width: 90 }} aria-label="Plan" value={c.plan} onChange={e => setCat(c.id, { plan: parseFloat(e.target.value) || 0 })} /></td><td><input className="input num" style={{ width: 90, color: c.actual > c.plan * 1.05 ? "var(--bad)" : undefined }} aria-label="Actual" value={c.actual} onChange={e => setCat(c.id, { actual: parseFloat(e.target.value) || 0 })} /></td><td><button className="btn ghost small danger" onClick={() => setCats(cats.filter(x => x.id !== c.id))}>×</button></td></tr>)}</tbody></table></div>
          <div className="row" style={{ marginTop: 10 }}><button className="btn small" onClick={() => setCats([...cats, { id: uid(), name: "New category", plan: 0, actual: 0 }])}>Add a category</button><label className="field" style={{ flex: "0 0 160px" }}><span>Income this month</span><input id="md-inc" className="input num" value={income} onChange={e => setIncome(parseFloat(e.target.value) || 0)} /></label></div>
        </Section>
        <div className="stack">
          <Section title="Goals">
            {goals.map(g => <div key={g.id} className="md-goal"><div className="row" style={{ justifyContent: "space-between" }}><input className="input" style={{ flex: 1 }} aria-label="Goal" value={g.name} onChange={e => setGoals(goals.map(x => x.id === g.id ? { ...x, name: e.target.value } : x))} /><button className="btn ghost small danger" onClick={() => setGoals(goals.filter(x => x.id !== g.id))}>×</button></div>
              <div className="md-bar"><span style={{ width: `${Math.min(100, (g.saved / g.target) * 100)}%` }} /></div>
              <div className="row"><label className="field"><span>Saved</span><input className="input num" value={g.saved} onChange={e => setGoals(goals.map(x => x.id === g.id ? { ...x, saved: parseFloat(e.target.value) || 0 } : x))} /></label><label className="field"><span>Target</span><input className="input num" value={g.target} onChange={e => setGoals(goals.map(x => x.id === g.id ? { ...x, target: parseFloat(e.target.value) || 0 } : x))} /></label><label className="field"><span>By</span><input type="date" className="input" value={g.by} onChange={e => setGoals(goals.map(x => x.id === g.id ? { ...x, by: e.target.value } : x))} /></label></div></div>)}
            <button className="btn small" onClick={() => setGoals([...goals, { id: uid(), name: "New goal", target: 1000, saved: 0, by: `${new Date().getFullYear() + 1}-01-01` }])}>Add a goal</button>
          </Section>
          <Section title="Coming up">
            {upcoming.map(u => <div key={u.id} className="row" style={{ marginBottom: 6 }}><input className="input" style={{ flex: 2 }} aria-label="What" value={u.what} onChange={e => setUpcoming(upcoming.map(x => x.id === u.id ? { ...x, what: e.target.value } : x))} /><input className="input num" style={{ flex: 1 }} aria-label="Amount" value={u.amount} onChange={e => setUpcoming(upcoming.map(x => x.id === u.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))} /><input className="input" style={{ flex: 1 }} aria-label="When" value={u.when} onChange={e => setUpcoming(upcoming.map(x => x.id === u.id ? { ...x, when: e.target.value } : x))} /><button className="btn ghost small danger" onClick={() => setUpcoming(upcoming.filter(x => x.id !== u.id))}>×</button></div>)}
            <button className="btn small" onClick={() => setUpcoming([...upcoming, { id: uid(), what: "", amount: 0, when: "Next month" }])}>Add</button>
          </Section>
        </div>
      </div>
      <Section title="Past money dates">
        <div className="row" style={{ marginBottom: 12 }}><label className="field"><span>Partner one</span><input id="md-a" className="input" value={names.a} onChange={e => setNames({ ...names, a: e.target.value })} /></label><label className="field"><span>Partner two</span><input id="md-b" className="input" value={names.b} onChange={e => setNames({ ...names, b: e.target.value })} /></label></div>
        {history.length === 0 ? <p className="empty-note">Saved money dates appear here, with what you decided.</p> : history.map(h => <div key={h.month} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}><strong>{h.month}</strong> <span className="pill">feeling {h.mood}/5</span>{h.decisions.length > 0 && <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{h.decisions.map((x, i) => <li key={i}>{x}</li>)}</ul>}</div>)}
      </Section>
      <style>{`.md-meet{border-top:6px solid var(--accent)}.md-clock{font-family:var(--mono);font-size:18px}.md-agenda{list-style:none;padding:0;margin:16px 0;display:grid;gap:8px;counter-reset:a}
      .md-agenda li{padding:12px 14px;border-radius:10px;background:var(--sunk);cursor:pointer}.md-agenda li.on{background:var(--surface);box-shadow:inset 0 0 0 2px var(--accent)}.md-agenda li.done{opacity:.55}
      .md-goal{display:grid;gap:6px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line)}.md-bar{height:10px;background:var(--sunk);border-radius:5px;overflow:hidden}.md-bar span{display:block;height:100%;background:var(--good)}`}</style>
    </div>
  );
}
