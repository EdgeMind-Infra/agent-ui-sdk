// @agent-ui-sdk/react-native
// React Native bindings for Agent UI SDK
//
// Core types/functions: import from "@agent-ui-sdk/core"
// Store/Provider/Hooks: import from "@agent-ui-sdk/core/react"
// AI SDK bridge:        import from "@agent-ui-sdk/core/ai-sdk"

// RN-specific hooks
export type { UseSmoothOptions, UseSmoothReturn } from "./hooks/use-smooth";
export { useSmooth } from "./hooks/use-smooth";

// All RN primitives
export * from "./primitives";
