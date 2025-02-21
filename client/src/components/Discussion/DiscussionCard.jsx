import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import './Discussion.css';

const DiscussionCard = ({ discussion, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('Anonymous');
  const [userRole, setUserRole] = useState('Unknown Role');
  const [posterName, setPosterName] = useState('Loading...');
  const [posterRole, setPosterRole] = useState('Unknown Role');

  useEffect(() => {
    const fetchUserDetails = async (userId, setName, setRole) => {
      try {
        let userRef = doc(db, 'Students', userId);
        let userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setName(userSnap.data().Name || 'Unknown');
          setRole('Student');
          return;
        }

        userRef = doc(db, 'Teachers', userId);
        userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setName(userSnap.data().Name || 'Unknown');
          setRole('Teacher');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    if (auth.currentUser) {
      fetchUserDetails(auth.currentUser.uid, setUserName, setUserRole);
    }
    
    if (discussion.userId) {
      fetchUserDetails(discussion.userId, setPosterName, setPosterRole);
    }
  }, [discussion.userId]);

  const handleReply = async () => {
    if (replyContent.trim() !== '') {
      try {
        const discussionRef = doc(db, 'discussions', discussion.id);

        const newReply = {
          content: replyContent,
          userId: auth.currentUser.uid,
          userName: userName,
          userRole: userRole, // Add role to the reply
          timestamp: new Date().toISOString(),
        };

        await updateDoc(discussionRef, {
          replies: arrayUnion(newReply),
        });

        setReplyContent('');
        setShowReplyForm(false);
        setError(null);
        if (onReplyAdded) onReplyAdded();
        console.log('Reply added successfully!');
      } catch (error) {
        console.error('Error adding reply:', error);
        setError('Failed to add reply. Please try again.');
      }
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
        {discussion.replies && discussion.replies.length > 0 && (
          <div className="replies-section">
            <h4>Replies ({discussion.replies.length})</h4>
            {discussion.replies.map((reply, index) => (
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
