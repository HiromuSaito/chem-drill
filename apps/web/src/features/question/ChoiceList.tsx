import { ChoiceButton } from "./ChoiceButton";

type Props = {
  choices: string[];
  correctIndexes: number[];
  selectedIndexes: number[];
  isAnswered: boolean;
  onSelect: (index: number) => void;
};

export function ChoiceList({
  choices,
  correctIndexes,
  selectedIndexes,
  isAnswered,
  onSelect,
}: Props) {
  const isMultiple = correctIndexes.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice, i) => (
        <ChoiceButton
          key={i}
          index={i}
          text={choice}
          isMultiple={isMultiple}
          isSelected={selectedIndexes.includes(i)}
          isAnswered={isAnswered}
          isCorrect={correctIndexes.includes(i)}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
