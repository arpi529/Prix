"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  severity: string;
  image_url?: string;
  status: string;
  email?: string;
  created_at?: string;
};

const ADMIN_ID = "arpithimanshu277";
const ADMIN_PASS = "290306ar";

const getStoredComplaints = (): Complaint[] => {
  try {
    const data = localStorage.getItem("safehost-complaints");
    return data ? (JSON.parse(data) as Complaint[]) : [];
  } catch {
    return [];
  }
};

const saveStoredComplaints = (items: Complaint[]) => {
  localStorage.setItem("safehost-complaints", JSON.stringify(items));
};

export default function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchAllComplaints = async () => {
    if (!isSupabaseConfigured) {
      setComplaints(getStoredComplaints());
      return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setComplaints([]);
      return;
    }

    setComplaints((data as Complaint[]) ?? []);
  };

  useEffect(() => {
    const sessionValue = sessionStorage.getItem("safehost-admin");
    if (sessionValue === "true") {
      setIsLoggedIn(true);
    }
    void fetchAllComplaints();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      void fetchAllComplaints();
    }
  }, [isLoggedIn]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (username === ADMIN_ID && password === ADMIN_PASS) {
      sessionStorage.setItem("safehost-admin", "true");
      setIsLoggedIn(true);
      setStatusMessage("Admin login successful.");
      return;
    }

    setStatusMessage("Invalid admin credentials.");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("safehost-admin");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  const markResolved = async (id: string) => {
    if (!isSupabaseConfigured) {
      const items = getStoredComplaints().map((item) =>
        item.id === id ? { ...item, status: "Resolved" } : item,
      );
      saveStoredComplaints(items);
      setComplaints(items);
      return;
    }

    const { error } = await supabase.from("complaints").update({ status: "Resolved" }).eq("id", id);
    if (!error) {
      setComplaints((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "Resolved" } : item)),
      );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="page-shell">
        <header className="topbar">
          <Link href="/dashboard" className="brand-link">
            <p className="eyebrow">Hostel Complaint Tracker</p>
            <h1>SafeHost Campus</h1>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/dashboard" className="nav-link">Student portal</Link>
            <Link href="/admin" className="nav-link nav-admin active" aria-current="page">Admin</Link>
          </nav>
        </header>
        <div className="complaint-form" style={{ maxWidth: 500, margin: "80px auto" }}>
          <h3>Admin Login</h3>
          <form onSubmit={handleLogin}>
            <div className="field-group">
              <label htmlFor="admin-id">Admin ID</label>
              <input
                id="admin-id"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="arpithimanshu277"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="admin-pass">Password</label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>

            {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

            <button className="primary-button" type="submit">
              Login as admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link href="/dashboard" className="brand-link">
          <p className="eyebrow">Administration</p>
          <h1>Hostel admin dashboard</h1>
        </Link>

        <nav className="main-nav" aria-label="Admin navigation">
          <Link href="/dashboard" className="nav-link">Student portal</Link>
          <a href="#all-complaints" className="nav-link active" aria-current="page">Complaints</a>
          <button className="nav-link nav-admin" type="button" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main className="dashboard-layout">
        <section className="complaints-panel" id="all-complaints">
          <h3>All hostel complaints</h3>
          {complaints.length === 0 ? (
            <p className="empty-state">No complaints have been filed yet.</p>
          ) : (
            <div className="complaint-list">
              {complaints.map((complaint) => (
                <article key={complaint.id} className="complaint-item">
                  <div className="complaint-head">
                    <h4>{complaint.title}</h4>
                    <span className={`badge ${complaint.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <p>{complaint.description}</p>
                  <div className="meta-row">
                    <span>{complaint.email}</span>
                    <span>{complaint.category}</span>
                    <span>{complaint.location}</span>
                    <span>{complaint.severity}</span>
                  </div>

                  {complaint.image_url ? (
                    <img className="thumbnail" src={complaint.image_url} alt={complaint.title} />
                  ) : null}

                  {complaint.status !== "Resolved" ? (
                    <div style={{ marginTop: 14 }}>
                      <button className="primary-button" type="button" onClick={() => void markResolved(complaint.id)}>
                        Mark as resolved
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
