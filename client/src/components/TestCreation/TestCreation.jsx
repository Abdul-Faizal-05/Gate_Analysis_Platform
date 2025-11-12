import React, { useState } from "react";
import "./TestCreation.css";
import { toast } from "react-toastify";

const TestCreation = () => {
  const [testName, setTestName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionType, setQuestionType] = useState("MCQ");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [topic, setTopic] = useState("");

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      questionText: question,
      type: questionType.toLowerCase(),
      options: questionType === "MCQ" ? options : [],
      correctAnswer: questionType === "MCQ" ? correctAnswer : parseFloat(correctAnswer),
      difficulty,
      topic,
    };

    setQuestions([...questions, newQuestion]);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setTopic("");
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!testName || !startTime || !endTime || questions.length === 0) {
      alert("Please fill in all fields and add at least one question.");
      return;
    }

    try {
      // Frontend only - log the test data
      const testDetails = {
        title: testName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description,
        createdAt: new Date(),
        questions: questions
      };

      console.log("Test created (frontend only):", testDetails);
      toast.success("Test created successfully! (Frontend only)");

      // Reset form
      setTestName("");
      setStartTime("");
      setEndTime("");
      setDescription("");
      setQuestions([]);
    } catch (error) {
      console.error("Error saving test:", error);
      alert(`Failed to save test: ${error.message}`);
    }
  };

  return (
    <div className="test-creation-container">
      <h2>Create a New Test</h2>
      <label>Test Name:</label>
      <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} />

      <label>Start Time:</label>
      <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

      <label>End Time:</label>
      <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

      <label>Description:</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

      <h2>Add a Question</h2>
      <label>Question Type:</label>
      <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
        <option value="MCQ">MCQ</option>
        <option value="NAT">NAT</option>
      </select>

      <label>Question:</label>
      <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} />

      {questionType === "MCQ" && (
        <>
          <label>Options:</label>
          {options.map((opt, index) => (
            <input key={index} type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} />
          ))}
        </>
      )}

      <label>Correct Answer:</label>
      <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />

      <label>Difficulty Level:</label>
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      <label>Topic:</label>
      <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />

      <button onClick={handleAddQuestion}>Add Question</button>
      <button onClick={handleSubmit}>Save Test & Questions</button>
      
      <h3>Added Questions:</h3>
      {questions.map((q, index) => (
        <div key={index}>
          <p>{q.questionText}</p>
          <p>{q.type.toUpperCase()} - Difficulty: {q.difficulty} - Topic: {q.topic}</p>
          <button onClick={() => handleDeleteQuestion(index)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default TestCreation;
