/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cells from "../cells.js";
import type * as computationalStack from "../computationalStack.js";
import type * as prompts from "../prompts.js";
import type * as sources_mutations from "../sources/mutations.js";
import type * as sources_queries from "../sources/queries.js";
import type * as sources_references from "../sources/references.js";
import type * as sources_validation from "../sources/validation.js";
import type * as stacks from "../stacks.js";
import type * as types_sources from "../types/sources.js";
import type * as users from "../users.js";
import type * as workspaces from "../workspaces.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cells: typeof cells;
  computationalStack: typeof computationalStack;
  prompts: typeof prompts;
  "sources/mutations": typeof sources_mutations;
  "sources/queries": typeof sources_queries;
  "sources/references": typeof sources_references;
  "sources/validation": typeof sources_validation;
  stacks: typeof stacks;
  "types/sources": typeof types_sources;
  users: typeof users;
  workspaces: typeof workspaces;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
