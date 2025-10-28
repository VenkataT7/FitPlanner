import {
  UserInput,
  FitnessPlan,
  Exercise,
  WeeklySession,
  SessionBlock,
  SessionExercise,
  ProgressionRule,
  SafetyMods,
  NutritionBrief,
  Milestone,
} from '../types/fitness';

export class PlanGenerator {
  validateInputs(input: UserInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (input.days_per_week < 1 || input.days_per_week > 7) {
      errors.push('days_per_week must be between 1 and 7');
    }

    if (input.minutes_per_session < 10) {
      errors.push('minutes_per_session must be at least 10');
    }

    if (input.age < 10 || input.age > 120) {
      errors.push('age must be between 10 and 120');
    }

    return { valid: errors.length === 0, errors };
  }

  generatePlan(input: UserInput): FitnessPlan {
    const validation = this.validateInputs(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const exerciseLibrary = this.buildExerciseLibrary(input);
    const weeklyStructure = this.buildWeeklyStructure(input, exerciseLibrary);
    const progressionRules = this.buildProgressionRules(input);
    const safetyMods = this.buildSafetyMods(input);
    const nutritionBrief = this.buildNutritionBrief(input);
    const milestones = this.estimateMilestones(input);

    const plan: FitnessPlan = {
      user_id: input.user_id || 'anonymous',
      created_at: new Date().toISOString(),
      plan_version: 1,
      training_focus: input.goal,
      confidence: this.calculateConfidence(input),
      weekly_structure: weeklyStructure,
      exercise_library: exerciseLibrary,
      progression_rules: progressionRules,
      safety_and_mods: safetyMods,
      nutrition_brief: nutritionBrief,
      tracking_recommendations: this.buildTrackingRecommendations(),
      sample_week: {
        week_index: 1,
        sessions: weeklyStructure,
      },
      estimated_milestones: milestones,
    };

    return plan;
  }

  private buildExerciseLibrary(input: UserInput): Exercise[] {
    const exercises: Exercise[] = [];
    const equipment = input.primary_equipment;

    if (equipment.includes('barbell') || equipment.includes('bodyweight')) {
      exercises.push({
        id: 'squat',
        name: 'Barbell Back Squat',
        primary_muscles: ['quadriceps', 'glutes'],
        secondary_muscles: ['hamstrings', 'core', 'erectors'],
        equipment: ['barbell', 'rack'],
        cues: [
          'Brace core before descent',
          'Break at hips and knees simultaneously',
          'Keep chest up and neutral spine',
          'Drive through midfoot',
          'Full hip extension at top',
        ],
        regressions: [
          { name: 'Goblet Squat', reason: 'Easier loading, teaches upright posture' },
          { name: 'Box Squat', reason: 'Reduced range of motion, builds confidence' },
        ],
        progressions: [
          { name: 'Front Squat', reason: 'Increased quad emphasis, core demand' },
          { name: 'Paused Squat', reason: 'Builds strength out of the hole' },
        ],
        duration_min_estimate: 8,
      });
    }

    if (equipment.includes('barbell')) {
      exercises.push({
        id: 'deadlift',
        name: 'Conventional Deadlift',
        primary_muscles: ['hamstrings', 'glutes', 'erectors'],
        secondary_muscles: ['lats', 'traps', 'grip'],
        equipment: ['barbell'],
        cues: [
          'Hinge at hips to grip bar',
          'Pull slack out of bar',
          'Brace hard and drive floor away',
          'Keep bar close to body',
          'Full hip lockout at top',
        ],
        regressions: [
          { name: 'Romanian Deadlift', reason: 'Reduced range, hip hinge focus' },
          { name: 'Trap Bar Deadlift', reason: 'More upright, easier to learn' },
        ],
        progressions: [
          { name: 'Deficit Deadlift', reason: 'Increased range of motion' },
          { name: 'Sumo Deadlift', reason: 'Different leverage, quad emphasis' },
        ],
        duration_min_estimate: 8,
      });

      exercises.push({
        id: 'bench',
        name: 'Barbell Bench Press',
        primary_muscles: ['pectorals', 'triceps'],
        secondary_muscles: ['anterior deltoids', 'serratus'],
        equipment: ['barbell', 'bench'],
        cues: [
          'Retract scapulae and maintain',
          'Arc bar path to mid-chest',
          'Touch chest with control',
          'Drive feet into ground',
          'Press bar up and slightly back',
        ],
        regressions: [
          { name: 'Dumbbell Bench Press', reason: 'Unilateral control, reduced load' },
          { name: 'Incline Bench Press', reason: 'Reduced ROM, shoulder-friendly' },
        ],
        progressions: [
          { name: 'Close Grip Bench', reason: 'Increased triceps emphasis' },
          { name: 'Paused Bench', reason: 'Eliminates stretch reflex' },
        ],
        duration_min_estimate: 7,
      });
    }

    if (equipment.includes('dumbbells') || equipment.includes('bodyweight')) {
      exercises.push({
        id: 'row',
        name: 'Dumbbell Row',
        primary_muscles: ['lats', 'rhomboids'],
        secondary_muscles: ['traps', 'biceps', 'rear delts'],
        equipment: ['dumbbells', 'bench'],
        cues: [
          'Hinge at hips, flat back',
          'Pull elbow to hip pocket',
          'Squeeze at top for 1 second',
          'Control eccentric',
          'Minimize torso rotation',
        ],
        regressions: [
          { name: 'Chest-Supported Row', reason: 'Eliminates lower back fatigue' },
          { name: 'Inverted Row', reason: 'Bodyweight alternative' },
        ],
        progressions: [
          { name: 'Barbell Row', reason: 'Heavier loading potential' },
          { name: 'Single-Arm Cable Row', reason: 'Constant tension' },
        ],
        duration_min_estimate: 6,
      });
    }

    exercises.push({
      id: 'plank',
      name: 'Front Plank',
      primary_muscles: ['core', 'abs'],
      secondary_muscles: ['shoulders', 'glutes'],
      equipment: ['bodyweight'],
      cues: [
        'Elbows under shoulders',
        'Squeeze glutes hard',
        'Neutral spine, dont sag',
        'Breathe steadily',
        'Body forms straight line',
      ],
      regressions: [
        { name: 'Incline Plank', reason: 'Reduced load on core' },
        { name: 'Knee Plank', reason: 'Shortened lever arm' },
      ],
      progressions: [
        { name: 'RKC Plank', reason: 'Max tension technique' },
        { name: 'Weighted Plank', reason: 'Added resistance' },
      ],
      duration_min_estimate: 3,
    });

    return exercises;
  }

  private buildWeeklyStructure(input: UserInput, exercises: Exercise[]): WeeklySession[] {
    const sessions: WeeklySession[] = [];
    const { days_per_week, minutes_per_session, goal, training_experience } = input;

    if (days_per_week <= 2) {
      for (let i = 0; i < days_per_week; i++) {
        sessions.push(this.createFullBodySession(i, minutes_per_session, exercises, goal, training_experience));
      }
    } else if (days_per_week === 3) {
      sessions.push(this.createFullBodySession(0, minutes_per_session, exercises, goal, training_experience));
      sessions.push(this.createFullBodySession(2, minutes_per_session, exercises, goal, training_experience));
      sessions.push(this.createFullBodySession(4, minutes_per_session, exercises, goal, training_experience));
    } else {
      const upperLower = days_per_week === 4;
      if (upperLower) {
        sessions.push(this.createUpperSession(0, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createLowerSession(1, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createUpperSession(3, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createLowerSession(4, minutes_per_session, exercises, goal, training_experience));
      } else {
        sessions.push(this.createPushSession(0, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createPullSession(1, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createLegSession(3, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createPushSession(4, minutes_per_session, exercises, goal, training_experience));
        sessions.push(this.createPullSession(5, minutes_per_session, exercises, goal, training_experience));
        if (days_per_week >= 6) {
          sessions.push(this.createLegSession(6, minutes_per_session, exercises, goal, training_experience));
        }
      }
    }

    return sessions;
  }

  private createFullBodySession(
    day: number,
    duration: number,
    exercises: Exercise[],
    goal: string,
    experience: string
  ): WeeklySession {
    const mainExercises = this.selectExercisesForFullBody(exercises, goal);
    const sets = this.getSetsForGoal(goal, experience);

    return {
      day_index: day,
      duration_min: duration,
      title: `Full Body ${day + 1}`,
      focus: 'Total body strength and conditioning',
      session_blocks: [
        this.createWarmupBlock(),
        this.createMainBlock(mainExercises, sets, goal),
        this.createCooldownBlock(),
      ],
    };
  }

  private createUpperSession(
    day: number,
    duration: number,
    exercises: Exercise[],
    goal: string,
    experience: string
  ): WeeklySession {
    const upperExercises = exercises.filter((ex) =>
      ex.primary_muscles.some((m) =>
        ['pectorals', 'lats', 'triceps', 'biceps', 'deltoids', 'traps', 'rhomboids'].includes(m)
      )
    );
    const sets = this.getSetsForGoal(goal, experience);

    return {
      day_index: day,
      duration_min: duration,
      title: `Upper Body`,
      focus: 'Chest, back, shoulders, and arms',
      session_blocks: [
        this.createWarmupBlock(),
        this.createMainBlock(upperExercises, sets, goal),
        this.createCooldownBlock(),
      ],
    };
  }

  private createLowerSession(
    day: number,
    duration: number,
    exercises: Exercise[],
    goal: string,
    experience: string
  ): WeeklySession {
    const lowerExercises = exercises.filter((ex) =>
      ex.primary_muscles.some((m) =>
        ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m)
      )
    );
    const sets = this.getSetsForGoal(goal, experience);

    return {
      day_index: day,
      duration_min: duration,
      title: `Lower Body`,
      focus: 'Legs and posterior chain',
      session_blocks: [
        this.createWarmupBlock(),
        this.createMainBlock(lowerExercises, sets, goal),
        this.createCooldownBlock(),
      ],
    };
  }

  private createPushSession(
    day: number,
    duration: number,
    exercises: Exercise[],
    goal: string,
    experience: string
  ): WeeklySession {
    const pushExercises = exercises.filter((ex) =>
      ex.primary_muscles.some((m) => ['pectorals', 'triceps', 'deltoids'].includes(m))
    );
    const sets = this.getSetsForGoal(goal, experience);

    return {
      day_index: day,
      duration_min: duration,
      title: `Push`,
      focus: 'Chest, shoulders, and triceps',
      session_blocks: [
        this.createWarmupBlock(),
        this.createMainBlock(pushExercises, sets, goal),
        this.createCooldownBlock(),
      ],
    };
  }

  private createPullSession(
    day: number,
    duration: number,
    exercises: Exercise[],
    goal: string,
    experience: string
  ): WeeklySession {
    const pullExercises = exercises.filter((ex) =>
      ex.primary_muscles.some((m) => ['lats', 'rhomboids', 'traps', 'biceps'].includes(m))
    );
    const sets = this.getSetsForGoal(goal, experience);

    return {
      day_index: day,
      duration_min: duration,
      title: `Pull`,
      focus: 'Back and biceps',
      session_blocks: [
        this.createWarmupBlock(),
        this.createMainBlock(pullExercises, sets, goal),
        this.createCooldownBlock(),
      ],
    };
  }

  private createLegSession(
    day: number,
    duration: number,
    exercises: Exercise[],
    goal: string,
    experience: string
  ): WeeklySession {
    const legExercises = exercises.filter((ex) =>
      ex.primary_muscles.some((m) => ['quadriceps', 'hamstrings', 'glutes'].includes(m))
    );
    const sets = this.getSetsForGoal(goal, experience);

    return {
      day_index: day,
      duration_min: duration,
      title: `Legs`,
      focus: 'Lower body strength',
      session_blocks: [
        this.createWarmupBlock(),
        this.createMainBlock(legExercises, sets, goal),
        this.createCooldownBlock(),
      ],
    };
  }

  private selectExercisesForFullBody(exercises: Exercise[], goal: string): Exercise[] {
    const squat = exercises.find((e) => e.primary_muscles.includes('quadriceps'));
    const hinge = exercises.find((e) => e.primary_muscles.includes('hamstrings'));
    const push = exercises.find((e) => e.primary_muscles.includes('pectorals'));
    const pull = exercises.find((e) => e.primary_muscles.includes('lats'));
    const core = exercises.find((e) => e.primary_muscles.includes('core'));

    return [squat, hinge, push, pull, core].filter(Boolean) as Exercise[];
  }

  private getSetsForGoal(goal: string, experience: string): number {
    const baseMap: Record<string, number> = {
      strength: 4,
      hypertrophy: 3,
      fat_loss: 3,
      endurance: 3,
      power: 4,
      general_health: 3,
      rehab: 2,
    };

    let sets = baseMap[goal] || 3;

    if (experience === 'novice') sets = Math.max(2, sets - 1);
    if (experience === 'advanced') sets += 1;

    return sets;
  }

  private createWarmupBlock(): SessionBlock {
    return {
      type: 'warmup',
      exercises: [
        {
          exercise_id: 'dynamic-warmup',
          sets: 1,
          reps: '5-10 each',
          intensity: 'light',
          rest_seconds: 30,
          notes: 'Leg swings, arm circles, hip openers, light cardio',
        },
      ],
    };
  }

  private createMainBlock(exercises: Exercise[], sets: number, goal: string): SessionBlock {
    const repsMap: Record<string, string> = {
      strength: '3-5',
      hypertrophy: '8-12',
      fat_loss: '10-15',
      endurance: '12-20',
      power: '3-5',
      general_health: '8-12',
      rehab: '12-15',
    };

    const intensityMap: Record<string, string> = {
      strength: 'RPE 8-9 (80-90% 1RM)',
      hypertrophy: 'RPE 7-8 (70-80% 1RM)',
      fat_loss: 'RPE 7-8 (65-75% 1RM)',
      endurance: 'RPE 6-7 (60-70% 1RM)',
      power: 'RPE 7-8 (50-70% 1RM)',
      general_health: 'RPE 6-7 (60-70% 1RM)',
      rehab: 'RPE 5-6 (50-60% 1RM)',
    };

    const restMap: Record<string, number> = {
      strength: 180,
      hypertrophy: 90,
      fat_loss: 60,
      endurance: 45,
      power: 180,
      general_health: 90,
      rehab: 60,
    };

    return {
      type: 'main',
      exercises: exercises.map((ex) => ({
        exercise_id: ex.id,
        sets,
        reps: repsMap[goal] || '8-12',
        intensity: intensityMap[goal] || 'RPE 7-8',
        rest_seconds: restMap[goal] || 90,
      })),
    };
  }

  private createCooldownBlock(): SessionBlock {
    return {
      type: 'cooldown',
      exercises: [
        {
          exercise_id: 'static-stretch',
          sets: 1,
          reps: '30s each',
          intensity: 'light',
          rest_seconds: 15,
          notes: 'Focus on worked muscle groups',
        },
      ],
    };
  }

  private buildProgressionRules(input: UserInput): ProgressionRule {
    const loadIncrease =
      input.strictness === 'conservative' ? 2.5 : input.strictness === 'aggressive' ? 10 : 5;

    return {
      method: 'Double progression',
      load_increase_percent: loadIncrease,
      autoregulation_rules: [
        'When you complete all sets at target RPE for 2 consecutive sessions, add load',
        'If RPE exceeds 9, reduce load by 5-10%',
        'If session RPE average <6, consider adding volume or intensity',
      ],
      deload_cadence_weeks: input.training_experience === 'novice' ? 8 : 4,
    };
  }

  private buildSafetyMods(input: UserInput): SafetyMods {
    const mods: SafetyMods = {
      injury_substitutions: {},
      warmup_protocols: [
        'Always perform 8-12 min dynamic warmup',
        'Include 2-3 ramp sets before heavy compounds',
        'Prioritize joint mobility for injury-prone areas',
      ],
      red_flags: [
        'Sharp joint pain - stop immediately',
        'Numbness or tingling - stop and assess',
        'Dizziness or nausea - stop session',
        'Mechanical inconsistency with pain - regress',
      ],
    };

    if (input.injuries_or_limitations) {
      mods.injury_substitutions['general'] = [
        'Modify ROM to pain-free range',
        'Use regressions from exercise library',
        'Consider isometric holds if dynamic hurts',
      ];
    }

    return mods;
  }

  private buildNutritionBrief(input: UserInput): NutritionBrief {
    const brief: NutritionBrief = {
      protein_g_per_kg_range: [1.6, 2.2],
    };

    if (input.weight_kg) {
      if (input.goal === 'fat_loss') {
        brief.calorie_direction = 'Moderate deficit: 300-500 kcal below maintenance';
      } else if (input.goal === 'hypertrophy') {
        brief.calorie_direction = 'Slight surplus: 200-300 kcal above maintenance';
      } else {
        brief.calorie_direction = 'Maintenance calories';
      }
    }

    return brief;
  }

  private estimateMilestones(input: UserInput): Milestone[] {
    const milestones: Milestone[] = [];

    if (input.training_experience === 'novice') {
      milestones.push({
        description: 'Master movement patterns with consistent technique',
        timeline_weeks: 4,
      });
      milestones.push({
        description: 'Complete first full training cycle without missed sessions',
        timeline_weeks: 8,
      });
      milestones.push({
        description: 'Achieve 20% strength increase on main lifts',
        timeline_weeks: 12,
      });
    } else {
      milestones.push({
        description: 'Complete deload and return stronger',
        timeline_weeks: 5,
      });
      milestones.push({
        description: 'Achieve 10% strength or volume increase',
        timeline_weeks: 12,
      });
    }

    return milestones;
  }

  private buildTrackingRecommendations(): string[] {
    return [
      'Log all workouts: exercises, sets, reps, load, RPE',
      'Track weekly bodyweight (same day, same time)',
      'Rate session RPE (1-10) after each workout',
      'Note soreness levels 24h post-session',
      'Record video of key exercises monthly for form review',
      'Monitor sleep quality and duration',
    ];
  }

  private calculateConfidence(input: UserInput): number {
    let confidence = 0.9;

    if (!input.weight_kg) confidence -= 0.1;
    if (!input.height_cm) confidence -= 0.05;
    if (!input.sleep_hours) confidence -= 0.05;
    if (input.injuries_or_limitations) confidence -= 0.1;

    return Math.max(0.5, confidence);
  }

  generateHumanSummary(plan: FitnessPlan, input: UserInput): string {
    let summary = `# Your Personalized ${input.goal.replace('_', ' ').toUpperCase()} Training Plan\n\n`;
    summary += `Welcome! This plan is designed specifically for your ${input.training_experience} training level, `;
    summary += `with ${input.days_per_week} sessions per week, each lasting about ${input.minutes_per_session} minutes.\n\n`;

    summary += `## Why This Plan Works For You\n\n`;
    summary += `Based on your ${input.days_per_week}-day schedule and ${input.goal} goal, we've structured `;

    if (input.days_per_week <= 3) {
      summary += `full-body sessions to maximize efficiency. Each workout hits all major muscle groups with multi-joint exercises.\n\n`;
    } else if (input.days_per_week === 4) {
      summary += `an upper/lower split to optimize recovery and training volume.\n\n`;
    } else {
      summary += `a push/pull/legs split for focused muscle group work and recovery.\n\n`;
    }

    summary += `## Your First Week\n\n`;
    plan.sample_week.sessions.forEach((session, idx) => {
      summary += `### Day ${session.day_index + 1}: ${session.title}\n`;
      summary += `Duration: ~${session.duration_min} minutes\n`;
      summary += `Focus: ${session.focus}\n\n`;

      session.session_blocks.forEach((block) => {
        if (block.type === 'main') {
          summary += `**Main Work:**\n`;
          block.exercises.forEach((ex) => {
            const exercise = plan.exercise_library.find((e) => e.id === ex.exercise_id);
            if (exercise) {
              summary += `- ${exercise.name}: ${ex.sets} sets × ${ex.reps} reps @ ${ex.intensity}, rest ${ex.rest_seconds}s\n`;
            }
          });
          summary += `\n`;
        }
      });
    });

    summary += `## Progression Strategy\n\n`;
    summary += `Method: ${plan.progression_rules.method}\n`;
    summary += `Load increases: ${plan.progression_rules.load_increase_percent}% when targets met\n`;
    summary += `Deload every: ${plan.progression_rules.deload_cadence_weeks} weeks\n\n`;

    summary += `## Safety & Stop Rules\n\n`;
    plan.safety_and_mods.red_flags.forEach((flag) => {
      summary += `⚠️ ${flag}\n`;
    });
    summary += `\n`;

    if (input.injuries_or_limitations) {
      summary += `**Note:** Given your reported limitations, prioritize pain-free range of motion and use regressions as needed.\n\n`;
    }

    summary += `## Nutrition Guidance\n\n`;
    if (plan.nutrition_brief.calorie_direction) {
      summary += `Calories: ${plan.nutrition_brief.calorie_direction}\n`;
    }
    summary += `Protein: ${plan.nutrition_brief.protein_g_per_kg_range[0]}-${plan.nutrition_brief.protein_g_per_kg_range[1]} g per kg bodyweight daily\n\n`;

    summary += `## Form Analysis Tool\n\n`;
    summary += `Use your camera to record exercises for form review. For best results:\n`;
    summary += `- Record from the side (sagittal view) for most lifts\n`;
    summary += `- Ensure full body is in frame\n`;
    summary += `- Use stable camera position 8-12 feet away\n`;
    summary += `- Good lighting, no backlight\n`;
    summary += `- Record at least 3 reps per set\n\n`;

    summary += `**Estimated Milestones:**\n`;
    plan.estimated_milestones.forEach((milestone) => {
      summary += `- Week ${milestone.timeline_weeks}: ${milestone.description}\n`;
    });

    summary += `\nLet's get started!\n`;

    return summary;
  }
}

export const planGenerator = new PlanGenerator();
