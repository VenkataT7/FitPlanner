import { useState, useRef } from 'react';
import { VideoInput, FormAnalysis, Exercise } from '../types/fitness';
import { Video, AlertTriangle, CheckCircle, XCircle, Camera, Upload, Loader } from 'lucide-react';
import { realFormAnalyzer } from '../services/realFormAnalyzer';

interface VideoAnalysisProps {
  exercises: Exercise[];
  onAnalysisComplete?: (analysis: FormAnalysis) => void;
}

export function VideoAnalysis({ exercises, onAnalysisComplete }: VideoAnalysisProps) {
  const [videoInput, setVideoInput] = useState<Partial<VideoInput>>({
    camera_angle: 'sagittal_right',
    consent_confirmed: false,
  });
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Video file size must be less than 100MB.');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setError(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    setError(null);
    setProgress(0);

    if (!videoInput.consent_confirmed) {
      setError('You must confirm consent to video analysis before proceeding.');
      return;
    }

    if (!videoInput.exercise_id) {
      setError('Please select an exercise.');
      return;
    }

    if (!videoFile || !videoRef.current) {
      setError('Please upload a video file first.');
      return;
    }

    setAnalyzing(true);

    try {
      const exercise = exercises.find((e) => e.id === videoInput.exercise_id);
      if (!exercise) {
        throw new Error('Exercise not found');
      }

      const result = await realFormAnalyzer.analyzeVideoWithPoses(
        videoRef.current,
        {
          video_id: crypto.randomUUID(),
          ...videoInput,
        } as VideoInput,
        exercise,
        (progress) => setProgress(progress)
      );

      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Form Analysis</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Video</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">
                  {videoFile ? videoFile.name : 'Click to upload workout video'}
                </span>
                <span className="text-xs text-gray-500">MP4, MOV, AVI (max 100MB)</span>
              </button>
            </div>
          </div>

          {videoUrl && (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full"
                preload="metadata"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exercise</label>
            <select
              value={videoInput.exercise_id || ''}
              onChange={(e) => setVideoInput({ ...videoInput, exercise_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an exercise...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Camera Angle</label>
            <select
              value={videoInput.camera_angle}
              onChange={(e) => setVideoInput({ ...videoInput, camera_angle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sagittal_right">Side View (Right)</option>
              <option value="sagittal_left">Side View (Left)</option>
              <option value="frontal">Front View</option>
              <option value="overhead">Overhead View</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <div className="font-semibold text-gray-900 mb-2">Camera Setup Tips:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Place camera 8-12 feet away</li>
                  <li>Ensure full body is visible in frame</li>
                  <li>Use stable surface (no handheld)</li>
                  <li>Good lighting, avoid backlight</li>
                  <li>Record at least 3 reps</li>
                  <li>30+ fps recommended</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={videoInput.consent_confirmed}
                onChange={(e) => setVideoInput({ ...videoInput, consent_confirmed: e.target.checked })}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">I consent to video analysis</span>
                <p className="mt-1 text-xs">
                  I understand that my video will be analyzed for form assessment. Video data is processed
                  locally and can be deleted upon request. No personally identifiable information is stored
                  without explicit permission.
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !videoInput.consent_confirmed || !videoInput.exercise_id || !videoFile}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Analyzing Form... {Math.round(progress)}%</span>
              </>
            ) : (
              'Analyze Form'
            )}
          </button>

          {analyzing && progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>
      </div>

      {analysis && <FormAnalysisDisplay analysis={analysis} />}
    </div>
  );
}

function FormAnalysisDisplay({ analysis }: { analysis: FormAnalysis }) {
  const actionConfig = {
    proceed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Good to Proceed',
    },
    proceed_with_cues: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Proceed with Corrections',
    },
    regress_and_retest: {
      icon: XCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      label: 'Regress and Retest',
    },
    stop_and_seek_physio: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Stop - Seek Professional Help',
    },
  };

  const config = actionConfig[analysis.recommended_action];
  const ActionIcon = config.icon;

  return (
    <div className="space-y-6">
      <div className={`${config.bg} border-2 ${config.border} p-6 rounded-lg`}>
        <div className="flex items-start gap-4">
          <ActionIcon className={`w-8 h-8 ${config.color} flex-shrink-0`} />
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${config.color} mb-2`}>{config.label}</h3>
            <p className="text-gray-800 mb-3">{analysis.form_analysis_summary}</p>
            <div className="text-sm text-gray-600">
              Analysis Confidence: {(analysis.overall_confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {analysis.video_quality_flags.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Video Quality Notes:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {analysis.video_quality_flags.map((flag, idx) => (
              <li key={idx}>{flag.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.errors.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detected Issues</h3>
          <div className="space-y-4">
            {analysis.errors.map((error) => {
              const severityColor =
                error.severity === 'major'
                  ? 'text-red-600 bg-red-50 border-red-200'
                  : error.severity === 'moderate'
                  ? 'text-orange-600 bg-orange-50 border-orange-200'
                  : 'text-yellow-600 bg-yellow-50 border-yellow-200';

              return (
                <div key={error.id} className={`border rounded-lg p-4 ${severityColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold capitalize">{error.severity} Issue</h4>
                    <span className="text-xs bg-white px-2 py-1 rounded">
                      {(error.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  <p className="text-sm mb-2">{error.description}</p>
                  <div className="bg-white/50 rounded p-3 mt-2">
                    <div className="font-semibold text-sm mb-1">Coaching Cue:</div>
                    <p className="text-sm">{error.coaching_cue}</p>
                  </div>
                  <div className="text-xs mt-2">
                    Primary Cause: <span className="font-semibold">{error.primary_cause.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysis.timestamped_coaching_queue.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Key Coaching Points</h3>
          <div className="space-y-3">
            {analysis.timestamped_coaching_queue.map((cue, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded">
                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                  {cue.time_s}
                </span>
                <span className="text-sm text-gray-700">{cue.cue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Regressions</h3>
          <p className="text-sm text-gray-600 mb-3">Consider these easier variations:</p>
          <div className="space-y-3">
            {analysis.exercise_substitutions.regressions.map((reg, idx) => (
              <div key={idx} className="border-l-4 border-orange-400 pl-3">
                <div className="font-semibold text-gray-900">{reg.name}</div>
                <div className="text-sm text-gray-600">{reg.reason}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Progressions</h3>
          <p className="text-sm text-gray-600 mb-3">Once form is solid, try:</p>
          <div className="space-y-3">
            {analysis.exercise_substitutions.progressions.map((prog, idx) => (
              <div key={idx} className="border-l-4 border-green-400 pl-3">
                <div className="font-semibold text-gray-900">{prog.name}</div>
                <div className="text-sm text-gray-600">{prog.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis.visual_overlay_instructions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Visual Reference Points</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            {analysis.visual_overlay_instructions.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
