import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  text: string;
  isMultiple: boolean;
  isSelected: boolean;
  isAnswered: boolean;
  isCorrect: boolean;
  onClick: () => void;
};

const choiceLabel = (index: number) => String.fromCharCode(65 + index);

export function ChoiceButton({
  index,
  text,
  isMultiple,
  isSelected,
  isAnswered,
  isCorrect,
  onClick,
}: Props) {
  const getVariantClasses = () => {
    if (!isAnswered) {
      return isSelected
        ? "border-primary bg-primary/10"
        : "border-input hover:bg-accent";
    }

    if (isCorrect) {
      return "border-green-500 bg-green-50 text-green-900";
    }
    if (isSelected && !isCorrect) {
      return "border-red-500 bg-red-50 text-red-900";
    }
    return "border-input opacity-60";
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "h-auto justify-start px-4 py-3 text-left",
        getVariantClasses(),
      )}
      onClick={onClick}
      disabled={isAnswered}
    >
      {isMultiple && (
        <Checkbox
          checked={isSelected}
          className="mr-3"
          tabIndex={-1}
          aria-hidden
        />
      )}
      <span className="mr-3 font-mono text-muted-foreground">
        {choiceLabel(index)}
      </span>
      <span className="flex-1">{text}</span>
    </Button>
  );
}
