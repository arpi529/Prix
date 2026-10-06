"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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

type LoginMode = "login" | "register";

const initialForm = {
  title: "",
  category: "Infrastructure",
  location: "Block A",
  severity: "Medium",
  description: "",
  image_url: "",
};

const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: "demo-1",
    title: "Broken socket in corridor",
    description: "Two sockets in the corridor are damaged and risk electrical issues.",
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

const isValidEmail = (value: string) => /^[^\s@]+@gmail\.com$/i.test(value);

const getStoredComplaints = (): Complaint[] => {
  try {
    const list = localStorage.getItem("safehost-complaints");
    return list ? (JSON.parse(list) as Complaint[]) : [...DEMO_COMPLAINTS];
  } catch {
    return [...DEMO_COMPLAINTS];
  }
};

const saveStoredComplaints = (items: Complaint[]) => {
  localStorage.setItem("safehost-complaints", JSON.stringify(items));
};

export default function HostelComplaintDashboard() {
  const [mode, setMode] = useState<LoginMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>(DEMO_COMPLAINTS);
  const [formData, setFormData] = useState(initialForm);

  const fetchComplaints = async (currentEmail: string) => {
    if (!isSupabaseConfigured) {
      const localComplaints = getStoredComplaints().filter(
        (item) => item.email?.toLowerCase() === currentEmail.toLowerCase(),
      );
      setComplaints(localComplaints.length ? localComplaints : getStoredComplaints());
      return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("email", currentEmail)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setComplaints([]);
      return;
    }

    setComplaints((data as Complaint[]) ?? []);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("safehost-user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      void fetchComplaints(parsedUser.email);
      return;
    }

    if (isSupabaseConfigured) {
      const getSession = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          if (session.user.email) {
            await fetchComplaints(session.user.email);
          }
        }
      };

      void getSession();
    }
  }, []);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setStatusMessage("");
    setCanResendConfirmation(false);

    if (!isValidEmail(normalizedEmail)) {
      setStatusMessage("Use a valid Gmail address ending in @gmail.com.");
      return;
    }
    setEmail(normalizedEmail);

    if (password.trim().length < 6) {
      setStatusMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!isSupabaseConfigured) {
      const storedUsers = JSON.parse(localStorage.getItem("safehost-users") ?? "[]");

      if (mode === "register") {
        const exists = storedUsers.some((item: any) => item.email.toLowerCase() === normalizedEmail);
        if (exists) {
          setStatusMessage("This email is already registered. Please log in instead.");
          return;
        }

        const newUser = {
          id: `local-${Date.now()}`,
          email: normalizedEmail,
          full_name: name.trim() || normalizedEmail,
        };

        storedUsers.push(newUser);
        localStorage.setItem("safehost-users", JSON.stringify(storedUsers));
        localStorage.setItem("safehost-user", JSON.stringify(newUser));
        localStorage.setItem("safehost-passwords", JSON.stringify({
          ...JSON.parse(localStorage.getItem("safehost-passwords") ?? "{}"),
          [normalizedEmail]: password,
        }));
        setUser(newUser);
        setStatusMessage("Registration successful. You can now submit complaints.");
        void fetchComplaints(normalizedEmail);
        return;
      }

      const savedPasswords = JSON.parse(localStorage.getItem("safehost-passwords") ?? "{}");
      const userPassword = savedPasswords[normalizedEmail];

      if (!userPassword || userPassword !== password) {
        setStatusMessage("Invalid email or password. Please try again.");
        return;
      }

      const foundUser = storedUsers.find((item: any) => item.email.toLowerCase() === normalizedEmail);
      const loggedInUser = foundUser || { id: `local-${Date.now()}`, email: normalizedEmail, full_name: name || normalizedEmail };
      localStorage.setItem("safehost-user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setStatusMessage("Login successful.");
      void fetchComplaints(normalizedEmail);
      return;
    }

    setIsAuthSubmitting(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session && data.user) {
          setUser(data.user);
          setStatusMessage("Registration successful. You are now logged in.");
          if (data.user.email) void fetchComplaints(data.user.email);
        } else {
          setMode("login");
          setCanResendConfirmation(true);
          setStatusMessage("Account created. Confirm your email using the link we sent before logging in.");
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        if ("code" in error && error.code === "email_not_confirmed") {
          setCanResendConfirmation(true);
          setStatusMessage("Confirm your email using the link we sent. You can resend the confirmation below.");
        } else {
          setStatusMessage(error.message);
        }
        return;
      }

      const loggedInUser = data.user;
      setUser(loggedInUser);
      setStatusMessage("Login successful.");
      if (loggedInUser.email) void fetchComplaints(loggedInUser.email);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setStatusMessage("Enter your Gmail address above before requesting another confirmation email.");
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: window.location.origin },
      });

      if (error) throw error;
      setStatusMessage("Confirmation email sent. Check your inbox and spam folder.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not resend the confirmation email.");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem("safehost-user");
    setUser(null);
    setComplaints([]);
    setStatusMessage("You have been logged out.");
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        image_url: String(reader.result ?? ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadComplaintImage = async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { data, error } = await supabase.storage.from("complaints").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw new Error(error.message);

    const { data: publicUrlData } = supabase.storage.from("complaints").getPublicUrl(data?.path ?? fileName);
    return publicUrlData.publicUrl ?? null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatusMessage("Please log in first before submitting a complaint.");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl: string | null = formData.image_url;

      if (formData.image_url && formData.image_url.startsWith("data:image")) {
        const fileInput = document.getElementById("image") as HTMLInputElement | null;
        const file = fileInput?.files?.[0];
        if (file) {
          uploadedImageUrl = await uploadComplaintImage(file);
        }
      }

      const complaintRecord: Complaint = {
        id: `complaint-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        severity: formData.severity,
        image_url: uploadedImageUrl ?? undefined,
        status: "Open",
        email: user.email ?? email,
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        const items = getStoredComplaints();
        const updated = [complaintRecord, ...items];
        saveStoredComplaints(updated);
        setComplaints([complaintRecord, ...items]);
        setFormData(initialForm);
        setStatusMessage("Complaint submitted successfully.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: complaintRecord.title,
        description: complaintRecord.description,
        category: complaintRecord.category,
        location: complaintRecord.location,
        severity: complaintRecord.severity,
        image_url: complaintRecord.image_url ?? "",
        email: user.email,
        status: "Open",
        created_at: complaintRecord.created_at,
        user_id: user.id,
        full_name: user.user_metadata?.full_name ?? user.email,
      };

      const { data, error } = await supabase.from("complaints").insert([payload]).select();
      if (error) throw new Error(error.message);

      const savedComplaint = (data?.[0] as Complaint) ?? complaintRecord;
      setComplaints((current) => [savedComplaint, ...current]);
      setFormData(initialForm);
      setStatusMessage("Complaint submitted successfully. Administration will review it soon.");
      setIsSubmitting(false);
    } catch (error: any) {
      setStatusMessage(error.message || "There was a problem submitting your complaint.");
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: complaints.length,
    open: complaints.filter((item) => item.status === "Open").length,
    resolved: complaints.filter((item) => item.status === "Resolved").length,
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link href="/dashboard" className="brand-link" aria-label="SafeHost Campus home">
          <p className="eyebrow">Hostel Complaint Tracker</p>
          <h1>SafeHost Campus</h1>
        </Link>

        {!user ? (
          <nav className="main-nav" aria-label="Main navigation">
            <button className={mode === "login" ? "nav-link active" : "nav-link"} type="button" onClick={() => { setMode("login"); setStatusMessage(""); setCanResendConfirmation(false); }}>
              Student login
            </button>
            <button className={mode === "register" ? "nav-link active" : "nav-link"} type="button" onClick={() => { setMode("register"); setStatusMessage(""); setCanResendConfirmation(false); }}>
              Register
            </button>
            <Link href="/admin" className="nav-link nav-admin">Admin</Link>
          </nav>
        ) : (
          <>
            <nav className="main-nav" aria-label="Student navigation">
              <a className="nav-link active" href="#overview">Overview</a>
              <a className="nav-link" href="#new-complaint">New complaint</a>
              <a className="nav-link" href="#my-reports">My reports</a>
              <Link href="/admin" className="nav-link nav-admin">Admin</Link>
            </nav>
            <div className="user-row">
            <span>{user.email ?? email}</span>
            <button className="secondary-button" onClick={handleLogout}>
              Logout
            </button>
            </div>
          </>
        )}
      </header>

      {!user ? (
        <main className="hero-panel auth-panel">
          <section className="hero-copy">
            <p className="eyebrow accent">Report issues without fear</p>
            <h2>Students deserve cleaner, safer hostels.</h2>
            <p>
              Submit maintenance issues, broken fixtures, hygiene problems, and safety concerns with
              text and photo proof.
            </p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => { setMode("login"); setStatusMessage(""); setCanResendConfirmation(false); }}>
                Student login
              </button>
              <button className="ghost-button" type="button" onClick={() => { setMode("register"); setStatusMessage(""); setCanResendConfirmation(false); }}>
                Student register
              </button>
            </div>
          </section>

          <section className="feature-card">
            <h3>Quick access</h3>
            <form className="auth-form" onSubmit={handleAuth}>
              {mode === "register" ? (
                <div className="field-group">
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              ) : null}

              <div className="field-group">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  pattern="[^\s@]+@gmail\.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@gmail.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {statusMessage ? (
                <p className={`status-message auth-status ${/success|created|confirm your email|check your inbox|check your email/i.test(statusMessage) ? "success" : "error"}`}>
                  {statusMessage}
                </p>
              ) : null}

              {canResendConfirmation && isSupabaseConfigured ? (
                <button className="secondary-button auth-resend" type="button" onClick={() => void handleResendConfirmation()} disabled={isAuthSubmitting}>
                  Resend confirmation email
                </button>
              ) : null}

              <button className="primary-button" type="submit" disabled={isAuthSubmitting}>
                {isAuthSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </form>
          </section>
        </main>
      ) : (
        <main className="dashboard-layout">
          <section className="dashboard-header" id="overview">
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
            <form className="complaint-form" id="new-complaint" onSubmit={handleSubmit}>
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

            <aside className="complaints-panel" id="my-reports">
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
    </div>
  );
}
