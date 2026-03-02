import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

type UserIconProps = {
  name: string;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function UserIcon({ name, image, size, className }: UserIconProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
