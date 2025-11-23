import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import './Discussion.css';

const DiscussionCard = ({ discussion, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState(null);
  const [replies, setReplies] = useState(discussion.replies || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(discussion.likesCount || 0);
  const [replyLikes, setReplyLikes] = useState({});

  const userName = localStorage.getItem('userName') || 'Demo User';
  const userId = localStorage.getItem('userId') || 'demo-user';
  const userRole = localStorage.getItem('userType') || 'Student';
  const isAdmin = userRole === 'admin';
  const [isDeleting, setIsDeleting] = useState(false);
  const posterName = discussion.userName || 'Anonymous';
  const posterRole = discussion.userRole || 'Student';

  // Fetch replies and like status when component mounts
  React.useEffect(() => {
    if (discussion.repliesCount > 0) {
      fetchReplies();
    }
    checkLikeStatus();
  }, [discussion.id]);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/discussions/like-status?userId=${userId}&discussionId=${discussion.id}`);
      const data = await response.json();
      if (data.success) {
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          discussionId: discussion.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleReplyLike = async (replyId) => {
    try {
      const response = await fetch('http://localhost:5000/api/discussions/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          replyId: replyId
        })
      });

      const data = await response.json();
      if (data.success) {
        setReplyLikes(prev => ({
          ...prev,
          [replyId]: data.liked
        }));
        // Update reply likes count in state
        setReplies(prevReplies => prevReplies.map(reply => 
          reply.id === replyId 
            ? { ...reply, likesCount: (reply.likesCount || 0) + (data.liked ? 1 : -1) }
            : reply
        ));
      }
    } catch (error) {
      console.error('Error toggling reply like:', error);
      toast.error('Failed to update like');
    }
  };

  const fetchReplies = async () => {
    try {
      setLoadingReplies(true);
      const response = await fetch(`http://localhost:5000/api/discussions/${discussion.id}?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setReplies(data.discussion.replies || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (replyContent.trim() === '') {
      setError('Reply cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`http://localhost:5000/api/discussions/${discussion.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          content: replyContent
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply added successfully!');
        setReplyContent('');
        setShowReplyForm(false);
        setError(null);
        
        // Refresh replies
        await fetchReplies();
        
        if (onReplyAdded) onReplyAdded();
      } else {
        toast.error(data.message || 'Failed to add reply');
        setError(data.message);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to connect to server');
      toast.error('Failed to add reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!window.confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`http://localhost:5000/api/discussions/${discussion.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Discussion deleted successfully');
        if (onReplyAdded) onReplyAdded(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to delete discussion');
      }
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast.error('Failed to delete discussion');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/discussions/${discussion.id}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply deleted successfully');
        await fetchReplies(); // Refresh replies
        if (onReplyAdded) onReplyAdded(); // Refresh the discussion list
      } else {
        toast.error(data.message || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  return (
    <div className="discussion-card">
      <div className="discussion-header">
        <div className="discussion-title-section">
          <h3>{discussion.title}</h3>
          {isAdmin && (
            <button 
              className="delete-button" 
              onClick={handleDeleteDiscussion}
              disabled={isDeleting}
              title="Delete discussion"
            >
              <FaTrash />
            </button>
          )}
        </div>
        <span className="subject-tag">{discussion.subject}</span>
      </div>
      <p className="discussion-content">{discussion.content}</p>
      <div className="discussion-meta">
        <span className="author">Posted by {posterName} ({posterRole})</span>
        <span className="timestamp">
          {new Date(discussion.timestamp).toLocaleDateString()}
        </span>
        {discussion.repliesCount > 0 && (
          <span className="replies-badge">{discussion.repliesCount} {discussion.repliesCount === 1 ? 'Reply' : 'Replies'}</span>
        )}
        {discussion.viewsCount > 0 && (
          <span className="views-badge">{discussion.viewsCount} Views</span>
        )}
        <button 
          className="like-button" 
          onClick={handleLike}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? <FaHeart className="heart-filled" /> : <FaRegHeart />}
          <span className="like-count">{likesCount}</span>
        </button>
      </div>

      <div className="discussion-replies">
        {loadingReplies ? (
          <div className="loading-replies">Loading replies...</div>
        ) : replies && replies.length > 0 ? (
          <div className="replies-section">
            <h4>Replies ({replies.length})</h4>
            {replies.map((reply) => (
              <div key={reply.id} className="reply-card">
                <div className="reply-header">
                  <p className="reply-content">{reply.content}</p>
                  {isAdmin && (
                    <button 
                      className="delete-button delete-reply-btn" 
                      onClick={() => handleDeleteReply(reply.id)}
                      title="Delete reply"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
                <div className="reply-meta">
                  <span className="author">Replied by {reply.userName} ({reply.userRole})</span>
                  <span className="timestamp">
                    {new Date(reply.timestamp).toLocaleDateString()}
                  </span>
                  {reply.isAcceptedAnswer && (
                    <span className="accepted-badge">✓ Accepted Answer</span>
                  )}
                  <button 
                    className="like-button reply-like" 
                    onClick={() => handleReplyLike(reply.id)}
                    title={replyLikes[reply.id] ? 'Unlike' : 'Like'}
                  >
                    {replyLikes[reply.id] ? <FaHeart className="heart-filled" /> : <FaRegHeart />}
                    <span className="like-count">{reply.likesCount || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

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
              <button 
                type="button" 
                className="submit-btn" 
                onClick={handleReply}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                  setError(null);
                }}
                disabled={isSubmitting}
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
