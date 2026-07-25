export type QuestionType = 'choice' | 'number' | 'term'

export interface BaseQuestion {
  id: string
  /** 講義回 (1-13)。複数回にまたがる/先生の参考資料由来は 0 */
  lecture: number
  topic: string
  type: QuestionType
  question: string
  explanation: string
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice'
  choices: string[]
  answerIndex: number
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number'
  answerNumber: number
  /** 入力欄の後ろに表示する単位 (例: "kHz", "×2160") */
  unit?: string
  /** 許容誤差 (省略時は完全一致) */
  tolerance?: number
}

export interface TermQuestion extends BaseQuestion {
  type: 'term'
  /** 正解として受理する表記のバリエーション */
  answers: string[]
}

export type Question = ChoiceQuestion | NumberQuestion | TermQuestion

export interface AnswerRecord {
  question: Question
  userAnswer: string
  correct: boolean
}
