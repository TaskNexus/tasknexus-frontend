import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_CN'

export const INVALID_CRON_DESCRIPTION = '无效 Cron 表达式'

export interface CronPayloadFields {
  minute: string
  hour: string
  day_of_month: string
  month_of_year: string
  day_of_week: string
}

function isIntegerToken(token: string): boolean {
  return /^\d+$/.test(token)
}

function pad2(value: string): string {
  return value.padStart(2, '0')
}

function toNaturalChinese(parsed: CronPayloadFields): string | null {
  const { minute, hour, day_of_month, month_of_year, day_of_week } = parsed

  // Fixed time every day, e.g. "0 21 * * *" => "每天的 21:00"
  if (
    isIntegerToken(minute) &&
    isIntegerToken(hour) &&
    day_of_month === '*' &&
    month_of_year === '*' &&
    day_of_week === '*'
  ) {
    return `每天的 ${pad2(hour)}:${pad2(minute)}`
  }

  return null
}

export function splitCronToPayload(cron: string): CronPayloadFields | null {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return null

  const [minute, hour, day_of_month, month_of_year, day_of_week] = parts
  if (!minute || !hour || !day_of_month || !month_of_year || !day_of_week) return null

  return {
    minute,
    hour,
    day_of_month,
    month_of_year,
    day_of_week
  }
}

export function formatCronZh(cron: string, fallback = INVALID_CRON_DESCRIPTION): string {
  const raw = cron.trim()
  if (!raw) return fallback
  const parsed = splitCronToPayload(raw)
  if (!parsed) return fallback

  const natural = toNaturalChinese(parsed)
  if (natural) return natural

  try {
    return cronstrue.toString(raw, {
      locale: 'zh_CN',
      use24HourTimeFormat: true
    })
  } catch {
    return fallback
  }
}
