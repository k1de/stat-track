import chalk from "chalk"

// Helps pm2 with colors
chalk.level = 3

const MAX_OPERATION_TIME_SAMPLES = 10_000

export interface StatisticsOptions {
    name?: string | undefined
    maxOperationTimeSamples?: number
}

export default class Statistics {
    public name?: string | undefined
    private startTime!: number
    private successCount!: number
    private errorCount!: number
    private successes!: Map<string, number>
    private errors!: Map<string, number>
    private operationTimes!: number[]
    private errorTimes!: number[]
    private maxOperationTimeSamples: number

    constructor(options?: string | StatisticsOptions) {
        if (typeof options === 'string') {
            this.name = options
            this.maxOperationTimeSamples = MAX_OPERATION_TIME_SAMPLES
        } else {
            this.name = options?.name ?? undefined
            this.maxOperationTimeSamples = options?.maxOperationTimeSamples ?? MAX_OPERATION_TIME_SAMPLES
        }
        this.reset()
    }

    /** Reset all statistics to initial state */
    reset() {
        this.startTime = Date.now()
        this.successCount = 0
        this.errorCount = 0
        this.successes = new Map()
        this.errors = new Map()
        this.operationTimes = []
        this.errorTimes = []
    }

    /** Record a successful operation with optional timing (ms) and code */
    addSuccess(operationTime?: number, code?: string | number) {
        this.successCount++
        const key = String(code ?? 'UNKNOWN')
        this.successes.set(key, (this.successes.get(key) || 0) + 1)

        if (typeof operationTime === 'number' && operationTime >= 0) {
            this.operationTimes.push(operationTime)

            // Limit array size to prevent memory leaks in long-running processes
            if (this.operationTimes.length > this.maxOperationTimeSamples) {
                this.operationTimes.shift()
            }
        }
    }

    /** Record a successful operation with code only (no timing) */
    addSuccessCode(code: string | number) {
        this.addSuccess(undefined, code)
    }

    /** Record an error with optional timing (ms) and error code */
    addError(operationTime?: number, code?: string | number) {
        this.errorCount++
        const key = String(code ?? 'UNKNOWN')
        this.errors.set(key, (this.errors.get(key) || 0) + 1)

        if (typeof operationTime === 'number' && operationTime >= 0) {
            this.errorTimes.push(operationTime)

            // Limit array size to prevent memory leaks in long-running processes
            if (this.errorTimes.length > this.maxOperationTimeSamples) {
                this.errorTimes.shift()
            }
        }
    }

    /** Record an error with code only (no timing) */
    addErrorCode(code: string | number) {
        this.addError(undefined, code)
    }

    /** Get average time for successful operations */
    getSuccessAvg(): number {
        if (this.operationTimes.length === 0) return 0
        const sum = this.operationTimes.reduce((a, b) => a + b, 0)
        return sum / this.operationTimes.length
    }

    private calculateMedian(values: number[]): number {
        if (values.length === 0) return 0
        const sorted = [...values].sort((a, b) => a - b)
        const middle = Math.floor(sorted.length / 2)

        if (sorted.length % 2 === 0) {
            const left = sorted[middle - 1]
            const right = sorted[middle]
            if (left === undefined || right === undefined) return 0
            return (left + right) / 2
        } else {
            return sorted[middle] ?? 0
        }
    }

    /** Get median time for successful operations */
    getSuccessMedian(): number {
        return this.calculateMedian(this.operationTimes)
    }

    private calculateRange(values: number[]): { min: number; max: number } {
        if (values.length === 0) return { min: 0, max: 0 }
        return {
            min: Math.min(...values),
            max: Math.max(...values),
        }
    }

    /** Get min and max times for successful operations */
    getSuccessRange(): { min: number; max: number } {
        return this.calculateRange(this.operationTimes)
    }

    private calculatePercentile(values: number[], percentile: number): number {
        if (values.length === 0) return 0
        if (percentile < 0 || percentile > 100) {
            throw new Error('Percentile must be between 0 and 100')
        }

        const sorted = [...values].sort((a, b) => a - b)

        if (percentile === 0) return sorted[0] ?? 0
        if (percentile === 100) return sorted[sorted.length - 1] ?? 0

        // Calculate exact index for percentile (may be fractional)
        const index = (percentile / 100) * (sorted.length - 1)
        const lower = Math.floor(index)
        const upper = Math.ceil(index)

        if (lower === upper) {
            return sorted[lower] ?? 0
        }

        // Linear interpolation between two nearest values for accuracy
        const weight = index - lower
        const lowerValue = sorted[lower]
        const upperValue = sorted[upper]
        if (lowerValue === undefined || upperValue === undefined) return 0
        return lowerValue * (1 - weight) + upperValue * weight
    }

