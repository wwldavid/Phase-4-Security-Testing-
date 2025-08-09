import { useState } from "react";
import { useLoggedInUserContext } from "../context/LoggedInUserContext";

const CommentComposer = ({ refresh, update }) => {
  const [iptxt, setInTxt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { loggedInUser: user, logoutFunc } = useLoggedInUserContext();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = iptxt.trim();
    if (!text) return;
    if (text.length > 500) {
      alert("Comment is too long (max 500).");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:3000/comment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.authToken}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ commenttxt: text }),
      });

      if (response.ok) {
        update(refresh + 1);
        setInTxt("");
      } else if (response.status === 401) {
        alert("Session expired. Please log in again.");
        if (typeof logoutFunc === "function") logoutFunc();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || "Failed to post comment.");
      }
    } catch (error) {
      console.error("Error while posting comment", error);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="composer-div">
      <form onSubmit={handleSubmit}>
        <textarea
          id="composer"
          name="composer-ele"
          maxLength={500}
          rows={5}
          value={iptxt}
          placeholder="Enter your comment"
          onChange={(e) => setInTxt(e.target.value)}
        />
        <div
          className="composer-actions"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="char-count">{iptxt.length}/500</span>
          <input
            className="btn"
            type="submit"
            value={submitting ? "Posting..." : "Post"}
            disabled={submitting || !iptxt.trim()}
          />
        </div>
      </form>
    </div>
  );
};

export default CommentComposer;
