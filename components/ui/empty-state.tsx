import Image from "next/image";

import { ButtonLink } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  image?: { src: string; alt: string };
  action?: { href: string; label: string };
};

export function EmptyState({ title, description, image, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 py-14 text-center sm:py-20">
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={420}
          height={302}
          className="h-auto w-full max-w-xs sm:max-w-sm"
        />
      ) : null}
      <div className="space-y-3">
        <h2 className="font-display text-2xl uppercase text-ink sm:text-3xl">{title}</h2>
        <p className="mx-auto max-w-md text-sm text-ink-muted sm:text-base">{description}</p>
      </div>
      {action ? (
        <ButtonLink href={action.href} size="lg">
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}
