import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

export interface PoseKeypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: PoseKeypoint[];
  score?: number;
}

export interface PoseAnalysisResult {
  poses: Pose[];
  frameNumber: number;
  timestamp: number;
}

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await tf.ready();
      await tf.setBackend('webgl');

      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        enableSmoothing: true,
        minPoseScore: 0.25,
      };

      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize pose detector:', error);
      throw new Error('Failed to initialize pose detection. Please refresh and try again.');
    }
  }

  async detectPosesInVideo(
    videoElement: HTMLVideoElement,
    onProgress?: (progress: number) => void
  ): Promise<PoseAnalysisResult[]> {
    if (!this.detector) {
      throw new Error('Pose detector not initialized');
    }

    const results: PoseAnalysisResult[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const fps = 30;
    const frameInterval = 1 / fps;
    const duration = videoElement.duration;
    const totalFrames = Math.floor(duration * fps);

    let frameNumber = 0;

    for (let time = 0; time < duration; time += frameInterval) {
      videoElement.currentTime = time;

      await new Promise<void>((resolve) => {
        const seeked = () => {
          videoElement.removeEventListener('seeked', seeked);
          resolve();
        };
        videoElement.addEventListener('seeked', seeked);
      });

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      try {
        const poses = await this.detector.estimatePoses(canvas);

        results.push({
          poses: poses.map((pose) => ({
            keypoints: pose.keypoints.map((kp) => ({
              x: kp.x,
              y: kp.y,
              score: kp.score,
              name: kp.name,
            })),
            score: pose.score,
          })),
          frameNumber,
          timestamp: time,
        });

        if (onProgress) {
          const progress = (frameNumber / totalFrames) * 100;
          onProgress(progress);
        }
      } catch (error) {
        console.error(`Error detecting pose at frame ${frameNumber}:`, error);
      }

      frameNumber++;
    }

    return results;
  }

  async detectPosesInFrame(imageData: ImageData): Promise<Pose[]> {
    if (!this.detector) {
      throw new Error('Pose detector not initialized');
    }

    const poses = await this.detector.estimatePoses(imageData);

    return poses.map((pose) => ({
      keypoints: pose.keypoints.map((kp) => ({
        x: kp.x,
        y: kp.y,
        score: kp.score,
        name: kp.name,
      })),
      score: pose.score,
    }));
  }

  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.initialized = false;
    }
  }

  getKeypointByName(pose: Pose, name: string): PoseKeypoint | undefined {
    return pose.keypoints.find((kp) => kp.name === name);
  }

  calculateAngle(p1: PoseKeypoint, p2: PoseKeypoint, p3: PoseKeypoint): number {
    const radians =
      Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
      angle = 360.0 - angle;
    }

    return angle;
  }

  calculateDistance(p1: PoseKeypoint, p2: PoseKeypoint): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
}

export const poseDetectionService = new PoseDetectionService();
