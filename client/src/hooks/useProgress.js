import { useState, useEffect } from 'react';

// Mock data generator
const generateMockProblems = () => {
  const subjects = ['Mathematics', 'Digital Logic', 'Computer Organization', 'Programming', 'Theory of Computation'];
  const topics = {
    'Mathematics': ['Calculus', 'Probability', 'Linear Algebra'],
    'Digital Logic': ['Boolean Algebra', 'Logic Gates', 'Circuits'],
    'Computer Organization': ['CPU Architecture', 'Memory Systems', 'I/O Systems'],
    'Programming': ['Time Complexity', 'Data Structures', 'Algorithms'],
    'Theory of Computation': ['Automata Theory', 'Grammars', 'Turing Machines']
  };
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const problems = [];
  let id = 1;

  subjects.forEach(subject => {
    topics[subject].forEach(topic => {
      for (let i = 0; i < 15; i++) {
        problems.push({
          id: `P${id.toString().padStart(4, '0')}`,
          subject,
          topic,
          title: `${topic} - Problem ${i + 1}`,
          description: `This is a practice problem for ${topic}`,
          text: `Solve this ${topic} problem`,
          difficulty: difficulties[id % 3],
          options: [
            { text: 'Option A', displayText: 'Option A', isCorrect: true },
            { text: 'Option B', displayText: 'Option B', isCorrect: false },
            { text: 'Option C', displayText: 'Option C', isCorrect: false },
            { text: 'Option D', displayText: 'Option D', isCorrect: false }
          ]
        });
        id++;
      }
    });
  });

  return problems;
};

