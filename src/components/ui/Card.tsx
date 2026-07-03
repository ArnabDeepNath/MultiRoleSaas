import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="flex flex-col space-y-1.5 p-6">
            {title && (
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
        {children && (
          <div className={cn(title || description ? "p-6 pt-0" : "p-6", className)}>
            {children}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };