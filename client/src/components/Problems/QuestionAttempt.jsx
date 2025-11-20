import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './QuestionAttempt.css';

const QuestionAttempt = ({ question, onClose, onSubmit }) => {
  // For MCQ: single selection (string), For MSQ: multiple selection (array)
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState(null);

  // Use the options from the question
  const options = question.options || [];
  const isMSQ = question.questionType === 'msq';
  const isNAT = question.questionType === 'nat';

  const handleMCQChange = (value) => {
    setSelectedOption(value);
  };

  const handleMSQChange = (value) => {
    setSelectedOptions(prev => {
      if (prev.includes(value)) {
        return prev.filter(opt => opt !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation based on question type
    if (isMSQ && selectedOptions.length === 0) {
      toast.error('Please select at least one option');
      return;
    }
    if (!isMSQ && !isNAT && !selectedOption) {
      toast.error('Please select an option');
      return;
    }
    if (isNAT && !selectedOption) {
      toast.error('Please enter your answer');
      return;
    }

    setIsSubmitting(true);
    try {
      let isCorrect = false;
      let score = 0;

      if (isMSQ) {
        // For MSQ: Check if all correct options are selected and no wrong options
        const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.text);
        const selectedSet = new Set(selectedOptions);
        const correctSet = new Set(correctOptions);

        isCorrect = selectedOptions.length === correctOptions.length &&
          selectedOptions.every(opt => correctSet.has(opt)) &&
          correctOptions.every(opt => selectedSet.has(opt));

        score = isCorrect ? 1 : 0;
      } else if (isNAT) {
        // For NAT: Compare with correct answer (with tolerance if numerical)
        const natAnswer = question.natAnswer;
        if (natAnswer.answerText) {
          // Text-based NAT
          isCorrect = selectedOption.trim().toLowerCase() === natAnswer.answerText.toLowerCase();
        } else {
          // Numerical NAT
          const userAnswer = parseFloat(selectedOption);
          const correctAnswer = parseFloat(natAnswer.correctAnswer);
          const tolerance = natAnswer.tolerance || 0;
          isCorrect = Math.abs(userAnswer - correctAnswer) <= tolerance;
        }
        score = isCorrect ? 1 : 0;
      } else {
        // For MCQ: Check if selected option is correct
        const selectedOptionObj = question.options.find(opt => opt.text === selectedOption);
        isCorrect = selectedOptionObj?.isCorrect || false;
        score = isCorrect ? 1 : 0;
      }

      // Store attempt in database
      const attemptData = {
        userId: localStorage.getItem('userId') || 'demo-user', // Get from localStorage after login
        problemId: question.id,
        selectedOptions: isMSQ ? selectedOptions : (isNAT ? null : [selectedOption]),
        natAnswerValue: isNAT && !question.natAnswer?.answerText ? parseFloat(selectedOption) : null,
        natAnswerText: isNAT && question.natAnswer?.answerText ? selectedOption : null,
        isCorrect,
        score,
        timeTaken: null, // Can add timer later
        userExplanation: explanation || null
      };

      // Save to backend
      try {
        const response = await fetch('http://localhost:5000/api/problems/attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attemptData)
        });

        const result = await response.json();
        if (!result.success) {
          console.error('Failed to save attempt:', result.message);
        }
      } catch (saveError) {
        console.error('Error saving attempt to backend:', saveError);
      }

      // Show appropriate toast based on correctness
      if (isCorrect) {
        toast.success(`Correct Answer! ✓`, {
          position: "top-center",
          autoClose: 3000,
          style: {
            background: '#4caf50',
            color: 'white',
            fontWeight: 'bold'
          }
        });
        onSubmit(score);
        onClose();
      } else {
        toast.error(`Incorrect Answer ✗`, {
          position: "top-center",
          autoClose: 5000,
          style: {
            background: '#f44336',
            color: 'white',
            fontWeight: 'bold'
          }
        });
        // Show solution for incorrect answers
        setSubmittedAnswer({
          userAnswer: isMSQ ? selectedOptions : selectedOption,
          isCorrect: false
        });
        setShowSolution(true);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="question-attempt-overlay">
      <div className="question-attempt-modal">
        <button className="close-button" onClick={onClose}>×</button>

        <div className="question-header">
          <span className={`difficulty ${question.difficulty.toLowerCase()}`}>
            {question.difficulty}
          </span>
          <span className="subject">{question.subject}</span>
          <span className="topic">{question.topic}</span>
        </div>

        <h2>{question.title}</h2>
        <p className="description">{question.description}</p>
        <div className="question-text">{question.text}</div>
        {isMSQ && (
          <p className="question-note" style={{ color: '#ff9800', fontStyle: 'italic', marginTop: '10px' }}>
            Note: Select all correct options (Multiple answers possible)
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {isNAT ? (
            <div className="nat-input-container">
              <label htmlFor="nat-answer">Your Answer:</label>
              <input
                id="nat-answer"
                type="text"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                placeholder={question.natAnswer?.answerUnit ? `Enter answer in ${question.natAnswer.answerUnit}` : 'Enter your answer'}
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '5px',
                  width: '100%',
                  marginTop: '10px'
                }}
              />
            </div>
          ) : (
            <div className="options-container">
              {options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type={isMSQ ? "checkbox" : "radio"}
                    name="answer"
                    value={option.text}
                    checked={isMSQ ? selectedOptions.includes(option.text) : selectedOption === option.text}
                    onChange={(e) => isMSQ ? handleMSQChange(e.target.value) : handleMCQChange(e.target.value)}
                  />
                  <span className="option-text">{option.displayText}</span>
                </label>
              ))}
            </div>
          )}

          <div className="explanation-container">
            <label htmlFor="explanation">Explanation (Optional):</label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain your reasoning..."
              rows="3"
            />
          </div>

          {showSolution && submittedAnswer && !submittedAnswer.isCorrect && (
            <div className="solution-section" style={{
              backgroundColor: '#ffebee',
              border: '2px solid #f44336',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#d32f2f', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>❌</span> Incorrect Answer - Solution
              </h3>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#c62828' }}>Your Answer:</strong>
                <p style={{ color: '#555', marginTop: '5px' }}>
                  {isMSQ
                    ? submittedAnswer.userAnswer.join(', ')
                    : submittedAnswer.userAnswer}
                </p>
              </div>

              {!isNAT && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>Correct Answer(s):</strong>
                  <p style={{ color: '#555', marginTop: '5px' }}>
                    {options
                      .filter(opt => opt.isCorrect)
                      .map(opt => opt.displayText)
                      .join(', ')}
                  </p>
                </div>
              )}

              {isNAT && question.natAnswer && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#2e7d32' }}>Correct Answer:</strong>
                  <p style={{ color: '#555', marginTop: '5px' }}>
                    {question.natAnswer.answerText
                      ? question.natAnswer.answerText
                      : `${question.natAnswer.correctAnswer} ${question.natAnswer.answerUnit || ''}`}
                  </p>
                </div>
              )}

              {question.solutionExplanation && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ffcdd2' }}>
                  <strong style={{ color: '#1565c0' }}>Explanation:</strong>
                  <p style={{ color: '#555', marginTop: '8px', lineHeight: '1.6' }}>
                    {question.solutionExplanation}
                  </p>
                </div>
              )}

              {question.hints && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ffcdd2' }}>
                  <strong style={{ color: '#f57c00' }}>Hints:</strong>
                  <p style={{ color: '#555', marginTop: '8px', lineHeight: '1.6', fontStyle: 'italic' }}>
                    {question.hints}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="button-container">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {showSolution ? 'Close' : 'Cancel'}
            </button>
            {!showSolution && (
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            )}
            {showSolution && (
              <button
                type="button"
                className="submit-button"
                onClick={() => {
                  onSubmit(0);
                  onClose();
                }}
                style={{ backgroundColor: '#1976d2' }}
              >
                Continue
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionAttempt;