    /** Calculate percentile (0-100) for successful operation times */
    getSuccessPercentile(percentile: number): number {
        return this.calculatePercentile(this.operationTimes, percentile)
    }

    /** Get elapsed time since statistics started (ms) */
    getTimeMs(): number {
        return Date.now() - this.startTime
    }

    /** Get total count of all operations (successes + errors) */
    getTotalCount(): number {
        return this.successCount + this.errorCount
    }

    /** Get count of successful operations */
    getSuccessCount(): number {
        return this.successCount
    }

    /** Get count of error operations */
    getErrorCount(): number {
        return this.errorCount
    }

    /** Get success rate as percentage (0-100) */
    getSuccessRate(): number {
        const totalCount = this.getTotalCount()
        return totalCount > 0 ? (this.successCount / totalCount) * 100 : 0
    }

    /** Check if success timing data is available */
    hasSuccessData(): boolean {
        return this.operationTimes.length > 0
    }

    /** Get average error time */
    getErrorAvg(): number {
        if (this.errorTimes.length === 0) return 0
        const sum = this.errorTimes.reduce((a, b) => a + b, 0)
        return sum / this.errorTimes.length
    }

    /** Get median error time */
    getErrorMedian(): number {
        return this.calculateMedian(this.errorTimes)
    }

    /** Get min and max error times */
    getErrorRange(): { min: number; max: number } {
        return this.calculateRange(this.errorTimes)
    }

    /** Calculate percentile (0-100) for error times */
    getErrorPercentile(percentile: number): number {
        return this.calculatePercentile(this.errorTimes, percentile)
    }

    /** Check if error timing data is available */
    hasErrorData(): boolean {
        return this.errorTimes.length > 0
    }

    /** Get structured statistics report with all metrics */
    getReport() {
        const totalCount = this.getTotalCount()
        const timeMs = this.getTimeMs()
        const successRate = this.getSuccessRate()

        return {
            name: this.name,
            successCount: this.successCount,
            errorCount: this.errorCount,
            totalCount,
            successRate,
            time: timeMs,
            successAvg: this.getSuccessAvg(),
            successMedian: this.getSuccessMedian(),
            successRange: this.getSuccessRange(),
            successP75: this.getSuccessPercentile(75),
            successes: Object.fromEntries(this.successes),
            errors: Object.fromEntries(this.errors),
            successTimes: this.operationTimes as readonly number[],
            successSampleCount: this.operationTimes.length,
            errorAvg: this.getErrorAvg(),
            errorMedian: this.getErrorMedian(),
            errorRange: this.getErrorRange(),
            errorP75: this.getErrorPercentile(75),
            errorTimes: this.errorTimes as readonly number[],
            errorSampleCount: this.errorTimes.length,
            maxSamples: this.maxOperationTimeSamples
        }
    }

    /** Get formatted colored text report (detailed) */
    getReportText(): string {
        const stats = this.getReport()

        let report = chalk.cyan(`📊 ${this.name || 'Statistics'}:\n`)

        // Success section
        report += "    ✅ " + chalk.green(`SUCCESS: ${stats.successCount}/${stats.totalCount} (${stats.successRate.toFixed(1)}%)\n`)

        // Show success codes if there are multiple types
        const successEntries = Object.entries(stats.successes)
        if (successEntries.length > 1 || (successEntries.length === 1 && successEntries[0]?.[0] !== 'UNKNOWN')) {
            const sortedSuccesses = successEntries.sort(([, a], [, b]) => b - a)
            for (const [code, count] of sortedSuccesses) {
                report += "        ✓ " + chalk.green(`${code}: ${count}\n`)
            }
        }

        if (stats.successAvg > 0) {
            if (stats.successTimes.length > 1) {
                report += "        🕒 " + chalk.yellow(`med: ${this.formatTime(stats.successMedian)}, p75: ${this.formatTime(stats.successP75)}\n`)
                report += "        🕘 " + chalk.yellow(`avg: ${this.formatTime(stats.successAvg)}, min: ${this.formatTime(stats.successRange.min)}, max: ${this.formatTime(stats.successRange.max)}\n`)
            } else {
                report += "        🕘 " + chalk.yellow(`avg: ${this.formatTime(stats.successAvg)}, min: ${this.formatTime(stats.successRange.min)}, max: ${this.formatTime(stats.successRange.max)}\n`)
            }

            // Warn if showing only a sample of all operation times
            if (stats.successSampleCount >= stats.maxSamples) {
                report += "        💡 " + chalk.gray(`last ${stats.maxSamples} operation times\n`)
            }
        }

        // Error section
        if (stats.errorCount > 0) {
            report += "    ❌ " + chalk.red(`ERRORS: ${stats.errorCount}/${stats.totalCount}\n`)

            // Show error codes if there are multiple types
            const errorEntries = Object.entries(stats.errors)
            if (errorEntries.length > 1 || (errorEntries.length === 1 && errorEntries[0]?.[0] !== 'UNKNOWN')) {
                const sortedErrors = errorEntries.sort(([, a], [, b]) => b - a)
                for (const [errorCode, count] of sortedErrors) {
                    report += "        × " + chalk.red(`${errorCode}: ${count}\n`)
                }
            }

            // Show error timing statistics if available
            if (stats.errorAvg > 0) {
                if (stats.errorTimes.length > 1) {
                    report += "        🕒 " + chalk.yellow(`med: ${this.formatTime(stats.errorMedian)}, p75: ${this.formatTime(stats.errorP75)}\n`)
                    report += "        🕘 " + chalk.yellow(`avg: ${this.formatTime(stats.errorAvg)}, min: ${this.formatTime(stats.errorRange.min)}, max: ${this.formatTime(stats.errorRange.max)}\n`)
                } else {
                    report += "        🕘 " + chalk.yellow(`avg: ${this.formatTime(stats.errorAvg)}, min: ${this.formatTime(stats.errorRange.min)}, max: ${this.formatTime(stats.errorRange.max)}\n`)
                }
            }
        }

        report += "    ⏰ " + chalk.blue(`time: ${this.formatTime(stats.time)}`)

        return report
    }

