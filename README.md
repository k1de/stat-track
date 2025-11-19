# stat-track

**Lightweight statistics tracking with operation timing and error categorization.**

> Uses [chalk](https://github.com/chalk/chalk) for colored output.
> Memory-safe with configurable sample limits for long-running processes.

## Install

```bash
npm install stat-track
```

## Usage

```typescript
import Statistics from 'stat-track';

const stats = new Statistics('API Monitor');

// Track successful operations
stats.addSuccess(); // without timing or code
stats.addSuccess(125); // with timing: 125ms
stats.addSuccess(125, '201'); // with timing and code (e.g., HTTP 201 Created)
stats.addSuccessCode('200'); // with code only (no timing)

// Track errors
stats.addError(); // without timing or code
stats.addError(5000); // with timing: 5000ms
stats.addError(5000, 'TIMEOUT'); // with timing and code
stats.addErrorCode('TIMEOUT'); // with code only (no timing)

// Get formatted report
console.log(stats.getReportText());

// Get structured data
const report = stats.getReport();
console.log(report.successRate); // 33.3
console.log(report.avgTime); // 125
console.log(report.p75); // 75th percentile
```

### With options

```typescript
const stats = new Statistics({
    name: 'File Processing',
    maxOperationTimeSamples: 1000, // limit memory usage
});
```

## Methods

**Tracking:**

-   `addSuccess(operationTime?, code?)` - record successful operation with optional timing (ms) and code
-   `addSuccessCode(code)` - record successful operation with code only (no timing)
-   `addError(operationTime?, code?)` - record error with optional timing (ms) and error code
-   `addErrorCode(code)` - record error with code only (no timing)
-   `reset()` - reset all statistics

**Analysis (successful operations):**

-   `getSuccessAvg()` - average time for successful operations
-   `getSuccessMedian()` - median time for successful operations
-   `getSuccessPercentile(percentile)` - calculate percentile (0-100) for successful operations
-   `getSuccessRange()` - get min/max times for successful operations
-   `hasSuccessData()` - check if success timing data exists

**Analysis (errors):**

-   `getErrorAvg()` - average error time
-   `getErrorMedian()` - median error time
-   `getErrorPercentile(percentile)` - calculate error percentile (0-100)
-   `getErrorRange()` - get min/max error times
-   `hasErrorData()` - check if error timing data exists

**General:**

-   `getSuccessRate()` - success percentage
-   `getTotalCount()` - total operations count
-   `getSuccessCount()` - successful operations count
-   `getErrorCount()` - error operations count
-   `getTimeMs()` - elapsed time since start

**Reporting:**

-   `getReport()` - structured statistics object
-   `getReportText()` - formatted colored text report (detailed)
-   `getReportTextCompact(useMedian?)` - one-line compact report (useMedian: `boolean`)

**Merging:**

-   `merge(other)` - combine statistics from another instance

## Report examples

### Detailed report

```
📊 API Monitoring:
    ✅ SUCCESS: 96/100 (96.0%)
        ✓ 200: 34
        ✓ 201: 31
        ✓ 204: 31
        🕒 med: 0.280s, p75: 0.358s
        🕘 avg: 0.259s, min: 0.051s, max: 0.499s
    ❌ ERRORS: 4/100
        × CONNECTION_ERROR: 2
        × 404: 1
        × TIMEOUT: 1
        🕒 med: 0.965s, p75: 1.841s
        🕘 avg: 1.733s, min: 0.700s, max: 4.304s
    ⏰ time: 1.105s
```

### Compact report

```
📊 Worker 1: 25/30 (83.3%) avg: 0.182s | 5 errors avg: 0.308s | ⏰ 0.308s
📊 Worker 2: 26/30 (86.7%) avg: 0.165s | 4 errors avg: 0.205s | ⏰ 0.205s
📊 Worker 3: 28/30 (93.3%) avg: 0.161s | 2 errors avg: 0.101s | ⏰ 0.101s
```

**Note:** Error timing statistics are shown only when `operationTime` is provided to `addError()`.

## Merging statistics

Combine statistics from multiple sources (e.g., workers, parallel operations):

```typescript
const worker1 = new Statistics('Worker 1');
const worker2 = new Statistics('Worker 2');
const worker3 = new Statistics('Worker 3');

// Each worker tracks their own operations
worker1.addSuccess(100);
worker2.addSuccess(150);
worker3.addSuccess(125);

// Combine all statistics
const combined = new Statistics('Combined');
combined.merge(worker1);
combined.merge(worker2);
combined.merge(worker3);

console.log(combined.getReportText());
```

## Memory management

By default, the library keeps the last 10,000 operation times to calculate statistics. For long-running processes, you can adjust this limit:

```typescript
const stats = new Statistics({
    name: 'Long Running Process',
    maxOperationTimeSamples: 1000, // keep only last 1000 samples
});
```

When the limit is reached, the oldest samples are automatically removed (sliding window).

## Report structure

The `getReport()` method returns:

```typescript
{
    name: string | undefined
    successCount: number
    errorCount: number
    totalCount: number
    successRate: number // percentage
    time: number // elapsed time in ms

    // Success timing
    successAvg: number
    successMedian: number
    successRange: { min: number; max: number }
    successP75: number // 75th percentile
    successTimes: number[] // all success operation times
    successSampleCount: number

    // Error timing
    errorAvg: number
    errorMedian: number
    errorRange: { min: number; max: number }
    errorP75: number // 75th percentile for errors
    errorTimes: number[] // all error times
    errorSampleCount: number

    // Other
    successes: Record<string, number> // success code -> count
    errors: Record<string, number> // error code -> count
    maxSamples: number
}
```

**Note:** Success codes are only shown in the detailed report when multiple code types are used or when a custom code is provided (not the default 'SUCCESS').
