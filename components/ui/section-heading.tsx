import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
  align?: "center" | "start";
};

export function SectionHeading({ children, className, as: Tag = "h2", align = "center" }: Props) {
  return (
    <Tag
      className={cn(
        "font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl lg:text-5xl",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
