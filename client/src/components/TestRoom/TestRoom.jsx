import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './TestRoom.css';

const TestRoom = () => {
    const [activeTest, setActiveTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentAnswers, setCurrentAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [userRole] = useState('student'); // Mock user role
    const currentUser = { uid: 'demo-user' }; // Mock user
    const navigate = useNavigate();

    useEffect(() => {
        // Generate mock test
        const mockTest = {
            id: 'test1',
            title: 'GATE Practice Test',
            startTime: new Date(Date.now() - 30 * 60 * 1000),
            endTime: new Date(Date.now() + 90 * 60 * 1000),
            mcqQuestions: ['mcq1', 'mcq2'],
            natQuestions: ['nat1', 'nat2']
        };

        const now = Date.now();
        const startTime = mockTest.startTime.getTime();
        const endTime = mockTest.endTime.getTime();

        if (now >= startTime && now <= endTime) {
            setActiveTest(mockTest);
            setTimeLeft(Math.floor((endTime - now) / 1000));
            fetchQuestions(mockTest.mcqQuestions, mockTest.natQuestions);
        }
    }, []);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        } else if (timeLeft === 0 && activeTest && userRole === 'student') {
            submitTest();
        }
    }, [timeLeft]);

    const fetchQuestions = async (mcqIds, natIds) => {
        try {
            // Generate mock questions
            const mcqQuestions = mcqIds.map((id, index) => ({
                id,
                questionText: `MCQ Question ${index + 1}: What is the answer?`,
                type: 'mcq',
                options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                correctAnswer: 'Option 1',
                difficulty: 'Medium',
                topic: 'General'
            }));

            const natQuestions = natIds.map((id, index) => ({
                id,
                questionText: `Fill in the Blank Question ${index + 1}: Enter your answer`,
                type: 'nat',
                correctAnswer: 'Answer',
                difficulty: 'Medium',
                topic: 'General'
            }));

            setQuestions([...mcqQuestions, ...natQuestions]);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        if (userRole === 'student') {
            setCurrentAnswers(prev => ({
                ...prev,
                [questionId]: answer
            }));
        }
    };

    const submitTest = async () => {
        if (!activeTest || !currentUser || userRole !== 'student') return;

        try {
            console.log('Test submitted (frontend only):', {
                testId: activeTest.id,
                userId: currentUser.uid,
                answers: currentAnswers,
                submittedAt: new Date()
            });

            setHasSubmitted(true);
            toast.success('Test submitted successfully! (Frontend only)');
            navigate('/dashboard');
        } catch (error) {
            console.error("Error submitting test:", error);
        }
    };

    if (hasSubmitted) {
        return (
            <div className="test-room-container">
                <div className="no-test-message">
                    You have already submitted this test.
                </div>
            </div>
        );
    }

    if (!activeTest) {
        return (
            <div className="test-room-container">
                <div className="no-test-message">
                    No active test at the moment.
                </div>
            </div>
        );
    }

    return (
        <div className="test-room-container">
            <div className="test-header">
                <h2 className="test-title">{activeTest.title}</h2>
                <div className="timer">
                    <FaClock />
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>

            <div className="questions-container">
                {questions.map((question) => (
                    <div key={question.id} className="question-card">
                        <div className={`question-type-badge ${question.type}`}>
                            {question.type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
                        </div>
                        <p className="question-text">{question.questionText}</p>
                        
                        {question.type === 'mcq' ? (
                            <div className="options-grid">
                                {question.options.map((option, index) => (
                                    <label key={index} className="option-item">
                                        <input
                                            type="radio"
                                            name={question.id}
                                            value={option}
                                            checked={currentAnswers[question.id] === option}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            disabled={userRole === 'teacher'} // Disable inputs for teachers
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={currentAnswers[question.id] || ''}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                placeholder="Type your answer here..."
                                className="nat-input"
                                disabled={userRole === 'teacher'} // Disable input for teachers
                            />
                        )}
                    </div>
                ))}
            </div>

            {userRole === 'student' && (
                <button
                    onClick={submitTest}
                    className="submit-button"
                >
                    Submit Test
                </button>
            )}
        </div>
    );
};

export default TestRoom;
