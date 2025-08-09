import { useEffect, useState } from "react";
import { useLoggedInUserContext } from "../context/LoggedInUserContext";
import CommentComposer from "./CommentComposer";
import "./Comment.css";

const Comments = () => {
  const { loggedInUser: user, logoutFunc } = useLoggedInUserContext();
  const [refreshCount, setRefreshCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    async function getComments() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("http://127.0.0.1:3000/comment", {
          headers: { Authorization: `Bearer ${user.authToken}` },
          signal: ac.signal,
        });
        if (res.status === 401) {
          setErr("Session expired. Please log in again.");
          if (typeof logoutFunc === "function") logoutFunc();
          return;
        }
        if (!res.ok) {
          setErr("Failed to load comments.");
          return;
        }
        const data = await res.json();
        setComments(Array.isArray(data.comment_list) ? data.comment_list : []);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Network error.");
      } finally {
        setLoading(false);
      }
    }
    getComments();
    return () => ac.abort();
  }, [refreshCount, user.authToken, logoutFunc]);

  return (
    <section id="comment-section">
      {loading && <p className="txt">Loading comments…</p>}
      {err && (
        <p className="txt" style={{ color: "crimson" }}>
          {err}
        </p>
      )}

      {comments.map((comment) => (
        <div className="comment-container" key={comment._id}>
          <p className="usr txt">{comment.user}</p>
          <p className="cmt txt">{String(comment.text ?? "")}</p>
        </div>
      ))}

      <CommentComposer refresh={refreshCount} update={setRefreshCount} />
    </section>
  );
};

export default Comments;
