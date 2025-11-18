import Statistics from '../dist/statistics.js'

// Test API monitoring with timing and codes
async function testApiMonitoring() {
    console.log('🚀 API Monitoring (with timing and codes)...\n')

    const stats = new Statistics('API Monitor')

    for (let i = 0; i < 100; i++) {
        const responseTime = Math.floor(Math.random() * 450) + 50

        if (Math.random() < 0.85) {
            // Success with HTTP codes
            const codes = ['200', '201', '204']
            const code = codes[Math.floor(Math.random() * codes.length)]
            stats.addSuccess(responseTime, code)
        } else {
            // Errors - typically slower
            const errors = ['TIMEOUT', '500', '404']
            const error = errors[Math.floor(Math.random() * errors.length)]
            const errorTime = responseTime * (2 + Math.random() * 8)
            stats.addError(errorTime, error)
        }

        await new Promise(resolve => setTimeout(resolve, 5))
    }

    console.log(stats.getReportText())
    console.log('Compact (avg):   ', stats.getReportTextCompact())
    console.log('Compact (median):', stats.getReportTextCompact(true))
    console.log('\n')
}

// Test tracking without timing (only codes)
function testWithoutTiming() {
    console.log('📈 Event Tracking (without timing, with codes)...\n')

    const stats = new Statistics('Events')

    for (let i = 0; i < 50; i++) {
        if (Math.random() < 0.85) {
            // Success events
            const events = ['USER_LOGIN', 'DATA_SAVED', 'EMAIL_SENT']
            const event = events[Math.floor(Math.random() * events.length)]
            stats.addSuccess(undefined, event)
        } else {
            // Error events
            const errors = ['VALIDATION_FAILED', 'NETWORK_ERROR', 'UNAUTHORIZED']
            const error = errors[Math.floor(Math.random() * errors.length)]
            stats.addError(undefined, error)
        }
    }

    console.log(stats.getReportText())
    console.log(stats.getReportTextCompact())
    console.log('\n')
}

// Test with timing but without codes
async function testWithTiming() {
    console.log('⏱️  Performance Tracking (with timing, without codes)...\n')

    const stats = new Statistics('Performance')

    for (let i = 0; i < 50; i++) {
        const execTime = Math.floor(Math.random() * 500) + 50

        if (Math.random() < 0.85) {
            stats.addSuccess(execTime)
        } else {
            const errorTime = execTime * (2 + Math.random() * 3)
            stats.addError(errorTime)
        }

        await new Promise(resolve => setTimeout(resolve, 3))
    }

    console.log(stats.getReportText())
    console.log(stats.getReportTextCompact())
    console.log('\n')
}

// Test merge functionality
async function testMerge() {
    console.log('🔀 Merge Test (3 workers)...\n')

    const workers = []

    for (let i = 1; i <= 3; i++) {
        const worker = new Statistics(`Worker ${i}`)

        for (let j = 0; j < 30; j++) {
            const time = Math.floor(Math.random() * 200) + 50

            if (Math.random() < 0.8) {
                worker.addSuccess(time)
            } else {
                worker.addError(time * 2)
            }

            await new Promise(resolve => setTimeout(resolve, 2))
        }

        console.log(worker.getReportTextCompact())
        workers.push(worker)
    }

    const combined = new Statistics('Combined')
    workers.forEach(w => combined.merge(w))

    console.log('')
    console.log(combined.getReportText())
    console.log('\n')
}

// Main function
async function main() {
    console.log('=' .repeat(60))
    console.log('  STATISTICS LIBRARY TEST')
    console.log('=' .repeat(60))
    console.log('')

    try {
        // Test with timing AND codes (both success and errors)
        await testApiMonitoring()

        // Test WITHOUT timing but WITH codes (both success and errors)
        testWithoutTiming()

        // Test WITH timing but WITHOUT codes (both success and errors)
        await testWithTiming()

        // Test merge functionality
        await testMerge()

        console.log('✅ All tests completed successfully!')
    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

main()
