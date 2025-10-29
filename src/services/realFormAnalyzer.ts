import { FormAnalysis, FormError, Exercise, VideoInput } from '../types/fitness';
import { PoseAnalysisResult, Pose, PoseKeypoint, poseDetectionService } from './poseDetection';

export class RealFormAnalyzer {
  async analyzeVideoWithPoses(
    videoElement: HTMLVideoElement,
    videoInput: VideoInput,
    exercise: Exercise,
    onProgress?: (progress: number) => void
  ): Promise<FormAnalysis> {
    if (!videoInput.consent_confirmed) {
      throw new Error('Video analysis requires explicit consent.');
    }

    await poseDetectionService.initialize();

    const poseResults = await poseDetectionService.detectPosesInVideo(
      videoElement,
      onProgress
    );

    const errors = this.analyzeFormFromPoses(poseResults, exercise);
    const qualityFlags = this.assessVideoQuality(poseResults);
    const confidence = this.calculateConfidence(poseResults, qualityFlags);
    const recommendedAction = this.determineRecommendedAction(errors);

    const analysis: FormAnalysis = {
      form_analysis_summary: this.generateSummary(errors, recommendedAction),
      overall_confidence: confidence,
      key_landmarks_detected: this.extractKeyLandmarks(poseResults),
      errors,
      range_of_motion_metrics: this.assessROM(poseResults, exercise),
      symmetry_metrics: this.assessSymmetry(poseResults),
      recommended_action: recommendedAction,
      exercise_substitutions: this.generateSubstitutions(exercise, errors),
      visual_overlay_instructions: this.generateVisualOverlays(errors, videoInput),
      video_quality_flags: qualityFlags,
      timestamped_coaching_queue: this.generateTimestampedCues(errors, exercise),
    };

    return analysis;
  }

  private analyzeFormFromPoses(poseResults: PoseAnalysisResult[], exercise: Exercise): FormError[] {
    const errors: FormError[] = [];

    if (poseResults.length === 0) {
      errors.push({
        id: 'no_pose_detected',
        description: 'No person detected in video',
        severity: 'major',
        frames: [0, 0],
        confidence: 1.0,
        coaching_cue: 'Ensure full body is visible in frame with good lighting',
        primary_cause: 'camera_issue',
      });
      return errors;
    }

    const exerciseName = exercise.name.toLowerCase();

    if (exerciseName.includes('squat')) {
      errors.push(...this.analyzeSquat(poseResults));
    } else if (exerciseName.includes('deadlift')) {
      errors.push(...this.analyzeDeadlift(poseResults));
    } else if (exerciseName.includes('bench')) {
      errors.push(...this.analyzeBenchPress(poseResults));
    } else if (exerciseName.includes('push')) {
      errors.push(...this.analyzePushUp(poseResults));
    } else if (exerciseName.includes('lunge')) {
      errors.push(...this.analyzeLunge(poseResults));
    }

    return errors;
  }

  private analyzeSquat(poseResults: PoseAnalysisResult[]): FormError[] {
    const errors: FormError[] = [];

    for (let i = 0; i < poseResults.length; i++) {
      const result = poseResults[i];
      if (result.poses.length === 0) continue;

      const pose = result.poses[0];
      const leftHip = poseDetectionService.getKeypointByName(pose, 'left_hip');
      const rightHip = poseDetectionService.getKeypointByName(pose, 'right_hip');
      const leftKnee = poseDetectionService.getKeypointByName(pose, 'left_knee');
      const rightKnee = poseDetectionService.getKeypointByName(pose, 'right_knee');
      const leftAnkle = poseDetectionService.getKeypointByName(pose, 'left_ankle');
      const rightAnkle = poseDetectionService.getKeypointByName(pose, 'right_ankle');
      const leftShoulder = poseDetectionService.getKeypointByName(pose, 'left_shoulder');
      const rightShoulder = poseDetectionService.getKeypointByName(pose, 'right_shoulder');

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
        continue;
      }

      const avgHipY = (leftHip.y + rightHip.y) / 2;
      const avgKneeY = (leftKnee.y + rightKnee.y) / 2;
      const isBottomPosition = avgHipY > avgKneeY - 20;

      if (isBottomPosition) {
        const kneeAnkleDistanceLeft = Math.abs(leftKnee.x - leftAnkle.x);
        const kneeAnkleDistanceRight = Math.abs(rightKnee.x - rightAnkle.x);

        if (kneeAnkleDistanceLeft > 50 || kneeAnkleDistanceRight > 50) {
          errors.push({
            id: 'knee_valgus',
            description: 'Knees tracking inward during descent',
            severity: 'moderate',
            frames: [result.frameNumber, result.frameNumber],
            confidence: 0.75,
            coaching_cue: 'Push knees out to track over toes, engage glutes',
            primary_cause: 'strength',
          });
          break;
        }

        if (leftShoulder && rightShoulder) {
          const shoulderHipAngleLeft = this.calculateVerticalDeviation(leftShoulder, leftHip);
          const shoulderHipAngleRight = this.calculateVerticalDeviation(rightShoulder, rightHip);

          if (shoulderHipAngleLeft > 30 || shoulderHipAngleRight > 30) {
            errors.push({
              id: 'forward_lean',
              description: 'Excessive forward trunk lean',
              severity: 'minor',
              frames: [result.frameNumber, result.frameNumber],
              confidence: 0.65,
              coaching_cue: 'Keep chest up, may indicate ankle mobility limitation',
              primary_cause: 'mobility',
            });
            break;
          }
        }
      }
    }

