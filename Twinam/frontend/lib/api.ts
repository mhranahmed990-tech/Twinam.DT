// lib/api.ts
// Connection layer between the frontend (Next.js) and the prediction server (FastAPI).
// Reads the API URL from the NEXT_PUBLIC_API_URL environment variable, defaulting
// to http://localhost:8000 for local development.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type SensorRange = { min: number; max: number; default: number; step: number }
export type SensorConfig = Record<string, SensorRange>

export type PredictionResult = {
  unit_id?: string | null
  RUL_cycles: number
  maintenance_required: number
  fault_type: string
  fault_axis: string
  health_score: number
}

/** Real sensor ranges for a single robot arm (6 axes) — same values as the backend.
 *  Used as a local fallback if /sensor_config is unreachable. */
export const ARM_SENSOR_CONFIG: SensorConfig = {
  cycle_in_run: { min: 0.0, max: 24.0, default: 0.0, step: 1.0 },
  payload_mass_kg: { min: 1.5848, max: 13.2335, default: 3.9363, step: 0.01 },
  speed_scale: { min: 0.3167, max: 0.9444, default: 0.4792, step: 0.01 },
  cycle_time_s: { min: 1.6623, max: 2.8852, default: 2.417, step: 0.01 },
  ambient_temp_c: { min: 17.9587, max: 31.4658, default: 25.038, step: 0.01 },

  joint_1_pos_deg: { min: -48.825663, max: 45.214852, default: 2.951731, step: 0.01 },
  joint_1_vel_deg_s: { min: -160.225684, max: 177.905403, default: 149.654296, step: 0.1 },
  joint_1_acc_deg_s2: { min: -616.443421, max: 593.565985, default: 2.26848, step: 0.1 },
  joint_1_effort_nm: { min: 3.828705, max: 47.360707, default: 15.612733, step: 0.01 },

  joint_2_pos_deg: { min: -57.468917, max: 17.964041, default: -14.847262, step: 0.01 },
  joint_2_vel_deg_s: { min: -122.280597, max: 140.000114, default: 121.888861, step: 0.1 },
  joint_2_acc_deg_s2: { min: -462.318874, max: 581.320915, default: -125.2876, step: 0.1 },
  joint_2_effort_nm: { min: 4.204682, max: 55.461456, default: 23.966626, step: 0.01 },

  joint_3_pos_deg: { min: -24.584528, max: 66.710771, default: 25.859824, step: 0.01 },
  joint_3_vel_deg_s: { min: -135.663027, max: 162.817275, default: 133.391891, step: 0.1 },
  joint_3_acc_deg_s2: { min: -1045.167204, max: 985.837246, default: -133.83333, step: 0.1 },
  joint_3_effort_nm: { min: 5.751576, max: 95.372726, default: 24.94897, step: 0.01 },

  joint_4_pos_deg: { min: -66.322682, max: 59.819256, default: 5.206664, step: 0.01 },
  joint_4_vel_deg_s: { min: -172.443747, max: 212.092869, default: 162.281557, step: 0.1 },
  joint_4_acc_deg_s2: { min: -1360.575221, max: 1506.491414, default: -139.617004, step: 0.1 },
  joint_4_effort_nm: { min: 7.804933, max: 110.847477, default: 23.467842, step: 0.01 },

  joint_5_pos_deg: { min: -30.115371, max: 45.618151, default: 10.636417, step: 0.01 },
  joint_5_vel_deg_s: { min: -95.59371, max: 118.321664, default: 86.879971, step: 0.1 },
  joint_5_acc_deg_s2: { min: -968.89711, max: 1043.196447, default: 66.741469, step: 0.1 },
  joint_5_effort_nm: { min: 4.840431, max: 73.36472, default: 12.894667, step: 0.01 },

  joint_6_pos_deg: { min: -81.957006, max: 76.716877, default: 5.207798, step: 0.01 },
  joint_6_vel_deg_s: { min: -220.753215, max: 231.340077, default: 189.162823, step: 0.1 },
  joint_6_acc_deg_s2: { min: -1026.851945, max: 1320.552819, default: -150.006738, step: 0.1 },
  joint_6_effort_nm: { min: 8.026439, max: 76.331823, default: 23.183949, step: 0.01 },

  synthetic_current_j1_a: { min: 0.502563, max: 6.612378, default: 3.52271, step: 0.01 },
  synthetic_current_j2_a: { min: 0.480255, max: 6.895769, default: 4.110197, step: 0.01 },
  synthetic_current_j3_a: { min: 0.767049, max: 11.44152, default: 4.343192, step: 0.01 },
  synthetic_current_j4_a: { min: 1.181992, max: 13.085844, default: 4.50384, step: 0.01 },
  synthetic_current_j5_a: { min: 0.784883, max: 8.271005, default: 2.440558, step: 0.01 },
  synthetic_current_j6_a: { min: 2.127814, max: 9.217738, default: 4.802831, step: 0.01 },

  synthetic_temp_j1_c: { min: 20.86037, max: 43.433727, default: 28.41727, step: 0.05 },
  synthetic_temp_j2_c: { min: 21.494284, max: 40.364406, default: 29.025691, step: 0.05 },
  synthetic_temp_j3_c: { min: 20.953869, max: 46.780237, default: 29.948583, step: 0.05 },
  synthetic_temp_j4_c: { min: 21.210996, max: 49.692969, default: 26.882917, step: 0.05 },
  synthetic_temp_j5_c: { min: 20.947152, max: 37.907305, default: 27.041724, step: 0.05 },
  synthetic_temp_j6_c: { min: 21.158927, max: 57.177854, default: 28.740571, step: 0.05 },

  synthetic_vibration_j1_g: { min: 0.0, max: 0.266098, default: 0.088124, step: 0.001 },
  synthetic_vibration_j2_g: { min: 0.0, max: 0.090878, default: 0.07836, step: 0.001 },
  synthetic_vibration_j3_g: { min: 0.0, max: 0.476987, default: 0.081719, step: 0.001 },
  synthetic_vibration_j4_g: { min: 0.0, max: 0.288625, default: 0.0993, step: 0.001 },
  synthetic_vibration_j5_g: { min: 0.0, max: 0.085526, default: 0.05444, step: 0.001 },
  synthetic_vibration_j6_g: { min: 0.0, max: 0.306089, default: 0.109175, step: 0.001 },

  tracking_error_j1_deg: { min: -0.10515, max: 0.961845, default: -0.012278, step: 0.001 },
  tracking_error_j2_deg: { min: -0.108861, max: 0.118921, default: 0.022788, step: 0.001 },
  tracking_error_j3_deg: { min: -0.378471, max: 0.702623, default: 0.016539, step: 0.001 },
  tracking_error_j4_deg: { min: -0.378608, max: 0.394275, default: 0.022814, step: 0.001 },
  tracking_error_j5_deg: { min: -0.274786, max: 0.313626, default: 0.031449, step: 0.001 },
  tracking_error_j6_deg: { min: -0.102655, max: 0.109323, default: 0.013498, step: 0.001 },
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

/** Generates a realistic sensor reading (within the real range) for a single robot arm,
 *  simulating the live reading coming from the actual production line. */
export function generateArmSample(config: SensorConfig = ARM_SENSOR_CONFIG): Record<string, number> {
  const sample: Record<string, number> = {}
  for (const [key, cfg] of Object.entries(config)) {
    sample[key] = Math.round(randomInRange(cfg.min, cfg.max) * 10000) / 10000
  }
  return sample
}

let cachedSensorConfig: SensorConfig | null = null

/** Tries to fetch the real sensor ranges from the backend (/sensor_config),
 *  falling back to the static local copy if unreachable (server down). */
export async function fetchSensorConfig(): Promise<SensorConfig> {
  if (cachedSensorConfig) return cachedSensorConfig
  try {
    const res = await fetch(`${API_URL}/sensor_config`, { cache: 'no-store' })
    if (!res.ok) throw new Error('bad response')
    const data = (await res.json()) as SensorConfig
    cachedSensorConfig = data
    return data
  } catch {
    return ARM_SENSOR_CONFIG
  }
}

/** Sends the sensor reading to the real prediction model and returns the results. */
export async function predictAll(
  features: Record<string, number | string>,
  unitId?: string,
): Promise<PredictionResult> {
  const res = await fetch(`${API_URL}/predict_all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features, unit_id: unitId }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Failed to connect to the prediction server (${res.status}): ${body}`)
  }
  return (await res.json()) as PredictionResult
}
