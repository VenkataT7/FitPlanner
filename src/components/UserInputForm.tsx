import { useState } from 'react';
import { UserInput, TrainingExperience, Goal, Strictness } from '../types/fitness';

interface UserInputFormProps {
  onSubmit: (input: UserInput) => void;
  loading?: boolean;
}

export function UserInputForm({ onSubmit, loading }: UserInputFormProps) {
  const [formData, setFormData] = useState<Partial<UserInput>>({
    age: 30,
    sex: 'male',
    training_experience: 'intermediate',
    days_per_week: 3,
    minutes_per_session: 60,
    goal: 'hypertrophy',
    primary_equipment: ['barbell', 'dumbbells'],
    strictness: 'balanced',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.age &&
      formData.sex &&
      formData.training_experience &&
      formData.days_per_week &&
      formData.minutes_per_session &&
      formData.goal &&
      formData.strictness
    ) {
      onSubmit(formData as UserInput);
    }
  };

  const handleEquipmentToggle = (equipment: string) => {
    const current = formData.primary_equipment || [];
    const updated = current.includes(equipment)
      ? current.filter((e) => e !== equipment)
      : [...current, equipment];
    setFormData({ ...formData, primary_equipment: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Create Your Personalized Fitness Plan</h2>
        <p className="text-gray-600">
          Answer a few questions to generate an evidence-based training program tailored to your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
          <input
            type="number"
            value={formData.age || ''}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            min="10"
            max="120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
          <select
            value={formData.sex || 'male'}
            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
          <input
            type="number"
            value={formData.height_cm || ''}
            onChange={(e) => setFormData({ ...formData, height_cm: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
          <input
            type="number"
            value={formData.weight_kg || ''}
            onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Training Experience</label>
          <select
            value={formData.training_experience || 'intermediate'}
            onChange={(e) => setFormData({ ...formData, training_experience: e.target.value as TrainingExperience })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="novice">Novice (0-1 year)</option>
            <option value="intermediate">Intermediate (1-3 years)</option>
            <option value="advanced">Advanced (3+ years)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
          <select
            value={formData.goal || 'hypertrophy'}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value as Goal })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="hypertrophy">Muscle Growth</option>
            <option value="strength">Strength</option>
            <option value="fat_loss">Fat Loss</option>
            <option value="endurance">Endurance</option>
            <option value="power">Power</option>
            <option value="general_health">General Health</option>
            <option value="rehab">Rehabilitation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Days Per Week</label>
          <input
            type="number"
            value={formData.days_per_week || 3}
            onChange={(e) => setFormData({ ...formData, days_per_week: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            min="1"
            max="7"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minutes Per Session</label>
          <input
            type="number"
            value={formData.minutes_per_session || 60}
            onChange={(e) => setFormData({ ...formData, minutes_per_session: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            min="10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Progression Approach</label>
          <select
            value={formData.strictness || 'balanced'}
            onChange={(e) => setFormData({ ...formData, strictness: e.target.value as Strictness })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="conservative">Conservative (slower, safer)</option>
            <option value="balanced">Balanced (recommended)</option>
            <option value="aggressive">Aggressive (faster, higher risk)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Hours (optional)</label>
          <input
            type="number"
            step="0.5"
            value={formData.sleep_hours || ''}
            onChange={(e) => setFormData({ ...formData, sleep_hours: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="7.5"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Available Equipment</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['bodyweight', 'dumbbells', 'barbell', 'machines', 'bands', 'kettlebells'].map((equip) => (
            <button
              key={equip}
              type="button"
              onClick={() => handleEquipmentToggle(equip)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                (formData.primary_equipment || []).includes(equip)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {equip.charAt(0).toUpperCase() + equip.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Injuries or Limitations (optional)
        </label>
        <textarea
          value={formData.injuries_or_limitations || ''}
          onChange={(e) => setFormData({ ...formData, injuries_or_limitations: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Any injuries, pain, or movement restrictions..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferences (optional)
        </label>
        <textarea
          value={formData.preferences || ''}
          onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Exercise preferences, schedule constraints, etc..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating Plan...' : 'Generate My Plan'}
      </button>
    </form>
  );
}
