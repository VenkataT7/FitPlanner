import { useState } from 'react';
import { WorkoutSession } from '../types/fitness';
import { Calendar, TrendingUp, Activity } from 'lucide-react';

interface SessionTrackerProps {
  planId?: string;
  onSessionSaved?: (session: WorkoutSession) => void;
}

export function SessionTracker({ planId, onSessionSaved }: SessionTrackerProps) {
  const [sessionData, setSessionData] = useState<Partial<WorkoutSession>>({
    session_date: new Date().toISOString().split('T')[0],
    duration_min: 60,
    exercises_completed: [],
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!sessionData.duration_min || !sessionData.session_date) {
      return;
    }

    setSaving(true);

    setTimeout(() => {
      const session: WorkoutSession = {
        id: crypto.randomUUID(),
        user_id: 'current-user',
        plan_id: planId,
        ...sessionData,
      } as WorkoutSession;

      if (onSessionSaved) {
        onSessionSaved(session);
      }

      setSessionData({
        session_date: new Date().toISOString().split('T')[0],
        duration_min: 60,
        exercises_completed: [],
      });

      setSaving(false);
    }, 500);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Log Workout Session</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Date</label>
            <input
              type="date"
              value={sessionData.session_date}
              onChange={(e) => setSessionData({ ...sessionData, session_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={sessionData.duration_min || ''}
              onChange={(e) => setSessionData({ ...sessionData, duration_min: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RPE (1-10) <span className="text-gray-500 text-xs">Rate of Perceived Exertion</span>
            </label>
            <input
              type="number"
              value={sessionData.rpe || ''}
              onChange={(e) => setSessionData({ ...sessionData, rpe: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="1"
              max="10"
              placeholder="How hard was it?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soreness (1-10) <span className="text-gray-500 text-xs">Next day soreness</span>
            </label>
            <input
              type="number"
              value={sessionData.soreness || ''}
              onChange={(e) => setSessionData({ ...sessionData, soreness: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="1"
              max="10"
              placeholder="How sore?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bodyweight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={sessionData.bodyweight_kg || ''}
              onChange={(e) => setSessionData({ ...sessionData, bodyweight_kg: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pain Notes</label>
          <textarea
            value={sessionData.pain_notes || ''}
            onChange={(e) => setSessionData({ ...sessionData, pain_notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={2}
            placeholder="Any pain or discomfort experienced..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Notes</label>
          <textarea
            value={sessionData.notes || ''}
            onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
            placeholder="How did the session go? Any observations..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !sessionData.duration_min || !sessionData.session_date}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Log Session'}
        </button>
      </div>
    </div>
  );
}

interface ProgressDashboardProps {
  sessions: WorkoutSession[];
}

export function ProgressDashboard({ sessions }: ProgressDashboardProps) {
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  const stats = {
    totalSessions: sessions.length,
    avgRPE: sessions.filter((s) => s.rpe).reduce((sum, s) => sum + (s.rpe || 0), 0) / sessions.filter((s) => s.rpe).length || 0,
    totalMinutes: sessions.reduce((sum, s) => sum + s.duration_min, 0),
    avgSoreness: sessions.filter((s) => s.soreness).reduce((sum, s) => sum + (s.soreness || 0), 0) / sessions.filter((s) => s.soreness).length || 0,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-8 h-8" />
          <h2 className="text-3xl font-bold">Progress Dashboard</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Total Sessions</div>
            <div className="text-2xl font-bold mt-1">{stats.totalSessions}</div>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Total Time</div>
            <div className="text-2xl font-bold mt-1">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</div>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Avg RPE</div>
            <div className="text-2xl font-bold mt-1">{stats.avgRPE.toFixed(1)}/10</div>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Avg Soreness</div>
            <div className="text-2xl font-bold mt-1">{stats.avgSoreness.toFixed(1)}/10</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Recent Sessions</h3>
        </div>

        {sortedSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sessions logged yet. Start tracking your workouts!
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {new Date(session.session_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-gray-600">{session.duration_min} minutes</div>
                  </div>
                  <div className="text-right text-sm">
                    {session.rpe && (
                      <div className="text-gray-700">
                        RPE: <span className="font-semibold">{session.rpe}/10</span>
                      </div>
                    )}
                    {session.soreness && (
                      <div className="text-gray-700">
                        Soreness: <span className="font-semibold">{session.soreness}/10</span>
                      </div>
                    )}
                  </div>
                </div>
                {session.notes && (
                  <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{session.notes}</div>
                )}
                {session.pain_notes && (
                  <div className="text-sm text-orange-700 mt-2 bg-orange-50 p-2 rounded border border-orange-200">
                    Pain: {session.pain_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
