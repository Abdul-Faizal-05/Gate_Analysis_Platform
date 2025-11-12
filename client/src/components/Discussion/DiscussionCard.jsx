import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './Discussion.css';

const DiscussionCard = ({ discussion, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState(null);
  const [replies, setReplies] = useState(discussion.replies || []);

  const userName = 'Demo User';
  const userRole = 'Student';
  const posterName = discussion.userName || 'Anonymous';
  const posterRole = 'Student';

  const handleReply = async () => {
    if (replyContent.trim() !== '') {
      const newReply = {
        content: replyContent,
        userId: 'currentUser',
        userName: userName,
        userRole: userRole,
        timestamp: new Date().toISOString(),
      };

      // Add reply to local state (frontend only)
      setReplies([...replies, newReply]);
      setReplyContent('');
      setShowReplyForm(false);
      setError(null);
      toast.success('Reply added! (Frontend only)');
      
      if (onReplyAdded) onReplyAdded();
    } else {
      setError('Reply cannot be empty');
    }
  };

  return (
    <div className="discussion-card">
      <div className="discussion-header">
        <h3>{discussion.title}</h3>
        <span className="subject-tag">{discussion.subject}</span>
      </div>
      <p className="discussion-content">{discussion.content}</p>
      <div className="discussion-meta">
        <span className="author">Posted by {posterName} ({posterRole})</span>
        <span className="timestamp">
          {discussion.timestamp?.toDate
            ? discussion.timestamp.toDate().toLocaleDateString()
            : new Date(discussion.timestamp).toLocaleDateString()}
        </span>
      </div>

      <div className="discussion-replies">
        {replies && replies.length > 0 && (
          <div className="replies-section">
            <h4>Replies ({replies.length})</h4>
            {replies.map((reply, index) => (
              <div key={index} className="reply-card">
                <p className="reply-content">{reply.content}</p>
                <div className="reply-meta">
                  <span className="author">Replied by {reply.userName} ({reply.userRole})</span>
                  <span className="timestamp">
                    {reply.timestamp?.toDate
                      ? reply.timestamp.toDate().toLocaleDateString()
                      : new Date(reply.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showReplyForm ? (
          <button className="reply-btn" onClick={() => setShowReplyForm(true)}>
            Reply to Discussion
          </button>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} className="reply-form">
            {error && <div className="error-message">{error}</div>}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows="3"
              required
            />
            <div className="reply-actions">
              <button type="button" className="submit-btn" onClick={handleReply}>
                Post Reply
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DiscussionCard;
