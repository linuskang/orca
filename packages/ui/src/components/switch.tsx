"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "md" | "lg" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center p-[2px] transition-colors outline-none",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "aria-invalid:ring-2 aria-invalid:ring-destructive",
        // Sizes: default/sm = 24x16 (original reference match), md = 28x18, lg = 32x20
        "data-[size=default]:h-4 data-[size=default]:w-6 data-[size=default]:rounded-[4px]",
        "data-[size=sm]:h-4 data-[size=sm]:w-6 data-[size=sm]:rounded-[4px]",
        "data-[size=md]:h-[18px] data-[size=md]:w-[28px] data-[size=md]:rounded-[4.5px]",
        "data-[size=lg]:h-5 data-[size=lg]:w-8 data-[size=lg]:rounded-[5px]",
        "data-checked:bg-[#4464f6] data-unchecked:bg-[#6b6b6b]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block bg-white dark:bg-white shadow-xs transition-transform duration-150 ease-out data-unchecked:translate-x-0",
          // default & sm: 12x12 thumb, translates 8px
          "group-data-[size=default]/switch:size-3 group-data-[size=default]/switch:rounded-[2.5px] group-data-[size=default]/switch:data-checked:translate-x-2",
          "group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:rounded-[2.5px] group-data-[size=sm]/switch:data-checked:translate-x-2",
          // md: 14x14 thumb, translates 10px
          "group-data-[size=md]/switch:size-[14px] group-data-[size=md]/switch:rounded-[3px] group-data-[size=md]/switch:data-checked:translate-x-[10px]",
          // lg: 16x16 thumb, translates 12px
          "group-data-[size=lg]/switch:size-4 group-data-[size=lg]/switch:rounded-[3.5px] group-data-[size=lg]/switch:data-checked:translate-x-3"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
