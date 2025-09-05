import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

// Read backend URL from env (Vercel Dashboard → Environment Variables)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ScheduleExamPage() {
  const router = useRouter();
  const { candidate_id } = router.query;

  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Helpful label for header
  const candidateBadge = useMemo(
    () => (candidate_id ? `Candidate #${candidate_id}` : "Missing candidate id"),
    [candidate_id]
  );

  useEffect(() => {
    if (!BACKEND_URL) {
      setErr("NEXT_PUBLIC_BACKEND_URL is not set.");
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!candidate_id) {
      setErr("candidate_id missing in URL.");
      return;
    }
    if (!examDate || !examTime) {
      setErr("Please choose exam date and time.");
      return;
    }
    if (!BACKEND_URL) {
      setErr("Backend URL not configured.");
      return;
    }

    try {
      setLoading(true);

      // POST form-encoded to FastAPI: /schedule-confirm
      const body = new URLSearchParams({
        candidate_id: String(candidate_id),
        exam_date: examDate,
        exam_time: examTime
      });

      const res = await fetch(`${BACKEND_URL}/schedule-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Server ${res.status}: ${txt || "failed"}`);
      }

      // Backend may 303-redirect; fetch won't follow for us to show its page.
      // We keep UX on frontend and show success + link to exam.
      setOk("Exam scheduled successfully. A confirmation email has been sent.");
      // Optional: move to a local success page
      setTimeout(() => router.push("/thanks"), 900);

    } catch (e) {
      setErr(e.message || "Failed to schedule exam.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="badge">{candidateBadge}</div>
      <h1>Schedule Your Exam</h1>
      <p className="lead">
        Pick your preferred date and time. You’ll receive a confirmation email with the exam link.
      </p>

      <form onSubmit={onSubmit}>
        <label htmlFor="date">Exam Date</label>
        <input
          id="date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          required
        />

        <label htmlFor="time">Exam Time</label>
        <input
          id="time"
          type="time"
          value={examTime}
          onChange={(e) => setExamTime(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Scheduling..." : "Schedule Exam"}
        </button>

        {err ? <div className="err">❌ {err}</div> : null}
        {ok ? <div className="ok">✅ {ok}</div> : null}

        <div className="footer">
          Backend: <span className="link">{BACKEND_URL || "(not set)"}</span>
        </div>
      </form>
    </div>
  );
}
