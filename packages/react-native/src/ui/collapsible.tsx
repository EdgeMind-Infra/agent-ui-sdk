import * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import type React from "react";
import type { View } from "react-native";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent: React.ForwardRefExoticComponent<
  CollapsiblePrimitive.ContentProps & React.RefAttributes<React.ComponentRef<typeof View>>
> = CollapsiblePrimitive.Content;

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
