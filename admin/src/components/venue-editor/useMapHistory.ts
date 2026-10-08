"use client";

import { useCallback, useReducer } from "react";
import type { VenueMapContent } from "@/lib/venue-map-types";

const LIMIT = 100;

type State = { past: VenueMapContent[]; present: VenueMapContent; future: VenueMapContent[] };
type Action =
  | { type: "reset"; content: VenueMapContent }
  | { type: "commit"; content: VenueMapContent }
  | { type: "undo" }
  | { type: "redo" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { past: [], present: action.content, future: [] };
    case "commit":
      if (action.content === state.present) return state;
      return { past: [...state.past, state.present].slice(-LIMIT), present: action.content, future: [] };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
    }
    case "redo": {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { past: [...state.past, state.present], present: next, future: rest };
    }
  }
}

/** Plan content with undo/redo. Each commit is one step (a whole drag, a whole field edit). */
export function useMapHistory(initial: VenueMapContent) {
  const [state, dispatch] = useReducer(reducer, { past: [], present: initial, future: [] });
  return {
    content: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit: useCallback((content: VenueMapContent) => dispatch({ type: "commit", content }), []),
    reset: useCallback((content: VenueMapContent) => dispatch({ type: "reset", content }), []),
    undo: useCallback(() => dispatch({ type: "undo" }), []),
    redo: useCallback(() => dispatch({ type: "redo" }), []),
  };
}
