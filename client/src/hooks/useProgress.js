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
    // Simulate data loading
    const mockProblems = generateMockProblems();
    const mockProgress = generateMockProgress(mockProblems);

    setProblems(mockProblems);
    setUserProgress(mockProgress);
    setLoading(false);
  }, []);

  const fetchData = async () => {
    // Refresh mock data
    const mockProblems = generateMockProblems();
    const mockProgress = generateMockProgress(mockProblems);

    setProblems(mockProblems);
    setUserProgress(mockProgress);
  };

  const calculateOverallProgress = () => {
    if (!userProgress?.completedProblems || problems.length === 0) return 0;
    return (userProgress.completedProblems.length / problems.length) * 100;
  };

  const calculateOverallAccuracy = () => {
    if (!userProgress?.completedProblems || userProgress.completedProblems.length === 0) return 0;
    const totalScore = userProgress.completedProblems.reduce((acc, curr) => acc + curr.score, 0);
    return (totalScore / userProgress.completedProblems.length) * 100;
  };

  const calculateSubjectProgress = (subject) => {
    if (!userProgress?.completedProblems || problems.length === 0) {
      return { completion: 0, accuracy: 0, total: 0, completed: 0 };
    }

    const subjectProblems = problems.filter(p => p.subject === subject);
    const completedSubjectProblems = userProgress.completedProblems.filter(
      p => p.subject === subject
    );

    const completion = (completedSubjectProblems.length / subjectProblems.length) * 100;
    const accuracy = completedSubjectProblems.length > 0
      ? (completedSubjectProblems.reduce((acc, curr) => acc + curr.score, 0) / completedSubjectProblems.length) * 100
      : 0;

    return {
      completion,
      accuracy,
      total: subjectProblems.length,
      completed: completedSubjectProblems.length
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
        const completion = (completedTopicProblems.length / topicProblems.length) * 100;
        const accuracy = completedTopicProblems.length > 0
          ? (completedTopicProblems.reduce((acc, curr) => acc + curr.score, 0) / completedTopicProblems.length) * 100
          : 0;

        topicAnalysis.push({
          topic,
          subject: topicProblems[0].subject,
          completion,
          accuracy,
          total: topicProblems.length,
          completed: completedTopicProblems.length,
          averageAttempts: completedTopicProblems.length > 0
            ? completedTopicProblems.length / topicProblems.length
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
