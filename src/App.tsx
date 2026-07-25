import { useMemo, useState } from 'react'
import { QUESTIONS, LECTURE_LABELS } from './questions'
import type { AnswerRecord, Question, QuestionType } from './types'

type Screen = 'home' | 'quiz' | 'result'

const TYPE_LABELS: Record<QuestionType, string> = {
  choice: '4択',
  number: '数字入力',
  term: '用語入力',
}

const COUNT_OPTIONS = [10, 20, 30] as const

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 全角→半角・大小文字・空白/記号ゆらぎを吸収して比較する */
export function normalizeTerm(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　]/g, '')
    .replace(/[‐－―ー−\-_./・,、。]/g, '')
}

function parseNumber(s: string): number | null {
  const n = Number(s.normalize('NFKC').replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedLectures, setSelectedLectures] = useState<Set<number>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(new Set())
  const [count, setCount] = useState<number>(20)

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [records, setRecords] = useState<AnswerRecord[]>([])

  const lectures = useMemo(
    () => [...new Set(QUESTIONS.map((q) => q.lecture))].sort((a, b) => a - b),
    [],
  )

  const pool = useMemo(
    () =>
      QUESTIONS.filter(
        (q) =>
          (selectedLectures.size === 0 || selectedLectures.has(q.lecture)) &&
          (selectedTypes.size === 0 || selectedTypes.has(q.type)),
      ),
    [selectedLectures, selectedTypes],
  )

  function toggle<T>(set: Set<T>, value: T, update: (s: Set<T>) => void) {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    update(next)
  }

  function startQuiz(questions: Question[]) {
    setQuizQuestions(shuffle(questions).slice(0, count))
    setCurrent(0)
    setRecords([])
    setScreen('quiz')
  }

  function handleAnswered(record: AnswerRecord) {
    setRecords((prev) => [...prev, record])
  }

  function handleNext() {
    if (current + 1 < quizQuestions.length) {
      setCurrent(current + 1)
    } else {
      setScreen('result')
    }
  }

  if (screen === 'home') {
    return (
      <div>
        <h1>マルチメディア記述法 クイズ</h1>
        <p className="subtitle">第1〜13回 + 先生のテスト参考資料から出題</p>

        <div className="panel">
          <h2>出題範囲 (未選択 = 全範囲)</h2>
          <div className="chip-row">
            {lectures.map((l) => (
              <button
                key={l}
                className={`chip${selectedLectures.has(l) ? ' active' : ''}`}
                onClick={() => toggle(selectedLectures, l, setSelectedLectures)}
              >
                {LECTURE_LABELS[l] ?? `第${l}回`}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>問題タイプ (未選択 = 全タイプ)</h2>
          <div className="chip-row">
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
              <button
                key={t}
                className={`chip${selectedTypes.has(t) ? ' active' : ''}`}
                onClick={() => toggle(selectedTypes, t, setSelectedTypes)}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>出題数</h2>
          <div className="chip-row">
            {COUNT_OPTIONS.map((c) => (
              <button
                key={c}
                className={`chip${count === c ? ' active' : ''}`}
                onClick={() => setCount(c)}
              >
                {c}問
              </button>
            ))}
            <button
              className={`chip${count === Infinity ? ' active' : ''}`}
              onClick={() => setCount(Infinity)}
            >
              全部
            </button>
          </div>
          <p className="count-note">対象: {pool.length}問</p>
        </div>

        <button
          className="primary-btn"
          disabled={pool.length === 0}
          onClick={() => startQuiz(pool)}
        >
          スタート
        </button>
      </div>
    )
  }

  if (screen === 'quiz') {
    const q = quizQuestions[current]
    return (
      <div>
        <div className="meta-row">
          <span>
            {current + 1} / {quizQuestions.length}
          </span>
          <span>
            {LECTURE_LABELS[q.lecture] ?? `第${q.lecture}回`} ・ {q.topic} ・ {TYPE_LABELS[q.type]}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(current / quizQuestions.length) * 100}%` }}
          />
        </div>
        <QuestionCard
          key={q.id}
          question={q}
          onAnswered={handleAnswered}
          onNext={handleNext}
          isLast={current + 1 === quizQuestions.length}
        />
      </div>
    )
  }

  // result
  const correctCount = records.filter((r) => r.correct).length
  const wrongQuestions = records.filter((r) => !r.correct).map((r) => r.question)
  return (
    <div>
      <h1>結果</h1>
      <div className="panel">
        <div className="score-big">
          {correctCount} / {records.length}
        </div>
        <p className="score-sub">
          正答率 {records.length > 0 ? Math.round((correctCount / records.length) * 100) : 0}%
        </p>
        {wrongQuestions.length > 0 && (
          <button className="secondary-btn" onClick={() => startQuiz(wrongQuestions)}>
            間違えた{wrongQuestions.length}問をやり直す
          </button>
        )}
        <button className="secondary-btn" onClick={() => setScreen('home')}>
          ホームに戻る
        </button>
      </div>

      <div className="panel">
        <h2>振り返り</h2>
        {records.map((r, i) => (
          <div key={i} className="review-item">
            <div className="q">
              <span className={`badge ${r.correct ? 'ok' : 'ng'}`}>
                {r.correct ? '正解' : '不正解'}
              </span>
              {r.question.question}
            </div>
            <div className="a">
              あなたの回答: {r.userAnswer || '(未入力)'} ／ 正解: {correctAnswerText(r.question)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function correctAnswerText(q: Question): string {
  switch (q.type) {
    case 'choice':
      return q.choices[q.answerIndex]
    case 'number':
      return `${q.answerNumber}${q.unit ?? ''}`
    case 'term':
      return q.answers[0]
  }
}

function QuestionCard({
  question,
  onAnswered,
  onNext,
  isLast,
}: {
  question: Question
  onAnswered: (r: AnswerRecord) => void
  onNext: () => void
  isLast: boolean
}) {
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [input, setInput] = useState('')
  const [chosen, setChosen] = useState<number | null>(null)

  // 4択の選択肢は問題ごとに順序をシャッフルして表示する
  const order = useMemo(() => {
    if (question.type !== 'choice') return []
    return shuffle(question.choices.map((_, i) => i))
  }, [question])

  function finish(userAnswer: string, isCorrect: boolean) {
    setAnswered(true)
    setCorrect(isCorrect)
    onAnswered({ question, userAnswer, correct: isCorrect })
  }

  function submitChoice(index: number) {
    if (answered) return
    setChosen(index)
    finish(
      question.type === 'choice' ? question.choices[index] : '',
      question.type === 'choice' && index === question.answerIndex,
    )
  }

  function submitInput() {
    if (answered || input.trim() === '') return
    if (question.type === 'number') {
      const n = parseNumber(input)
      const tol = question.tolerance ?? 0
      const ok = n !== null && Math.abs(n - question.answerNumber) <= tol
      finish(input, ok)
    } else if (question.type === 'term') {
      const norm = normalizeTerm(input)
      const ok = question.answers.some((a) => normalizeTerm(a) === norm)
      finish(input, ok)
    }
  }

  return (
    <div className="panel">
      <div className="question-text">{question.question}</div>

      {question.type === 'choice' && (
        <div className="choices">
          {order.map((i) => {
            let cls = 'choice-btn'
            if (answered) {
              if (i === question.answerIndex) cls += ' correct'
              else if (i === chosen) cls += ' wrong'
            }
            return (
              <button key={i} className={cls} disabled={answered} onClick={() => submitChoice(i)}>
                {question.choices[i]}
              </button>
            )
          })}
        </div>
      )}

      {(question.type === 'number' || question.type === 'term') && (
        <>
          <div className="input-row">
            <input
              className="answer-input"
              inputMode={question.type === 'number' ? 'decimal' : 'text'}
              placeholder={question.type === 'number' ? '数値を入力' : '用語を入力'}
              value={input}
              disabled={answered}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitInput()
              }}
              autoFocus
            />
            {question.type === 'number' && question.unit && (
              <span className="unit">{question.unit}</span>
            )}
          </div>
          {!answered && (
            <button className="primary-btn" disabled={input.trim() === ''} onClick={submitInput}>
              回答する
            </button>
          )}
        </>
      )}

      {answered && (
        <>
          <div className={`feedback ${correct ? 'correct' : 'wrong'}`}>
            <div className="verdict">{correct ? '⭕ 正解!' : `❌ 不正解 — 正解: ${correctAnswerText(question)}`}</div>
            {question.explanation}
          </div>
          <button className="primary-btn" onClick={onNext}>
            {isLast ? '結果を見る' : '次へ'}
          </button>
        </>
      )}
    </div>
  )
}
