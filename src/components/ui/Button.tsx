import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, asChild, children, ...props }, ref) => {
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
      icon: "p-2",
    };

    const combinedClassName = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
      variants[variant],
      sizes[size],
      className
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(combinedClassName, (children.props as any).className),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };