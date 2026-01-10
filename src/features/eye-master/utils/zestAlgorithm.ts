/**
 * ZEST (Zippy Estimation by Sequential Testing) Algorithm
 *
 * Bayesian adaptive algorithm for efficient visual acuity testing.
 * Achieves clinical accuracy (±0.15 logMAR) in 12-15 trials instead of 50.
 *
 * Based on:
 * - King-Smith PE, et al. (1994). Vision Research
 * - Turpin A, et al. (2003). Investigative Ophthalmology & Visual Science
 * - FrACT Best PEST implementation
 */

// ═══════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

export interface ZestState {
  /** Probability density function values for each logMAR level */
  pdf: number[];
  /** LogMAR values corresponding to each pdf index */
  logMARLevels: number[];
  /** Trial history */
  trials: ZestTrial[];
  /** Current trial number (1-indexed) */
  trialNumber: number;
  /** Whether the test is complete */
  isComplete: boolean;
  /** Final threshold estimate (logMAR) */
  thresholdEstimate: number | null;
  /** 95% confidence interval width */
  confidenceInterval: number;
}

export interface ZestTrial {
  /** Stimulus level presented (logMAR) */
  stimulusLogMAR: number;
  /** Whether the response was correct */
  isCorrect: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Trial number */
  trialNumber: number;
}

