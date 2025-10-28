import { useState } from 'react';
import { UserInput, FitnessPlan, WorkoutSession } from './types/fitness';
import { planGenerator } from './services/planGenerator';
import { UserInputForm } from './components/UserInputForm';
import { PlanDisplay } from './components/PlanDisplay';
import { VideoAnalysis } from './components/VideoAnalysis';
import { SessionTracker, ProgressDashboard } from './components/SessionTracker';
import { Dumbbell, Video, Activity, BarChart } from 'lucide-react';

type View = 'input' | 'plan' | 'video' | 'tracker' | 'progress';

function App() {
  const [view, setView] = useState<View>('input');
  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [humanSummary, setHumanSummary] = useState<string>('');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = (input: UserInput) => {
    setLoading(true);

    setTimeout(() => {
      try {
        const generatedPlan = planGenerator.generatePlan(input);
        const summary = planGenerator.generateHumanSummary(generatedPlan, input);

        setPlan(generatedPlan);
        setHumanSummary(summary);
        setView('plan');
      } catch (error) {
        console.error('Plan generation failed:', error);
        alert(error instanceof Error ? error.message : 'Plan generation failed');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handleSessionSaved = (session: WorkoutSession) => {
    setSessions([session, ...sessions]);
    alert('Session logged successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">FitPlanner Pro</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('input')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  view === 'input'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                New Plan
              </button>
              {plan && (
                <>
                  <button
                    onClick={() => setView('plan')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      view === 'plan'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    My Plan
                  </button>
                  <button
                    onClick={() => setView('video')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                      view === 'video'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Form Check
                  </button>
                  <button
                    onClick={() => setView('tracker')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                      view === 'tracker'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Log Session
                  </button>
                  <button
                    onClick={() => setView('progress')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                      view === 'progress'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart className="w-4 h-4" />
                    Progress
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'input' && (
          <div className="flex justify-center">
            <UserInputForm onSubmit={handleGeneratePlan} loading={loading} />
          </div>
        )}

        {view === 'plan' && plan && (
          <PlanDisplay plan={plan} humanSummary={humanSummary} />
        )}

        {view === 'video' && plan && (
          <div className="flex justify-center">
            <VideoAnalysis exercises={plan.exercise_library} />
          </div>
        )}

        {view === 'tracker' && plan && (
          <div className="flex justify-center">
            <SessionTracker planId={plan.user_id} onSessionSaved={handleSessionSaved} />
          </div>
        )}

        {view === 'progress' && (
          <div className="flex justify-center">
            <ProgressDashboard sessions={sessions} />
          </div>
        )}

        {!plan && view !== 'input' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Dumbbell className="w-20 h-20 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">No Plan Created Yet</h2>
            <p className="text-gray-500 mb-6">Generate a plan first to access all features</p>
            <button
              onClick={() => setView('input')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your Plan
            </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              FitPlanner Pro - Evidence-Based Fitness Planning & Form Analysis
            </p>
            <p className="text-xs text-gray-500">
              This tool provides guidance based on general fitness principles. Always consult healthcare
              professionals for medical advice. Stop immediately if you experience pain.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
