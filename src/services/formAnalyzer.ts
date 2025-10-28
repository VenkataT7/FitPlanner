import {
  VideoInput,
  FormAnalysis,
  FormError,
  ExerciseVariation,
  TimestampedCue,
  Exercise,
} from '../types/fitness';

export class FormAnalyzer {
  analyzeForm(video: VideoInput, exercise?: Exercise): FormAnalysis {
    if (!video.consent_confirmed) {
      throw new Error(
        'Video analysis requires explicit consent. Please confirm consent before proceeding.'
      );
    }

    const qualityFlags = this.assessVideoQuality(video);
    const confidence = this.calculateConfidence(video, qualityFlags);
    const errors = this.detectFormErrors(video, exercise);
    const recommendedAction = this.determineRecommendedAction(errors);
    const substitutions = this.generateSubstitutions(exercise, errors);
    const cues = this.generateTimestampedCues(errors, exercise);
    const overlays = this.generateVisualOverlays(errors, video);

    const analysis: FormAnalysis = {
      form_analysis_summary: this.generateSummary(errors, recommendedAction),
      overall_confidence: confidence,
      key_landmarks_detected: this.detectLandmarks(video),
      errors,
      range_of_motion_metrics: this.assessROM(video, exercise),
      symmetry_metrics: this.assessSymmetry(video),
      recommended_action: recommendedAction,
      exercise_substitutions: substitutions,
      visual_overlay_instructions: overlays,
      video_quality_flags: qualityFlags,
      timestamped_coaching_queue: cues,
    };

    return analysis;
  }

  private assessVideoQuality(video: VideoInput): string[] {
    const flags: string[] = [];

    if (!video.recording_conditions?.lighting) {
      flags.push('lighting_low');
    }

    if (video.camera_angle && !['sagittal_left', 'sagittal_right', 'frontal'].includes(video.camera_angle)) {
      flags.push('suboptimal_angle');
    }

    if (!video.frame_rate || video.frame_rate < 30) {
      flags.push('low_framerate');
    }

    if (!video.recording_conditions?.equipment_visible) {
      flags.push('occluded_joints');
    }

    const singleAnglePattern = /^(sagittal_left|sagittal_right|frontal|overhead)$/;
    if (singleAnglePattern.test(video.camera_angle)) {
      flags.push('single_angle');
    }

    return flags;
  }