    /** Get one-line compact report with optional median instead of average */
    getReportTextCompact(useMedian?: boolean): string {
        const stats = this.getReport()
        const successRate = stats.successRate.toFixed(1)
        const useMedianValue = useMedian ?? false

        let report = chalk.cyan(`📊 ${this.name || 'Statistics'}: `)
        report += chalk.green(`${stats.successCount}/${stats.totalCount} (${successRate}%)`)

        // Show success timing if available
        if (stats.successAvg > 0) {
            const successTime = useMedianValue ? stats.successMedian : stats.successAvg
            const label = useMedianValue ? 'med' : 'avg'
            report += chalk.yellow(` ${label}: ${this.formatTime(successTime)}`)
        }

        // Show errors with their timing if available
        if (stats.errorCount > 0) {
            report += chalk.red(` | ${stats.errorCount} errors`)
            if (stats.errorAvg > 0) {
                const errorTime = useMedianValue ? stats.errorMedian : stats.errorAvg
                const label = useMedianValue ? 'med' : 'avg'
                report += chalk.yellow(` ${label}: ${this.formatTime(errorTime)}`)
            }
        }

        // Show total time
        report += chalk.blue(` | ⏰ ${this.formatTime(stats.time)}`)

        return report
    }

    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000)

        if (ms < 60_000) {
            return `${(ms / 1000).toFixed(3)}s`
        } else if (ms < 3600_000) {
            const minutes = Math.floor(ms / 60_000)
            const remainingSeconds = seconds % 60
            return `${minutes}m ${remainingSeconds}s`
        } else {
            const hours = Math.floor(seconds / 3600)
            const minutes = Math.floor((seconds % 3600) / 60)
            const remainingSeconds = seconds % 60
            return `${hours}h ${minutes}m ${remainingSeconds}s`
        }
    }

    /** Merge statistics from another instance */
    merge(other: Statistics): void {
        this.successCount += other.successCount
        this.errorCount += other.errorCount

        // Merge success maps by summing counts
        for (const [successCode, count] of other.successes.entries()) {
            this.successes.set(successCode, (this.successes.get(successCode) || 0) + count)
        }

        // Merge error maps by summing counts
        for (const [errorCode, count] of other.errors.entries()) {
            this.errors.set(errorCode, (this.errors.get(errorCode) || 0) + count)
        }

        // Add operation times while respecting memory limit
        this.operationTimes.push(...other.operationTimes)
        if (this.operationTimes.length > this.maxOperationTimeSamples) {
            // Remove excess elements from the beginning
            const excessCount = this.operationTimes.length - this.maxOperationTimeSamples
            this.operationTimes.splice(0, excessCount)
        }

        // Add error times while respecting memory limit
        this.errorTimes.push(...other.errorTimes)
        if (this.errorTimes.length > this.maxOperationTimeSamples) {
            // Remove excess elements from the beginning
            const excessCount = this.errorTimes.length - this.maxOperationTimeSamples
            this.errorTimes.splice(0, excessCount)
        }

        // Take the earliest start time
        this.startTime = Math.min(this.startTime, other.startTime)
    }
}