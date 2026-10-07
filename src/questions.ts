import data from '../data/multi_media.json'
import type { Question } from './types'

interface QuizData {
  lectureLabels: Record<string, string>
  questions: Question[]
}

const quizData = data as unknown as QuizData

export const LECTURE_LABELS: Record<number, string> = quizData.lectureLabels

export const QUESTIONS: Question[] = quizData.questions
