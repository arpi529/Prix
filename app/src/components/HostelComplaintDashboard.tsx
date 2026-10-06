"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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

const initialForm = {
  title: "",
  category: "Infrastructure",
  location: "Block A",
  severity: "Medium",
  description: "",
  image_url: "",
};

const demoComplaints: Complaint[] = [
  {
    id: "demo-1",
    title: "Broken socket in corridor",
    description: "Two sockets in the first-floor corridor are damaged and risk electrical issues.",
    category: "Infrastructure",
    location: "Block A - First Floor",
    severity: "High",
    status: "Open",
    email: "student@example.com",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Unhygienic washroom",
    description: "The washroom floor remains dirty and the taps keep leaking after 9 PM.",
    category: "Hygiene",
    location: "Block B",
    severity: "Medium",
    status: "In Review",
    email: "student@example.com",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function HostelComplaintDashboard() {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>(demoComplaints);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      if (session?.user?.email) {
        await fetchComplaints(session.user.email);
      }
    };

    getSession();
  }, []);

  const fetchComplaints = async (email: string) => {
    if (!isSupabaseConfigured) {
      setComplaints(demoComplaints);
      return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setComplaints([]);
      return;
    }

    setComplaints((data as Complaint[]) ?? []);
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setStatusMessage("Add your Supabase credentials to enable Google sign-in.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setStatusMessage(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setComplaints([]);
    setStatusMessage("You have been logged out.");
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        image_url: String(reader.result ?? ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!user) {
      setStatusMessage("Please sign in before submitting a complaint.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      severity: formData.severity,
      image_url: formData.image_url,
      email: user.email,
      status: "Open",
      created_at: new Date().toISOString(),
      user_id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email,
    };

    if (!isSupabaseConfigured) {
      const demoEntry: Complaint = {
        id: `demo-${Date.now()}`,
        ...payload,
      };
      setComplaints((current) => [demoEntry, ...current]);
      setFormData(initialForm);
      setStatusMessage("Demo complaint saved locally. Connect Supabase to store it in the database.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.from("complaints").insert([payload]).select();

    if (error) {
      setStatusMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    const savedComplaint = (data?.[0] as Complaint) ?? payload;
    setComplaints((current) => [savedComplaint, ...current]);
    setFormData(initialForm);
    setStatusMessage("Complaint submitted successfully. Administration will review it soon.");
    setIsSubmitting(false);
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter((item) => item.status === "Open").length,
    resolved: complaints.filter((item) => item.status === "Resolved").length,
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Hostel Complaint Tracker</p>
          <h1>SafeHost Campus</h1>
        </div>

        {!user ? (
          <button className="primary-button" onClick={handleGoogleLogin}>
            Continue with Google
          </button>
        ) : (
          <div className="user-row">
            <span>{user.email}</span>
            <button className="secondary-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {!user ? (
        <main className="hero-panel">
          <section className="hero-copy">
            <p className="eyebrow accent">Report issues without shame</p>
            <h2>Students deserve a cleaner, safer, better-managed hostel.</h2>
            <p>
              Capture broken sockets, unhygienic corridors, leaking taps, maintenance issues,
              and management concerns in one secure place.
            </p>
            <div className="cta-row">
              <button className="primary-button" onClick={handleGoogleLogin}>
                Register / Login
              </button>
              <a href="/dashboard" className="ghost-button">
                Go to dashboard
              </a>
            </div>
          </section>

          <section className="feature-card">
            <h3>What this platform solves</h3>
            <ul>
              <li>Anonymous-friendly reporting</li>
              <li>Photo evidence for infrastructure issues</li>
              <li>Clear tracking instead of forgotten complaints</li>
              <li>Accountability for management staff</li>
            </ul>
          </section>
        </main>
      ) : (
        <main className="dashboard-layout">
          <section className="dashboard-header">
            <div>
              <p className="eyebrow accent">Student dashboard</p>
              <h2>My complaints</h2>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-card">
              <span>Open</span>
              <strong>{stats.open}</strong>
            </div>
            <div className="stat-card">
              <span>Resolved</span>
              <strong>{stats.resolved}</strong>
            </div>
          </section>

          <section className="complaint-grid">
            <form className="complaint-form" onSubmit={handleSubmit}>
              <h3>Register a new complaint</h3>

              <div className="field-group">
                <label htmlFor="title">Issue title</label>
                <input
                  id="title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Damaged pipe in washroom"
                  required
                />
              </div>

              <div className="two-column">
                <div className="field-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                  >
                    <option>Infrastructure</option>
                    <option>Hygiene</option>
                    <option>Safety</option>
                    <option>Management</option>
                    <option>Electrical</option>
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="severity">Severity</label>
                  <select
                    id="severity"
                    value={formData.severity}
                    onChange={(event) => setFormData({ ...formData, severity: event.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="location">Hostel / location</label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                  placeholder="Block C / Floor 2"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows={5}
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Explain the problem clearly, including where and when it happened."
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="image">Upload image</label>
                <input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              </div>

              {formData.image_url ? (
                <img className="preview-image" src={formData.image_url} alt="Complaint preview" />
              ) : null}

              {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit complaint"}
              </button>
            </form>

            <aside className="complaints-panel">
              <h3>Recent reports</h3>
              {complaints.length === 0 ? (
                <p className="empty-state">No complaints yet. Your latest reports will appear here.</p>
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
                        <span>{complaint.category}</span>
                        <span>{complaint.location}</span>
                      </div>
                      {complaint.image_url ? (
                        <img className="thumbnail" src={complaint.image_url} alt={complaint.title} />
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </section>
        </main>
      )}

      {isAuthLoading ? <div className="loader">Checking session...</div> : null}
    </div>
  );
}
