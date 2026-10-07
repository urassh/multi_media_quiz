import multiMedia from '../data/multi_media.json'
import networkSecurity from '../data/network_security.json'
import type { Question } from './types'

interface QuizData {
  lectureLabels: Record<string, string>
  questions: Question[]
}

export interface Subject {
  id: string
  title: string
  subtitle: string
  lectureLabels: Record<number, string>
  questions: Question[]
}

function toSubject(id: string, title: string, subtitle: string, data: unknown): Subject {
  const quizData = data as QuizData
  return { id, title, subtitle, lectureLabels: quizData.lectureLabels, questions: quizData.questions }
}

export const SUBJECTS: Subject[] = [
  toSubject(
    'multi_media',
    'マルチメディア記述法',
    '第1〜13回 + 先生のテスト参考資料から出題',
    multiMedia,
  ),
  toSubject(
    'network_security',
    'ネットワークセキュリティ',
    '第1〜6回の講義スライドから出題',
    networkSecurity,
  ),
]
