import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import DiscussionCard from './components/Discussion/DiscussionCard';
import './Discuss.css';

const Discuss = () => {
  const [discussions, setDiscussions] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', subject: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const subjects = [
    'Computer Networks',
    'Operating Systems',
    'Database Management',
    'Data Structures',
    'Algorithms',
    'General'
  ];

  // Load mock discussions on mount
  useEffect(() => {
    fetchDiscussions();
  }, []);

  // Effect for chat scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchDiscussions = async () => {
    // Mock discussions data
    const mockDiscussions = [
      {
        id: '1',
        title: 'How does TCP differ from UDP?',
        content: 'Can someone explain the key differences between TCP and UDP protocols?',
        subject: 'Computer Networks',
        userId: 'user1',
        userName: 'John Doe',
        timestamp: new Date(),
        replies: []
      },
      {
        id: '2',
        title: 'What is deadlock in OS?',
        content: 'I need help understanding the concept of deadlock and its prevention.',
        subject: 'Operating Systems',
        userId: 'user2',
        userName: 'Jane Smith',
        timestamp: new Date(Date.now() - 86400000),
        replies: []
      }
    ];
    setDiscussions(mockDiscussions);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.subject) {
      setError('Please fill in all fields');
      return;
    }

    // Add discussion to local state (frontend only)
    const newDiscussion = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      subject: newPost.subject,
      userId: 'currentUser',
      userName: 'Demo User',
      timestamp: new Date(),
      replies: []
    };

    setDiscussions([newDiscussion, ...discussions]);
    setNewPost({ title: '', content: '', subject: '' });
    setError(null);
    toast.success('Discussion posted! (Frontend only)');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = { role: 'user', content: userInput };
    setChatMessages(prev => [...prev, newMessage]);
    setIsChatLoading(true);

    // Mock AI response (since backend is removed)
    setTimeout(() => {
      const mockResponse = {
        role: 'assistant',
        content: 'This is a mock AI response. The backend has been removed, so this is just a placeholder response.'
      };
      setChatMessages(prev => [...prev, mockResponse]);
      setIsChatLoading(false);
    }, 1000);

    setUserInput('');
  };

  return (
    <div className="discuss-container">
      <div className="discuss-header">
        <div className="header-content">
          <h1>{showAIChat ? 'AI Assistant' : 'Community Discussions'}</h1>
          <p>{showAIChat ? 'Get instant help from our AI tutor (Mock)' : 'Share your doubts and help others learn'}</p>
        </div>
        <button 
          className={`toggle-btn ${showAIChat ? 'ai-active' : ''}`}
          onClick={() => setShowAIChat(!showAIChat)}
        >
          {showAIChat ? 'Switch to Community' : 'Switch to AI Chat'}
        </button>
      </div>

      {!showAIChat ? (
        <>
          <div className="new-discussion">
            <h2>Start a New Discussion</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject:</label>
                <select
                  className="white-background"
                  value={newPost.subject}
                  onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's your question?"
                  required
                />
              </div>

              <div className="form-group">
                <label>Content:</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Provide more details about your question..."
                  required
                  rows="4"
                />
              </div>

              <button type="submit" className="submit-btn">Post Discussion</button>
            </form>
          </div>

          <div className="discussions-list">
            <h2>Recent Discussions</h2>
            {discussions.map(discussion => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                onReplyAdded={fetchDiscussions}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="ai-chat-container">
          <div className="chat-messages" ref={chatContainerRef}>
            {chatMessages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
            {isChatLoading && (
              <div className="message assistant">
                <div className="message-content">Thinking...</div>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask your question here..."
              disabled={isChatLoading}
            />
            <button type="submit" disabled={isChatLoading || !userInput.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Discuss;
