import * as React from "react";
import { Text as RNText } from "react-native";
import { cn } from "@/lib/utils";

const Text = React.forwardRef<React.ElementRef<typeof RNText>, React.ComponentPropsWithoutRef<typeof RNText>>(
  ({ className, ...props }, ref) => {
    return <RNText ref={ref} className={cn("text-foreground", className)} {...props} />;
  }
);
Text.displayName = "Text";

export { Text };