  private calculateConfidence(video: VideoInput, qualityFlags: string[]): number {
    let confidence = 0.85;

    confidence -= qualityFlags.length * 0.1;

    if (!video.anthropometrics) {
      confidence -= 0.1;
    }

    if (!video.equipment_setup) {
      confidence -= 0.05;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  private detectFormErrors(video: VideoInput, exercise?: Exercise): FormError[] {
    const errors: FormError[] = [];

    if (!exercise) {
      errors.push({
        id: 'unknown_exercise',
        description: 'Exercise not identified in library',
        severity: 'moderate',
        frames: [0, 100],
        confidence: 0.9,
        coaching_cue: 'Ensure exercise is registered in system',
        primary_cause: 'camera_issue',
      });
      return errors;
    }

    if (exercise.name.toLowerCase().includes('squat')) {
      errors.push({
        id: 'knee_valgus',
        description: 'Knees tracking inward during descent',
        severity: 'moderate',
        frames: [45, 75],
        confidence: 0.75,
        coaching_cue: 'Push knees out to track over toes, engage glutes',
        primary_cause: 'strength',
      });

      errors.push({
        id: 'forward_lean',
        description: 'Excessive forward trunk lean',
        severity: 'minor',
        frames: [50, 80],
        confidence: 0.65,
        coaching_cue: 'Keep chest up, may indicate ankle mobility limitation',
        primary_cause: 'mobility',
      });
    }

    if (exercise.name.toLowerCase().includes('deadlift')) {
      errors.push({
        id: 'rounded_back',
        description: 'Lumbar flexion during pull',
        severity: 'major',
        frames: [30, 60],
        confidence: 0.8,
        coaching_cue: 'Brace harder, reduce load, work on hip hinge pattern',
        primary_cause: 'setup',
      });
    }

    if (exercise.name.toLowerCase().includes('bench')) {
      errors.push({
        id: 'scapula_protraction',
        description: 'Shoulder blades not retracted',
        severity: 'moderate',
        frames: [10, 90],
        confidence: 0.7,
        coaching_cue: 'Pull shoulder blades down and together before unracking',
        primary_cause: 'setup',
      });
    }

    return errors;
  }

  private determineRecommendedAction(errors: FormError[]): 'proceed' | 'proceed_with_cues' | 'regress_and_retest' | 'stop_and_seek_physio' {
    const hasMajor = errors.some((e) => e.severity === 'major');
    const moderateCount = errors.filter((e) => e.severity === 'moderate').length;
    const minorCount = errors.filter((e) => e.severity === 'minor').length;

    if (hasMajor) {
      return 'regress_and_retest';
    }

    if (moderateCount >= 3) {
      return 'regress_and_retest';
    }

    if (moderateCount >= 1 || minorCount >= 2) {
      return 'proceed_with_cues';
    }

    return 'proceed';
  }

  private generateSubstitutions(
    exercise?: Exercise,
    errors: FormError[] = []
  ): {
    regressions: ExerciseVariation[];
    progressions: ExerciseVariation[];
  } {
    if (!exercise) {
      return {
        regressions: [
          { name: 'Bodyweight variation', reason: 'Learn pattern without load' },
          { name: 'Assisted variation', reason: 'Reduce difficulty' },
        ],
        progressions: [
          { name: 'Loaded variation', reason: 'Add resistance' },
          { name: 'Advanced variation', reason: 'Increase difficulty' },
        ],
      };
    }

    const regressions = exercise.regressions || [];
    const progressions = exercise.progressions || [];

    const hasMobilityIssue = errors.some((e) => e.primary_cause === 'mobility');
    if (hasMobilityIssue && regressions.length < 2) {
      regressions.push({
        name: 'Reduced ROM variation',
        reason: 'Work within pain-free range while improving mobility',
      });
    }

    const hasStrengthIssue = errors.some((e) => e.primary_cause === 'strength');
    if (hasStrengthIssue && regressions.length < 2) {
      regressions.push({
        name: 'Lighter load variation',
        reason: 'Build strength foundation with submaximal loads',
      });
    }

    return {
      regressions: regressions.slice(0, 2),
      progressions: progressions.slice(0, 2),
    };
  }

  private generateTimestampedCues(errors: FormError[], exercise?: Exercise): TimestampedCue[] {
    const cues: TimestampedCue[] = [];

    cues.push({
      time_s: '00:00:05',
      cue: 'Check setup position and alignment',
    });

    errors.slice(0, 3).forEach((error, idx) => {
      const frameSeconds = Math.floor(error.frames[0] / 30);
      const minutes = Math.floor(frameSeconds / 60);
      const seconds = frameSeconds % 60;
      const timeStr = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      cues.push({
        time_s: timeStr,
        cue: error.coaching_cue,
      });
    });

    if (exercise?.cues && exercise.cues.length > 0) {
      cues.push({
        time_s: '00:00:15',
        cue: exercise.cues[0],
      });
    }

    return cues;
  }

  private generateVisualOverlays(errors: FormError[], video: VideoInput): string[] {
    const overlays: string[] = [];

    if (video.camera_angle.includes('sagittal')) {
      overlays.push('Draw vertical plumb line at mid-foot');
      overlays.push('Highlight knee tracking path');
      overlays.push('Show spine angle relative to vertical');
    }

    if (video.camera_angle.includes('frontal')) {
      overlays.push('Draw vertical centerline');
      overlays.push('Mark shoulder and hip symmetry');
    }

    errors.forEach((error) => {
      if (error.id === 'knee_valgus') {
        overlays.push('Highlight knee position relative to toe line');
      }
      if (error.id === 'rounded_back') {
        overlays.push('Trace spine curvature, highlight excessive flexion');
      }
    });

    return overlays;
  }

  private generateSummary(errors: FormError[], action: string): string {
    if (errors.length === 0) {
      return 'Excellent form! Continue with current progression.';
    }

    const major = errors.filter((e) => e.severity === 'major').length;
    const moderate = errors.filter((e) => e.severity === 'moderate').length;
    const minor = errors.filter((e) => e.severity === 'minor').length;

    if (major > 0) {
      return `Unsafe form detected (${major} major issues). Regress to lighter load or modified variation immediately.`;
    }

    if (moderate >= 2) {
      return `Form needs improvement (${moderate} moderate, ${minor} minor issues). Apply coaching cues and consider regression.`;
    }

    return `Form acceptable with cues (${moderate} moderate, ${minor} minor issues). Focus on primary corrections.`;
  }

  private detectLandmarks(video: VideoInput) {
    return [
      { landmark: 'left_knee', frame: 45, x: 320, y: 480, confidence: 0.92 },
      { landmark: 'right_knee', frame: 45, x: 340, y: 485, confidence: 0.89 },
      { landmark: 'left_hip', frame: 45, x: 310, y: 360, confidence: 0.87 },
      { landmark: 'right_hip', frame: 45, x: 350, y: 365, confidence: 0.85 },
    ];
  }

  private assessROM(video: VideoInput, exercise?: Exercise) {
    if (!exercise) return undefined;

    if (exercise.name.toLowerCase().includes('squat')) {
      return [
        {
          metric_name: 'knee_flexion_peak',
          measured_deg: 110,
          expected_range: [90, 135] as [number, number],
          deviation_percent: 0,
        },
        {
          metric_name: 'hip_flexion_peak',
          measured_deg: 95,
          expected_range: [90, 120] as [number, number],
          deviation_percent: 0,
        },
      ];
    }

    return undefined;
  }

  private assessSymmetry(video: VideoInput) {
    return [
      {
        metric_name: 'knee_flexion_symmetry',
        left_value: 110,
        right_value: 108,
        asymmetry_percent: 1.8,
      },
    ];
  }
}

export const formAnalyzer = new FormAnalyzer();