    return errors;
  }

  private analyzeDeadlift(poseResults: PoseAnalysisResult[]): FormError[] {
    const errors: FormError[] = [];

    for (let i = 0; i < poseResults.length; i++) {
      const result = poseResults[i];
      if (result.poses.length === 0) continue;

      const pose = result.poses[0];
      const leftShoulder = poseDetectionService.getKeypointByName(pose, 'left_shoulder');
      const rightShoulder = poseDetectionService.getKeypointByName(pose, 'right_shoulder');
      const leftHip = poseDetectionService.getKeypointByName(pose, 'left_hip');
      const rightHip = poseDetectionService.getKeypointByName(pose, 'right_hip');
      const leftKnee = poseDetectionService.getKeypointByName(pose, 'left_knee');
      const rightKnee = poseDetectionService.getKeypointByName(pose, 'right_knee');

      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftKnee || !rightKnee) {
        continue;
      }

      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const avgHipY = (leftHip.y + rightHip.y) / 2;
      const avgKneeY = (leftKnee.y + rightKnee.y) / 2;

      const isInPullPosition = avgHipY < avgShoulderY && avgHipY > avgKneeY;

      if (isInPullPosition) {
        const spineDeviation = Math.abs(avgShoulderY - avgHipY) / Math.abs(leftShoulder.x - leftHip.x);

        if (spineDeviation < 0.5) {
          errors.push({
            id: 'rounded_back',
            description: 'Lumbar flexion during pull',
            severity: 'major',
            frames: [result.frameNumber, result.frameNumber],
            confidence: 0.8,
            coaching_cue: 'Brace harder, reduce load, work on hip hinge pattern',
            primary_cause: 'setup',
          });
          break;
        }
      }
    }

    return errors;
  }

  private analyzeBenchPress(poseResults: PoseAnalysisResult[]): FormError[] {
    const errors: FormError[] = [];

    for (let i = 0; i < poseResults.length; i++) {
      const result = poseResults[i];
      if (result.poses.length === 0) continue;

      const pose = result.poses[0];
      const leftShoulder = poseDetectionService.getKeypointByName(pose, 'left_shoulder');
      const rightShoulder = poseDetectionService.getKeypointByName(pose, 'right_shoulder');
      const leftElbow = poseDetectionService.getKeypointByName(pose, 'left_elbow');
      const rightElbow = poseDetectionService.getKeypointByName(pose, 'right_elbow');

      if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow) {
        continue;
      }

      const shoulderWidth = poseDetectionService.calculateDistance(leftShoulder, rightShoulder);
      const elbowWidth = poseDetectionService.calculateDistance(leftElbow, rightElbow);

      if (elbowWidth > shoulderWidth * 1.5) {
        errors.push({
          id: 'scapula_protraction',
          description: 'Shoulder blades not retracted',
          severity: 'moderate',
          frames: [result.frameNumber, result.frameNumber],
          confidence: 0.7,
          coaching_cue: 'Pull shoulder blades down and together before unracking',
          primary_cause: 'setup',
        });
        break;
      }
    }

    return errors;
  }

  private analyzePushUp(poseResults: PoseAnalysisResult[]): FormError[] {
    const errors: FormError[] = [];

    for (let i = 0; i < poseResults.length; i++) {
      const result = poseResults[i];
      if (result.poses.length === 0) continue;

      const pose = result.poses[0];
      const leftShoulder = poseDetectionService.getKeypointByName(pose, 'left_shoulder');
      const leftHip = poseDetectionService.getKeypointByName(pose, 'left_hip');
      const leftAnkle = poseDetectionService.getKeypointByName(pose, 'left_ankle');

      if (!leftShoulder || !leftHip || !leftAnkle) {
        continue;
      }

      const bodyAngle = poseDetectionService.calculateAngle(leftShoulder, leftHip, leftAnkle);

      if (bodyAngle < 160) {
        errors.push({
          id: 'sagging_hips',
          description: 'Hips sagging, core not engaged',
          severity: 'moderate',
          frames: [result.frameNumber, result.frameNumber],
          confidence: 0.8,
          coaching_cue: 'Brace your core and maintain a straight line from head to heels',
          primary_cause: 'strength',
        });
        break;
      }
    }

    return errors;
  }

  private analyzeLunge(poseResults: PoseAnalysisResult[]): FormError[] {
    const errors: FormError[] = [];

    for (let i = 0; i < poseResults.length; i++) {
      const result = poseResults[i];
      if (result.poses.length === 0) continue;

      const pose = result.poses[0];
      const leftKnee = poseDetectionService.getKeypointByName(pose, 'left_knee');
      const rightKnee = poseDetectionService.getKeypointByName(pose, 'right_knee');
      const leftAnkle = poseDetectionService.getKeypointByName(pose, 'left_ankle');
      const rightAnkle = poseDetectionService.getKeypointByName(pose, 'right_ankle');

      if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
        continue;
      }

      const leftKneeOverToe = leftKnee.x - leftAnkle.x;
      const rightKneeOverToe = rightKnee.x - rightAnkle.x;

      if (Math.abs(leftKneeOverToe) > 50 || Math.abs(rightKneeOverToe) > 50) {
        errors.push({
          id: 'knee_over_toe',
          description: 'Front knee traveling too far forward',
          severity: 'moderate',
          frames: [result.frameNumber, result.frameNumber],
          confidence: 0.75,
          coaching_cue: 'Keep front knee over ankle, increase stride length',
          primary_cause: 'setup',
        });
        break;
      }
    }

    return errors;
  }

  private calculateVerticalDeviation(upper: PoseKeypoint, lower: PoseKeypoint): number {
    return Math.abs(Math.atan2(lower.y - upper.y, lower.x - upper.x) * (180 / Math.PI));
  }

  private assessVideoQuality(poseResults: PoseAnalysisResult[]): string[] {
    const flags: string[] = [];

    const posesDetected = poseResults.filter((r) => r.poses.length > 0).length;
    const detectionRate = posesDetected / poseResults.length;

    if (detectionRate < 0.7) {
      flags.push('low_detection_rate');
    }

    const avgConfidence =
      poseResults.reduce((sum, r) => {
        const poseScore = r.poses[0]?.score || 0;
        return sum + poseScore;
      }, 0) / poseResults.length;

    if (avgConfidence < 0.5) {
      flags.push('low_confidence');
    }

    return flags;
  }

  private calculateConfidence(poseResults: PoseAnalysisResult[], qualityFlags: string[]): number {
    let confidence = 0.85;

    confidence -= qualityFlags.length * 0.15;

    const posesDetected = poseResults.filter((r) => r.poses.length > 0).length;
    const detectionRate = posesDetected / poseResults.length;

    confidence *= detectionRate;

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  private determineRecommendedAction(
    errors: FormError[]
  ): 'proceed' | 'proceed_with_cues' | 'regress_and_retest' | 'stop_and_seek_physio' {
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

  private generateSubstitutions(exercise: Exercise, errors: FormError[]) {
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

  private generateTimestampedCues(errors: FormError[], exercise: Exercise) {
    const cues = [
      {
        time_s: '00:00:05',
        cue: 'Check setup position and alignment',
      },
    ];

    errors.slice(0, 3).forEach((error) => {
      const frameSeconds = Math.floor(error.frames[0] / 30);
      const minutes = Math.floor(frameSeconds / 60);
      const seconds = frameSeconds % 60;
      const timeStr = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      cues.push({
        time_s: timeStr,
        cue: error.coaching_cue,
      });
    });

    return cues;
  }

  private generateVisualOverlays(errors: FormError[], videoInput: VideoInput): string[] {
    const overlays: string[] = [];

    if (videoInput.camera_angle.includes('sagittal')) {
      overlays.push('Draw vertical plumb line at mid-foot');
      overlays.push('Highlight knee tracking path');
      overlays.push('Show spine angle relative to vertical');
    }

    if (videoInput.camera_angle.includes('frontal')) {
      overlays.push('Draw vertical centerline');
      overlays.push('Mark shoulder and hip symmetry');
    }

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

  private extractKeyLandmarks(poseResults: PoseAnalysisResult[]) {
    if (poseResults.length === 0 || poseResults[0].poses.length === 0) {
      return [];
    }

    const midFrameResult = poseResults[Math.floor(poseResults.length / 2)];
    const pose = midFrameResult.poses[0];

    return pose.keypoints
      .filter((kp) => (kp.score || 0) > 0.5)
      .map((kp) => ({
        landmark: kp.name || 'unknown',
        frame: midFrameResult.frameNumber,
        x: kp.x,
        y: kp.y,
        confidence: kp.score || 0,
      }));
  }

  private assessROM(poseResults: PoseAnalysisResult[], exercise: Exercise) {
    if (poseResults.length === 0) return undefined;

    const exerciseName = exercise.name.toLowerCase();

    if (exerciseName.includes('squat')) {
      let maxKneeFlexion = 0;
      let maxHipFlexion = 0;

      poseResults.forEach((result) => {
        if (result.poses.length === 0) return;

        const pose = result.poses[0];
        const leftHip = poseDetectionService.getKeypointByName(pose, 'left_hip');
        const leftKnee = poseDetectionService.getKeypointByName(pose, 'left_knee');
        const leftAnkle = poseDetectionService.getKeypointByName(pose, 'left_ankle');
        const leftShoulder = poseDetectionService.getKeypointByName(pose, 'left_shoulder');

        if (leftHip && leftKnee && leftAnkle) {
          const kneeAngle = poseDetectionService.calculateAngle(leftHip, leftKnee, leftAnkle);
          maxKneeFlexion = Math.max(maxKneeFlexion, 180 - kneeAngle);
        }

        if (leftShoulder && leftHip && leftKnee) {
          const hipAngle = poseDetectionService.calculateAngle(leftShoulder, leftHip, leftKnee);
          maxHipFlexion = Math.max(maxHipFlexion, 180 - hipAngle);
        }
      });

      return [
        {
          metric_name: 'knee_flexion_peak',
          measured_deg: Math.round(maxKneeFlexion),
          expected_range: [90, 135] as [number, number],
          deviation_percent: 0,
        },
        {
          metric_name: 'hip_flexion_peak',
          measured_deg: Math.round(maxHipFlexion),
          expected_range: [90, 120] as [number, number],
          deviation_percent: 0,
        },
      ];
    }

    return undefined;
  }

  private assessSymmetry(poseResults: PoseAnalysisResult[]) {
    if (poseResults.length === 0) return [];

    let leftKneeFlexions: number[] = [];
    let rightKneeFlexions: number[] = [];

    poseResults.forEach((result) => {
      if (result.poses.length === 0) return;

      const pose = result.poses[0];
      const leftHip = poseDetectionService.getKeypointByName(pose, 'left_hip');
      const leftKnee = poseDetectionService.getKeypointByName(pose, 'left_knee');
      const leftAnkle = poseDetectionService.getKeypointByName(pose, 'left_ankle');
      const rightHip = poseDetectionService.getKeypointByName(pose, 'right_hip');
      const rightKnee = poseDetectionService.getKeypointByName(pose, 'right_knee');
      const rightAnkle = poseDetectionService.getKeypointByName(pose, 'right_ankle');

      if (leftHip && leftKnee && leftAnkle) {
        const angle = poseDetectionService.calculateAngle(leftHip, leftKnee, leftAnkle);
        leftKneeFlexions.push(angle);
      }

      if (rightHip && rightKnee && rightAnkle) {
        const angle = poseDetectionService.calculateAngle(rightHip, rightKnee, rightAnkle);
        rightKneeFlexions.push(angle);
      }
    });

    if (leftKneeFlexions.length === 0 || rightKneeFlexions.length === 0) {
      return [];
    }

    const avgLeft = leftKneeFlexions.reduce((a, b) => a + b, 0) / leftKneeFlexions.length;
    const avgRight = rightKneeFlexions.reduce((a, b) => a + b, 0) / rightKneeFlexions.length;
    const asymmetry = Math.abs(avgLeft - avgRight);

    return [
      {
        metric_name: 'knee_flexion_symmetry',
        left_value: Math.round(avgLeft),
        right_value: Math.round(avgRight),
        asymmetry_percent: Math.round((asymmetry / avgLeft) * 100 * 10) / 10,
      },
    ];
  }
}

export const realFormAnalyzer = new RealFormAnalyzer();
