import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import NumberFlow, { continuous } from "@number-flow/react";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
      {props.value?.[0] != null && (
        <NumberFlow
          willChange
          value={props.value[0]}
          isolate
          plugins={[continuous]}
          opacityTiming={{
            duration: 250,
            easing: "ease-out",
          }}
          transformTiming={{
            easing: "linear",
            duration: 500,
          }}
          className="absolute top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs"
        />
      )}
    </SliderPrimitive.Thumb>
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
