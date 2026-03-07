/**
 * QuizPlayer — Interactive quiz component (React).
 *
 * TODO: Implement interactive quiz logic:
 * - Parse quiz questions from content
 * - Present one question at a time
 * - Track correct/incorrect answers
 * - Show feedback after each answer
 * - Display final score with comparison to population data
 *
 * This component will replace the static Markdoc rendering
 * on quiz detail pages once implemented.
 */

import { useState } from "react";

interface QuizPlayerProps {
  title: string;
  theme: string;
  /** Raw quiz content — to be parsed into structured questions */
  rawContent?: string;
}

export default function QuizPlayer({ title, theme }: QuizPlayerProps) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="quiz-player quiz-player--start">
        <h2>{title}</h2>
        <p>Thema: {theme}</p>
        <button onClick={() => setStarted(true)}>Quiz starten</button>
        <p className="quiz-player__note">
          <em>Interaktive Quiz-Funktion wird entwickelt.</em>
        </p>
      </div>
    );
  }

  return (
    <div className="quiz-player quiz-player--active">
      <p>Interaktive Quiz-Funktion wird in einer zukünftigen Version implementiert.</p>
      <button onClick={() => setStarted(false)}>Zurück</button>
    </div>
  );
}
