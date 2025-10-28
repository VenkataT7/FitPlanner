import { FitnessPlan, Exercise } from '../types/fitness';
import { Dumbbell, Calendar, TrendingUp, Shield, Apple } from 'lucide-react';

interface PlanDisplayProps {
  plan: FitnessPlan;
  humanSummary: string;
}

export function PlanDisplay({ plan, humanSummary }: PlanDisplayProps) {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-lg shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Dumbbell className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Your Training Plan</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Focus</div>
            <div className="text-xl font-bold mt-1 capitalize">{plan.training_focus.replace('_', ' ')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Frequency</div>
            <div className="text-xl font-bold mt-1">{plan.weekly_structure.length} days/week</div>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Confidence</div>
            <div className="text-xl font-bold mt-1">{(plan.confidence * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
            <div className="text-sm opacity-90">Version</div>
            <div className="text-xl font-bold mt-1">v{plan.plan_version}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="prose prose-blue max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{humanSummary}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Progression Strategy</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-semibold">Method:</span> {plan.progression_rules.method}
            </div>
            <div>
              <span className="font-semibold">Load Increase:</span> {plan.progression_rules.load_increase_percent}%
            </div>
            <div>
              <span className="font-semibold">Deload Frequency:</span> Every {plan.progression_rules.deload_cadence_weeks} weeks
            </div>
            <div className="mt-4">
              <div className="font-semibold mb-2">Rules:</div>
              <ul className="list-disc list-inside space-y-1">
                {plan.progression_rules.autoregulation_rules.map((rule, idx) => (
                  <li key={idx} className="text-xs">{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Apple className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Nutrition Brief</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            {plan.nutrition_brief.calorie_direction && (
              <div>
                <span className="font-semibold">Calories:</span> {plan.nutrition_brief.calorie_direction}
              </div>
            )}
            <div>
              <span className="font-semibold">Protein Target:</span>{' '}
              {plan.nutrition_brief.protein_g_per_kg_range[0]}-{plan.nutrition_brief.protein_g_per_kg_range[1]} g/kg bodyweight
            </div>
            {plan.nutrition_brief.notes && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-md text-xs">
                {plan.nutrition_brief.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Safety Guidelines</h3>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Stop Immediately If:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {plan.safety_and_mods.red_flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Warmup Protocol:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {plan.safety_and_mods.warmup_protocols.map((protocol, idx) => (
                <li key={idx}>{protocol}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Weekly Schedule</h3>
        </div>
        <div className="space-y-6">
          {plan.sample_week.sessions.map((session, idx) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-baseline gap-3 mb-2">
                <h4 className="font-bold text-gray-900">Day {session.day_index + 1}:</h4>
                <span className="text-blue-600 font-semibold">{session.title}</span>
                <span className="text-sm text-gray-500">~{session.duration_min} min</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{session.focus}</p>

              {session.session_blocks.map((block, blockIdx) => (
                <div key={blockIdx} className="mb-3">
                  {block.type === 'main' && (
                    <div className="space-y-2">
                      {block.exercises.map((ex, exIdx) => {
                        const exercise = plan.exercise_library.find((e) => e.id === ex.exercise_id);
                        return exercise ? (
                          <div key={exIdx} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="font-semibold text-gray-900">{exercise.name}</div>
                            <div className="text-gray-700 mt-1">
                              {ex.sets} sets × {ex.reps} reps @ {ex.intensity}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              Rest: {ex.rest_seconds}s | Primary: {exercise.primary_muscles.join(', ')}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Exercise Library</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.exercise_library.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Estimated Milestones</h3>
        <div className="space-y-3">
          {plan.estimated_milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {milestone.timeline_weeks}w
              </div>
              <div className="text-sm text-gray-700">{milestone.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h4 className="font-bold text-gray-900 mb-2">{exercise.name}</h4>
      <div className="text-xs text-gray-600 mb-3">
        <div>Primary: {exercise.primary_muscles.join(', ')}</div>
        <div>Equipment: {exercise.equipment.join(', ')}</div>
      </div>
      <details className="text-xs text-gray-700">
        <summary className="font-semibold cursor-pointer hover:text-blue-600">Coaching Cues</summary>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {exercise.cues.map((cue, idx) => (
            <li key={idx}>{cue}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