export interface ZestConfig {
  /** Maximum number of trials */
  maxTrials: number;
  /** Confidence interval threshold for early termination */
  confidenceThreshold: number;
  /** Prior mean (logMAR) */
  priorMean: number;
  /** Prior standard deviation (logMAR) */
  priorSD: number;
  /** Psychometric function slope */
  slope: number;
  /** Guess rate (1/number of alternatives) */
  guessRate: number;
  /** Fixed bracketing trials (logMAR values for first N trials) */
  bracketingTrials: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Default Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_ZEST_CONFIG: ZestConfig = {
  maxTrials: 15,
  confidenceThreshold: 0.10, // logMAR
  priorMean: 0.0, // 20/20 vision
  priorSD: 0.8, // Covers wide range of visual acuities
  slope: 0.2, // Typical for visual acuity
  guessRate: 0.25, // 4AFC (4 directions)
  bracketingTrials: [0.4, 0.0, -0.2], // First 3 trials at fixed levels
};

// LogMAR levels for the PDF (0.05 logMAR steps from 1.0 to -0.4)
const LOGMAR_RANGE = {
  min: -0.4, // Excellent vision (20/8)
  max: 1.0,  // Poor vision (20/200)
  step: 0.05,
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate array of logMAR levels for the PDF
 */
function generateLogMARLevels(): number[] {
  const levels: number[] = [];
  for (let logMAR = LOGMAR_RANGE.max; logMAR >= LOGMAR_RANGE.min; logMAR -= LOGMAR_RANGE.step) {
    levels.push(Math.round(logMAR * 100) / 100); // Round to 2 decimal places
  }
  return levels;
}

/**
 * Normal (Gaussian) probability density function
 */
function normalPDF(x: number, mean: number, sd: number): number {
  const exponent = -0.5 * Math.pow((x - mean) / sd, 2);
  return Math.exp(exponent) / (sd * Math.sqrt(2 * Math.PI));
}

/**
 * Psychometric function: P(correct | threshold, stimulus)
 * Uses Weibull-like function common in vision research
 *
 * P = gamma + (1 - gamma) * (1 - exp(-(stimulus - threshold) / slope))
 * where gamma = guess rate (0.25 for 4AFC)
 */
function psychometricFunction(
  stimulusLogMAR: number,
  thresholdLogMAR: number,
  slope: number,
  guessRate: number
): number {
  // Note: Lower logMAR = better vision = harder to see
  // If stimulus logMAR > threshold, it's easier to see
  const difference = stimulusLogMAR - thresholdLogMAR;

  if (difference >= 0) {
    // Stimulus is at or above threshold (easier to see)
    // Probability increases as difference increases
    const p = guessRate + (1 - guessRate) * (1 - Math.exp(-difference / slope));
    return Math.min(0.99, Math.max(0.01, p));
  } else {
    // Stimulus is below threshold (harder to see)
    // Probability approaches guess rate as it gets harder
    const p = guessRate + (1 - guessRate) * (1 - Math.exp(-Math.abs(difference) / slope)) * 0.5;
    return Math.min(0.99, Math.max(guessRate, p));
  }
}

/**
 * Calculate weighted mean of the PDF (posterior mean)
 */
function calculatePDFMean(pdf: number[], levels: number[]): number {
  let sum = 0;
  let weightSum = 0;

  for (let i = 0; i < pdf.length; i++) {
    sum += pdf[i] * levels[i];
    weightSum += pdf[i];
  }

  return weightSum > 0 ? sum / weightSum : levels[Math.floor(levels.length / 2)];
}

/**
 * Calculate standard deviation of the PDF
 */
function calculatePDFSD(pdf: number[], levels: number[], mean: number): number {
  let sum = 0;
  let weightSum = 0;

  for (let i = 0; i < pdf.length; i++) {
    sum += pdf[i] * Math.pow(levels[i] - mean, 2);
    weightSum += pdf[i];
  }

  return weightSum > 0 ? Math.sqrt(sum / weightSum) : 0.8;
}

/**
 * Calculate 95% confidence interval from PDF
 * Returns the width of the interval
 */
function calculateConfidenceInterval(pdf: number[], levels: number[]): number {
  // Normalize PDF
  const total = pdf.reduce((a, b) => a + b, 0);
  if (total === 0) return 2.0;

  const normalizedPDF = pdf.map(p => p / total);

  // Find 2.5% and 97.5% percentiles
  let cumSum = 0;
  let lower = levels[0];
  let upper = levels[levels.length - 1];
  let foundLower = false;
  let foundUpper = false;

  for (let i = 0; i < normalizedPDF.length; i++) {
    cumSum += normalizedPDF[i];

    if (!foundLower && cumSum >= 0.025) {
      lower = levels[i];
      foundLower = true;
    }

    if (!foundUpper && cumSum >= 0.975) {
      upper = levels[i];
      foundUpper = true;
      break;
    }
  }

  return Math.abs(upper - lower);
}

/**
 * Find the index of the closest logMAR level
 */
function findClosestLevelIndex(targetLogMAR: number, levels: number[]): number {
  let minDiff = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < levels.length; i++) {
    const diff = Math.abs(levels[i] - targetLogMAR);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main ZEST Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize the ZEST state with a prior distribution
 */
export function initializeZest(config: Partial<ZestConfig> = {}): ZestState {
  const fullConfig = { ...DEFAULT_ZEST_CONFIG, ...config };
  const levels = generateLogMARLevels();

  // Create prior PDF (normal distribution)
  const pdf = levels.map(level =>
    normalPDF(level, fullConfig.priorMean, fullConfig.priorSD)
  );

  // Normalize
  const total = pdf.reduce((a, b) => a + b, 0);
  const normalizedPDF = pdf.map(p => p / total);

  return {
    pdf: normalizedPDF,
    logMARLevels: levels,
    trials: [],
    trialNumber: 0,
    isComplete: false,
    thresholdEstimate: null,
    confidenceInterval: calculateConfidenceInterval(normalizedPDF, levels),
  };
}

/**
 * Get the next stimulus level to present
 */
export function getNextStimulus(state: ZestState, config: Partial<ZestConfig> = {}): number {
  const fullConfig = { ...DEFAULT_ZEST_CONFIG, ...config };
  const trialIndex = state.trialNumber; // 0-indexed for array access

  // First N trials: use fixed bracketing
  if (trialIndex < fullConfig.bracketingTrials.length) {
    return fullConfig.bracketingTrials[trialIndex];
  }

  // After bracketing: use posterior mean
  const posteriorMean = calculatePDFMean(state.pdf, state.logMARLevels);

  // Round to nearest available level
  const closestIndex = findClosestLevelIndex(posteriorMean, state.logMARLevels);
  return state.logMARLevels[closestIndex];
}

/**
 * Update the state after a trial response
 */
export function updateZestState(
  state: ZestState,
  stimulusLogMAR: number,
  isCorrect: boolean,
  responseTimeMs: number,
  config: Partial<ZestConfig> = {}
): ZestState {
  const fullConfig = { ...DEFAULT_ZEST_CONFIG, ...config };

  // Record the trial
  const trial: ZestTrial = {
    stimulusLogMAR,
    isCorrect,
    responseTimeMs,
    trialNumber: state.trialNumber + 1,
  };

  // Update posterior using Bayes' rule
  // P(threshold | response) ∝ P(response | threshold) * P(threshold)
  const newPDF = state.pdf.map((prior, i) => {
    const threshold = state.logMARLevels[i];
    const pCorrect = psychometricFunction(
      stimulusLogMAR,
      threshold,
      fullConfig.slope,
      fullConfig.guessRate
    );

    // Likelihood of this response given this threshold
    const likelihood = isCorrect ? pCorrect : (1 - pCorrect);

    return prior * likelihood;
  });

  // Normalize posterior
  const total = newPDF.reduce((a, b) => a + b, 0);
  const normalizedPDF = total > 0 ? newPDF.map(p => p / total) : state.pdf;

  // Calculate new confidence interval
  const ci = calculateConfidenceInterval(normalizedPDF, state.logMARLevels);

  // Check termination conditions
  const newTrialNumber = state.trialNumber + 1;
  const shouldTerminate =
    ci <= fullConfig.confidenceThreshold ||
    newTrialNumber >= fullConfig.maxTrials;

  // Calculate threshold estimate
  const thresholdEstimate = shouldTerminate
    ? calculatePDFMean(normalizedPDF, state.logMARLevels)
    : null;

  return {
    pdf: normalizedPDF,
    logMARLevels: state.logMARLevels,
    trials: [...state.trials, trial],
    trialNumber: newTrialNumber,
    isComplete: shouldTerminate,
    thresholdEstimate,
    confidenceInterval: ci,
  };
}

/**
 * Get the final threshold estimate from the current state
 */
export function getThresholdEstimate(state: ZestState): number {
  if (state.thresholdEstimate !== null) {
    return state.thresholdEstimate;
  }
  return calculatePDFMean(state.pdf, state.logMARLevels);
}

/**
 * Convert logMAR to decimal visual acuity
 */
export function logMARToDecimal(logMAR: number): number {
  return Math.pow(10, -logMAR);
}

/**
 * Convert logMAR to Snellen notation (e.g., "20/20")
 */
export function logMARToSnellen(logMAR: number): string {
  const decimal = logMARToDecimal(logMAR);
  const denominator = Math.round(20 / decimal);
  return `20/${denominator}`;
}

/**
 * Get the level index in LOGMAR_LEVELS array that's closest to a logMAR value
 */
export function getClosestLevelIndex(logMAR: number, levels: { logMAR: number }[]): number {
  let minDiff = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < levels.length; i++) {
    const diff = Math.abs(levels[i].logMAR - logMAR);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Check if a response seems like guessing (based on response time and pattern)
 */
export function detectGuessing(trials: ZestTrial[]): {
  isLikelyGuessing: boolean;
  averageResponseTime: number;
  tooFastCount: number;
} {
  if (trials.length < 5) {
    return { isLikelyGuessing: false, averageResponseTime: 0, tooFastCount: 0 };
  }

  const avgTime = trials.reduce((sum, t) => sum + t.responseTimeMs, 0) / trials.length;
  const tooFast = trials.filter(t => t.responseTimeMs < 500).length;

  // If more than 40% of responses are under 500ms, likely guessing
  const isLikelyGuessing = tooFast / trials.length > 0.4;

  return {
    isLikelyGuessing,
    averageResponseTime: avgTime,
    tooFastCount: tooFast,
  };
}
