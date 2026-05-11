(() => {
  // CommentsCard.jsx
  var { useState, useEffect, useRef } = React;
  function Svg({ size = 16, className = "", children }) {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className
      },
      children
    );
  }
  var SendIcon = (p) => /* @__PURE__ */ React.createElement(Svg, { ...p }, /* @__PURE__ */ React.createElement("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), /* @__PURE__ */ React.createElement("polygon", { points: "22 2 15 22 11 13 2 9 22 2" }));
  function Bone({ w = "w-full", h = "h-4" }) {
    return /* @__PURE__ */ React.createElement("div", { className: `${w} ${h} rounded bg-gray-200 animate-pulse` });
  }
  function CardSkeleton() {
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4" }, /* @__PURE__ */ React.createElement(Bone, { w: "w-40", h: "h-5" }), /* @__PURE__ */ React.createElement("div", { className: "mt-4 space-y-3" }, [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(Bone, { key: i }))));
  }
  function CommentsCard() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [recordId, setRecordId] = useState(null);
    const commentsScrollRef = useRef(null);
    useEffect(() => {
      ZOHO.embeddedApp.on("PageLoad", function(data) {
        const contactRecordId = data.EntityId;
        setRecordId(contactRecordId);
        fetchComments(contactRecordId);
      });
      ZOHO.embeddedApp.init();
    }, []);
    const fetchComments = (contactRecordId) => {
      ZOHO.CRM.API.getRelatedRecords({
        Entity: "Contacts",
        RecordID: contactRecordId,
        RelatedList: "Notes",
        page: 1,
        per_page: 200
      }).then(function(response) {
        if (response.data && response.data.length > 0) {
          const mappedComments = response.data.map((note) => ({
            id: note.id,
            author: note.Owner && note.Owner.name ? note.Owner.name : note.Title || note.title || note.Note_Title || "Unknown",
            timestamp: formatTimestamp(note.Created_Time),
            text: note.Note_Content || note.Content || note.note_content || note.title || "",
            createdTime: note.Created_Time
          })).sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime));
          setComments(mappedComments);
        } else {
          setComments([]);
        }
        setLoading(false);
      }).catch(function(err) {
        console.error("Failed to load comments:", err);
        setError("Failed to load comments");
        setLoading(false);
      });
    };
    const getUserName = (userResponse) => {
      if (!userResponse) return "Unknown";
      if (userResponse.full_name) return userResponse.full_name;
      const first = userResponse.first_name || "";
      const last = userResponse.last_name || "";
      const combined = (first + " " + last).trim();
      if (combined) return combined;
      if (userResponse.email) return userResponse.email;
      return "Unknown";
    };
    const scrollToLatest = () => {
      if (!commentsScrollRef.current) return;
      commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
    };
    const formatTimestamp = (isoDate) => {
      if (!isoDate) return "";
      const date = new Date(isoDate);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 6e4);
      const diffHours = Math.floor(diffMs / 36e5);
      const diffDays = Math.floor(diffMs / 864e5);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const handlePostComment = () => {
      if (!newComment.trim() || !recordId) return;
      setPosting(true);
      const commentText = newComment;
      ZOHO.CRM.CONFIG.getCurrentUser().then(function(userResponse) {
        const userName = getUserName(userResponse);
        return ZOHO.CRM.API.addNotes({
          Entity: "Contacts",
          RecordID: recordId,
          Title: userName,
          Content: commentText
        }).then(function(response) {
          console.log("Note added:", response);
          return userName;
        });
      }).then(function(userName) {
        const comment = {
          id: Date.now(),
          author: userName,
          timestamp: "just now",
          text: commentText,
          createdTime: (/* @__PURE__ */ new Date()).toISOString()
        };
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        setPosting(false);
        setError(null);
        fetchComments(recordId);
      }).catch(function(err) {
        console.error("Failed to add note:", err);
        setError("Failed to post comment");
        setPosting(false);
      });
    };
    useEffect(() => {
      if (!loading) scrollToLatest();
    }, [comments, loading]);
    if (loading) return /* @__PURE__ */ React.createElement(CardSkeleton, null);
    return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-5 pb-4 flex flex-col h-[480px]" }, /* @__PURE__ */ React.createElement("h2", { className: "text-base font-bold text-gray-900 mb-4" }, "Comments"), error && /* @__PURE__ */ React.createElement("div", { className: "p-3 mb-4 bg-red-50 border border-red-200 rounded-lg" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-red-600" }, error)), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: commentsScrollRef,
        className: "mb-4 flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50"
      },
      comments.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 text-center py-8" }, "No comments yet") : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, comments.map((comment) => /* @__PURE__ */ React.createElement("div", { key: comment.id, className: "pb-3 border-b border-gray-200 last:border-b-0 last:pb-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-gray-600" }, comment.author.charAt(0).toUpperCase())), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-900" }, comment.author), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, comment.timestamp)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700 mt-1 break-words" }, comment.text))))))
    ), /* @__PURE__ */ React.createElement("div", { className: "border-t border-gray-200 pt-4 mt-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: newComment,
        onChange: (e) => setNewComment(e.target.value),
        placeholder: "Add your comment here...",
        className: "flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all",
        rows: "3"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handlePostComment,
        disabled: posting || !newComment.trim(),
        className: "px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-shrink-0 h-fit"
      },
      /* @__PURE__ */ React.createElement(SendIcon, { size: 16 })
    ))));
  }
  window.CommentsCard = CommentsCard;
})();
