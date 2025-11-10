import { useEffect, useMemo, useRef, useState } from 'react'

function formatSeconds(sec) {
  // Display with 2 decimals, but keep as seconds
  return sec.toFixed(2)
}

export default function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [baseStart, setBaseStart] = useState(0) // ms timestamp when current run started
  const [accumulated, setAccumulated] = useState(0) // ms accumulated when paused
  const [laps, setLaps] = useState([]) // each lap in ms
  const [lapStart, setLapStart] = useState(0) // ms timestamp when current lap started
  const rafRef = useRef(null)
  const [now, setNow] = useState(0) // ms current time for live updates

  // Start the timer
  const start = () => {
    const t = performance.now()
    setBaseStart(t)
    setLapStart(t)
    setIsRunning(true)
  }

  // Pause/stop the timer (keeps elapsed)
  const pause = () => {
    const t = performance.now()
    setIsRunning(false)
    setAccumulated((prev) => prev + (t - baseStart))
  }

  // Continue after pause
  const resume = () => {
    const t = performance.now()
    setBaseStart(t)
    setLapStart(t - currentLapElapsedMs) // keep current lap progress
    setIsRunning(true)
  }

  // Reset everything
  const reset = () => {
    setIsRunning(false)
    setBaseStart(0)
    setAccumulated(0)
    setLapStart(0)
    setLaps([])
    setNow(0)
  }

  // Move to next lap
  const nextLap = () => {
    const t = isRunning ? performance.now() : baseStart // if paused, freeze time at last baseStart for consistency
    const lapMs = (isRunning ? t : baseStart) - lapStart + (isRunning ? 0 : 0)
    const validLapMs = isRunning ? lapMs : currentLapElapsedMs
    setLaps((prev) => [validLapMs, ...prev])
    const nt = performance.now()
    setLapStart(nt)
  }

  // Animation frame for smooth updates
  useEffect(() => {
    if (!isRunning) return
    const tick = (t) => {
      setNow(t)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isRunning])

  // Derived times
  const totalElapsedMs = useMemo(() => {
    if (isRunning) return accumulated + (now - baseStart)
    return accumulated
  }, [isRunning, accumulated, now, baseStart])

  const currentLapElapsedMs = useMemo(() => {
    if (!lapStart) return 0
    if (isRunning) return now - lapStart
    // if paused, lap time equals elapsed in this segment when paused
    return Math.max(0, baseStart ? baseStart - lapStart : 0)
  }, [isRunning, now, lapStart, baseStart])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isRunning && totalElapsedMs === 0) start()
        else if (isRunning) pause()
        else resume()
      }
      if (e.key.toLowerCase() === 'l' && isRunning) nextLap()
      if (e.key.toLowerCase() === 'r' && !isRunning && totalElapsedMs > 0) reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isRunning, totalElapsedMs, currentLapElapsedMs])

  const totalSeconds = totalElapsedMs / 1000
  const lapSeconds = currentLapElapsedMs / 1000

  const canStart = !isRunning && totalElapsedMs === 0
  const canPause = isRunning
  const canResume = !isRunning && totalElapsedMs > 0
  const canReset = !isRunning && totalElapsedMs > 0
  const canLap = isRunning

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-teal-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Lap Timer</h1>
          <p className="text-gray-600 mt-2">Hitung waktu secara real-time dalam satuan detik untuk setiap lap.</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm text-gray-500 mb-1">Total</div>
            <div className="text-5xl font-semibold tabular-nums">{formatSeconds(totalSeconds)}<span className="text-xl ml-1">detik</span></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm text-gray-500 mb-1">Lap saat ini</div>
            <div className="text-5xl font-semibold tabular-nums">{formatSeconds(lapSeconds)}<span className="text-xl ml-1">detik</span></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-10 justify-center">
          <button onClick={start} disabled={!canStart} className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition ${canStart ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed'}`}>Start</button>
          <button onClick={pause} disabled={!canPause} className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition ${canPause ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-300 cursor-not-allowed'}`}>Stop</button>
          <button onClick={resume} disabled={!canResume} className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition ${canResume ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}>Lanjut</button>
          <button onClick={nextLap} disabled={!canLap} className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition ${canLap ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-300 cursor-not-allowed'}`}>Lap berikutnya</button>
          <button onClick={reset} disabled={!canReset} className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition ${canReset ? 'bg-gray-700 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'}`}>Reset</button>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold">Daftar Lap</h2>
            <span className="text-sm text-gray-500">{laps.length} lap</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {laps.length === 0 && (
              <li className="px-6 py-6 text-gray-500">Belum ada lap. Tekan "Lap berikutnya" saat timer berjalan.</li>
            )}
            {laps.map((ms, idx) => {
              const seconds = ms / 1000
              const number = laps.length - idx
              return (
                <li key={idx} className="px-6 py-4 flex items-center justify-between">
                  <div className="font-medium">Lap {number}</div>
                  <div className="tabular-nums">{formatSeconds(seconds)} detik</div>
                </li>
              )
            })}
          </ul>
        </section>

        <footer className="text-center text-xs text-gray-500 mt-8">
          Tips: Space = Start/Pause/Lanjut, L = Lap, R = Reset
        </footer>
      </div>
    </div>
  )
}
