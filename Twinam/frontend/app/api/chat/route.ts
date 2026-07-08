import { NextRequest, NextResponse } from 'next/server'

// Ollama runs locally on the same server — no API key needed
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2'

const SYSTEM_PROMPT = `You are Twinam's factory AI assistant — an expert industrial maintenance engineer embedded in a digital twin dashboard.

You help factory engineers by:
- Explaining current machine status, faults, and AI predictions
- Recommending preventive and corrective maintenance actions
- Suggesting solutions to avoid faults before they happen
- Answering questions about robot arms, conveyors, AGVs, and sensors

Fault types:
- normal: everything OK
- bearing_vibration: abnormal bearing wear — check lubrication and bearing condition
- joint_friction: excessive friction — check gearbox oil and joint seals
- collision_event: sudden impact — inspect arm structure and recalibrate
- payload_overload: exceeded max load — reduce payload or check end-effector
- thermal_degradation: overheating — check cooling system and ambient temperature
- backlash_reducer_wear: gearbox wear — inspect and replace reducer

Health Score: 0-100 (higher is better). Below 50 = urgent attention needed.
RUL (Remaining Useful Life): cycles left before maintenance required.
Alert levels: OK (≥75 health), LOW (50-75), MEDIUM (fault present), HIGH (<50 health), CRITICAL (<25 health or <50 RUL).

Be concise, practical, and direct. Use bullet points for action items. Always prioritize safety.
Always base your answer on the current prediction data provided if available.`

function getAlertLevel(p: { health_score: number; RUL_cycles: number; fault_type: string }): string {
  if (p.fault_type === 'normal' && p.health_score >= 75) return 'OK ✅'
  if (p.fault_type === 'normal' && p.health_score >= 50) return 'LOW 🟡'
  if (p.health_score >= 50 && p.RUL_cycles >= 100) return 'MEDIUM 🟠'
  if (p.health_score >= 25 && p.RUL_cycles >= 50) return 'HIGH 🔴'
  return 'CRITICAL 🚨'
}

export async function POST(req: NextRequest) {
  try {
    const { messages, prediction } = await req.json()

    const predictionContext = prediction
      ? `\n\n[CURRENT FACTORY STATUS — Live AI Model Output]
Unit: ${prediction.unit_id ?? 'Unknown'}
Fault Type: ${prediction.fault_type}
Affected Axis: ${prediction.fault_axis}
Health Score: ${prediction.health_score.toFixed(1)} / 100
Remaining Useful Life: ${prediction.RUL_cycles.toFixed(0)} cycles
Maintenance Required: ${prediction.maintenance_required === 1 ? 'YES ⚠️' : 'NO ✅'}
Alert Level: ${getAlertLevel(prediction)}`
      : '\n\n[No live prediction data available yet — answer based on general knowledge]'

    // Build single prompt string for Ollama
    const fullSystem = SYSTEM_PROMPT + predictionContext
    const conversationText = messages
      .map((m: { role: string; content: string }) =>
        m.role === 'user' ? `User: ${m.content}` : `Assistant: ${m.content}`
      )
      .join('\n')
    const finalPrompt = `${fullSystem}\n\n${conversationText}\nAssistant:`

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: finalPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 512,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json(
        { error: `Ollama error: ${err}. Make sure Ollama is running: ollama serve` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const reply = data.response?.trim() ?? 'No response from Ollama.'

    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    // Friendly error if Ollama is not running
    if (message.includes('ECONNREFUSED') || message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to Ollama. Please run: ollama serve — then try again.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
