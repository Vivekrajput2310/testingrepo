import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { getProfile, saveProfile, getSuggestions } from "./api";

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const creds = { email, password };
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp(creds);
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "register" && !data.session)
      setMsg("Check your email to confirm your account, then log in.");
  }

  return (
    <form onSubmit={submit} className="card">
      <h1>{mode === "login" ? "Log in" : "Create account"}</h1>
      <label>Email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>Password
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button disabled={busy}>{mode === "login" ? "Log in" : "Register"}</button>
      {msg && <p className="msg">{msg}</p>}
      <p className="switch">
        {mode === "login" ? "New here?" : "Already registered?"}{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); setMsg(""); }}>
          {mode === "login" ? "Create an account" : "Log in"}
        </a>
      </p>
    </form>
  );
}

function ProfilePage({ initial, onSaved }) {
  const [form, setForm] = useState(
    initial || { name: "", education: "", city: "", interests: "" }
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await saveProfile({
        name: form.name, education: form.education, city: form.city, interests: form.interests,
      });
      onSaved();
    } catch (ex) {
      setErr(ex.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card">
      <h1>Your profile</h1>
      <label>Name<input required value={form.name} onChange={set("name")} /></label>
      <label>Education
        <input required placeholder="e.g. B.Tech, Diploma, 12th" value={form.education} onChange={set("education")} />
      </label>
      <label>City<input required value={form.city} onChange={set("city")} /></label>
      <label>Skills / interests
        <textarea required rows={3} placeholder="e.g. web development, python, design" value={form.interests} onChange={set("interests")} />
      </label>
      <button disabled={busy}>Get suggestions</button>
      {err && <p className="msg">{err}</p>}
    </form>
  );
}

function ResultPage({ onEdit }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getSuggestions().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="card"><p className="msg">{err}</p></div>;
  if (!data) return <div className="card">Loading…</div>;

  const Section = ({ title, items }) => (
    <section>
      <h2>{title}</h2>
      <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </section>
  );

  return (
    <div className="card">
      <h1>Your suggestions</h1>
      <Section title="Suggested skills" items={data.skills} />
      <Section title="Next learning steps" items={data.learning_steps} />
      <Section title="General actions" items={data.general} />
      <button className="secondary" onClick={onEdit}>Edit profile</button>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [page, setPage] = useState("loading");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    try {
      const { profile } = await getProfile();
      setProfile(profile);
      setPage(profile ? "result" : "profile");
    } catch {
      setPage("profile");
    }
  }

  useEffect(() => {
    if (session) load();
    else setPage("loading");
  }, [session?.user?.id]);

  if (session === undefined) return null;

  return (
    <main>
      {session && (
        <header>
          <span>{session.user.email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>Log out</button>
        </header>
      )}
      {!session && <AuthPage />}
      {session && page === "loading" && <div className="card">Loading…</div>}
      {session && page === "profile" && <ProfilePage initial={profile} onSaved={load} />}
      {session && page === "result" && <ResultPage onEdit={() => setPage("profile")} />}
    </main>
  );
}
