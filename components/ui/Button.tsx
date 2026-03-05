"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

const variantStyles = {
  primary:
    "bg-mcdonalds-red text-white font-semibold hover:bg-mcdonalds-dark-red shadow-md",
  secondary:
    "bg-mcdonalds-yellow text-black font-semibold hover:bg-mcdonalds-light-yellow shadow-md",
  outline:
    "border-2 border-mcdonalds-red text-mcdonalds-red font-semibold hover:bg-mcdonalds-red hover:text-white",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-lg",
  lg: "px-8 py-3.5 text-lg rounded-lg",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${variantStyles[variant]} ${sizeStyles[size]} transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