const generateMockProgress = (problems) => {
  // Simulate some completed problems
  const completedProblems = [];
  const numCompleted = Math.floor(problems.length * 0.3); // 30% completion

  for (let i = 0; i < numCompleted; i++) {
    const problem = problems[i];
    completedProblems.push({
      id: problem.id,
      subject: problem.subject,
      topic: problem.topic,
      score: Math.random() > 0.3 ? 1 : 0, // 70% accuracy
      attemptedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return {
    completedProblems,
    totalProblems: problems.length
  };
};

const useProgress = () => {
  const [problems, setProblems] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subjects = ['Mathematics', 'Digital Logic', 'Computer Organization', 'Programming', 'Theory of Computation'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user ID from localStorage (set during login)
      const userId = localStorage.getItem('userId') || 'demo-user';

      console.log('Fetching problems from API...');
      // Fetch problems from backend API
      const problemsResponse = await fetch('http://localhost:5000/api/problems');

      if (!problemsResponse.ok) {
        throw new Error(`API returned ${problemsResponse.status}`);
      }

      const problemsData = await problemsResponse.json();
      console.log('Problems API response:', problemsData);

      // Fetch user progress from backend API
      console.log(`Fetching progress for user: ${userId}`);
      const progressResponse = await fetch(`http://localhost:5000/api/progress/${userId}`);
      const progressData = await progressResponse.json();
      console.log('Progress API response:', progressData);

      if (problemsData.success && problemsData.problems) {
        // Transform backend data to match frontend format
        const transformedProblems = problemsData.problems.map(problem => ({
          id: problem.id,
          subject: problem.subject,
          topic: problem.topic,
          title: problem.title,
          description: problem.description,
          text: problem.question_text,
          difficulty: problem.difficulty,
          questionType: problem.question_type,
          marks: problem.marks,
          options: problem.options || [],
          natAnswer: problem.natAnswer || null,
          solutionExplanation: problem.solution_explanation,
          hints: problem.hints
        }));

        console.log(`✅ Loaded ${transformedProblems.length} problems from database`);
        setProblems(transformedProblems);

        // Use real progress data from database
        if (progressData.success) {
          console.log(`✅ Loaded progress: ${progressData.completedProblems?.length || 0} completed problems`);
          setUserProgress({
            completedProblems: progressData.completedProblems || [],
            totalProblems: transformedProblems.length,
            progressSummary: progressData.progressSummary || []
          });
        } else {
          // No progress yet - empty state
          console.log('ℹ️ No progress data found, starting fresh');
          setUserProgress({
            completedProblems: [],
            totalProblems: transformedProblems.length,
            progressSummary: []
          });
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('❌ Error fetching data from API:', err);
      setError(err.message);

      // Fallback to mock data on error
      console.warn('⚠️ Falling back to mock data');
      const mockProblems = generateMockProblems();
      const mockProgress = generateMockProgress(mockProblems);
      setProblems(mockProblems);
      setUserProgress(mockProgress);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!userProgress?.completedProblems || problems.length === 0) return 0;

    // Count unique problems completed (each problem only once based on first correct attempt)
    const uniqueCompletedProblems = new Map();
    userProgress.completedProblems.forEach(attempt => {
      if (!uniqueCompletedProblems.has(attempt.id) && attempt.isCorrect) {
        uniqueCompletedProblems.set(attempt.id, attempt);
      }
    });

    return (uniqueCompletedProblems.size / problems.length) * 100;
  };

  const calculateOverallAccuracy = () => {
    if (!userProgress?.completedProblems || userProgress.completedProblems.length === 0) return 0;

    // Calculate accuracy as ratio of correct submissions to total submissions
    const totalAttempts = userProgress.completedProblems.length;
    const correctAttempts = userProgress.completedProblems.filter(attempt => attempt.isCorrect).length;

    return (correctAttempts / totalAttempts) * 100;
  };

  const calculateSubjectProgress = (subject) => {
    if (!userProgress?.completedProblems || problems.length === 0) {
      return { completion: 0, accuracy: 0, total: 0, completed: 0 };
    }

    const subjectProblems = problems.filter(p => p.subject === subject);

    // If no problems exist for this subject in database, return zeros
    if (subjectProblems.length === 0) {
      return { completion: 0, accuracy: 0, total: 0, completed: 0 };
    }

    const completedSubjectProblems = userProgress.completedProblems.filter(
      p => p.subject === subject
    );

    // Count unique problems completed (each problem only once based on first correct attempt)
    const uniqueCompletedProblems = new Map();
    completedSubjectProblems.forEach(attempt => {
      if (!uniqueCompletedProblems.has(attempt.id) && attempt.isCorrect) {
        uniqueCompletedProblems.set(attempt.id, attempt);
      }
    });

    // For accuracy, calculate ratio of correct to total submissions
    const totalAttempts = completedSubjectProblems.length;
    const correctAttempts = completedSubjectProblems.filter(a => a.isCorrect).length;

    const completion = subjectProblems.length > 0
      ? (uniqueCompletedProblems.size / subjectProblems.length) * 100
      : 0;
    const accuracy = totalAttempts > 0
      ? (correctAttempts / totalAttempts) * 100
      : 0;

    return {
      completion,
      accuracy,
      total: subjectProblems.length,
      completed: uniqueCompletedProblems.size
    };
  };

  const getSubjectsProgress = () => {
    return subjects.map(subject => ({
      subject,
      ...calculateSubjectProgress(subject)
    }));
  };

  const getDifficultyStats = () => {
    const stats = { Easy: 0, Medium: 0, Hard: 0 };
    if (!userProgress?.completedProblems) return stats;

    userProgress.completedProblems.forEach(prob => {
      const problem = problems.find(p => p.id === prob.id);
      if (problem) {
        stats[problem.difficulty] = (stats[problem.difficulty] || 0) + 1;
      }
    });

    return stats;
  };

  const getRecentActivity = () => {
    if (!userProgress?.completedProblems) return [];

    return [...userProgress.completedProblems]
      .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))
      .slice(0, 5)
      .map(activity => {
        const problem = problems.find(p => p.id === activity.id);
        return {
          ...activity,
          problemDetails: problem
        };
      });
  };

  const getTopicAnalysis = () => {
    if (!userProgress?.completedProblems || problems.length === 0) {
      return [];
    }

    const topics = new Set(problems.map(p => p.topic));
    const topicAnalysis = [];

    topics.forEach(topic => {
      const topicProblems = problems.filter(p => p.topic === topic);
      const completedTopicProblems = userProgress.completedProblems.filter(
        p => {
          const problem = problems.find(prob => prob.id === p.id);
          return problem && problem.topic === topic;
        }
      );

      if (topicProblems.length > 0) {
        // Count unique problems completed
        const uniqueCompletedProblems = new Map();
        completedTopicProblems.forEach(attempt => {
          if (!uniqueCompletedProblems.has(attempt.id) && attempt.isCorrect) {
            uniqueCompletedProblems.set(attempt.id, attempt);
          }
        });

        // For accuracy, calculate ratio of correct to total submissions
        const totalAttempts = completedTopicProblems.length;
        const correctAttempts = completedTopicProblems.filter(a => a.isCorrect).length;

        const completion = (uniqueCompletedProblems.size / topicProblems.length) * 100;
        const accuracy = totalAttempts > 0
          ? (correctAttempts / totalAttempts) * 100
          : 0;

        topicAnalysis.push({
          topic,
          subject: topicProblems[0].subject,
          completion,
          accuracy,
          total: topicProblems.length,
          completed: uniqueCompletedProblems.size,
          averageAttempts: uniqueCompletedProblems.size > 0
            ? completedTopicProblems.length / uniqueCompletedProblems.size
            : 0
        });
      }
    });

    return topicAnalysis;
  };

  const getPerformanceInsights = () => {
    const topicAnalysis = getTopicAnalysis();
    const insights = {
      needsImprovement: [],
      goodProgress: [],
      suggestions: []
    };

    topicAnalysis.forEach(topic => {
      if (topic.completion > 0) {
        if (topic.accuracy < 60) {
          insights.needsImprovement.push({
            ...topic,
            reason: 'Low accuracy',
            suggestion: `Review the concepts in ${topic.topic} as your accuracy is below 60%`
          });
        } else if (topic.accuracy > 80) {
          insights.goodProgress.push({
            ...topic,
            reason: 'High accuracy',
            suggestion: 'Keep up the good work!'
          });
        }
      }
    });

    const unattempedTopics = topicAnalysis.filter(t => t.completion === 0);
    if (unattempedTopics.length > 0) {
      insights.suggestions.push({
        type: 'unattempted',
        topics: unattempedTopics,
        suggestion: 'Start practicing these topics to improve your overall performance'
      });
    }

    const lowCompletionTopics = topicAnalysis.filter(t => t.completion > 0 && t.completion < 30);
    if (lowCompletionTopics.length > 0) {
      insights.suggestions.push({
        type: 'lowCompletion',
        topics: lowCompletionTopics,
        suggestion: 'Try to complete more problems in these topics'
      });
    }

    const subjectProgress = subjects.map(subject => ({
      subject,
      ...calculateSubjectProgress(subject)
    }));

    const lowPerformingSubjects = subjectProgress.filter(s => s.accuracy < 60 && s.completion > 0);
    if (lowPerformingSubjects.length > 0) {
      insights.suggestions.push({
        type: 'subjectImprovement',
        subjects: lowPerformingSubjects,
        suggestion: 'Focus on improving your performance in these subjects'
      });
    }

    return insights;
  };

  return {
    loading,
    error,
    problems,
    userProgress,
    subjects,
    calculateOverallProgress,
    calculateOverallAccuracy,
    calculateSubjectProgress,
    getSubjectsProgress,
    getDifficultyStats,
    getRecentActivity,
    getTopicAnalysis,
    getPerformanceInsights,
    refreshProgress: fetchData
  };
};

export default useProgress;
