/**
 * Convex mutations and queries for computational stack
 * Manages ephemeral computational values alongside persistent cells
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Define the computational value schema
const stackValueSchema = v.object({
  type: v.union(
    v.literal("number"),
    v.literal("string"),
    v.literal("array"),
    v.literal("boolean"),
    v.literal("cell")
  ),
  value: v.any(),
  ephemeral: v.boolean(),
});

// Push a value to the computational stack for a stack
export const push = mutation({
  args: {
    stackId: v.id("stacks"),
    value: stackValueSchema,
  },
  handler: async (ctx, args) => {
    // Get the stack
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    // Initialize computational stack if it doesn't exist
    if (!stack.computationalStack) {
      await ctx.db.patch(args.stackId, {
        computationalStack: [args.value],
      });
    } else {
      await ctx.db.patch(args.stackId, {
        computationalStack: [...stack.computationalStack, args.value],
      });
    }
  },
});

// Pop a value from the computational stack
export const pop = mutation({
  args: {
    stackId: v.id("stacks"),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    const compStack = stack.computationalStack || [];
    if (compStack.length === 0) {
      return null;
    }

    const newStack = compStack.slice(0, -1);
    await ctx.db.patch(args.stackId, {
      computationalStack: newStack,
    });

    return compStack[compStack.length - 1];
  },
});

// Clear the computational stack
export const clear = mutation({
  args: {
    stackId: v.id("stacks"),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    await ctx.db.patch(args.stackId, {
      computationalStack: [],
    });
  },
});

// Get the current computational stack
export const getStack = query({
  args: {
    stackId: v.id("stacks"),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    return stack.computationalStack || [];
  },
});

// Batch update the entire stack (for complex operations)
export const updateStack = mutation({
  args: {
    stackId: v.id("stacks"),
    stack: v.array(stackValueSchema),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    await ctx.db.patch(args.stackId, {
      computationalStack: args.stack,
    });
  },
});

// Convert a computational value to a persistent cell
export const persist = mutation({
  args: {
    stackId: v.id("stacks"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    const compStack = stack.computationalStack || [];
    if (compStack.length === 0) {
      throw new Error("Stack is empty");
    }

    const topValue = compStack[compStack.length - 1];
    
    // Find the next position for the new cell
    const maxPosition = Math.max(...(stack.cells.map((_, idx) => idx)), -1);
    const newPosition = maxPosition + 1;
    
    // Create a new cell with the computational value
    const cellId = await ctx.db.insert("cells", {
      stackId: args.stackId,
      stackPosition: newPosition,
      content: JSON.stringify(topValue.value),
      type: "computational",
      status: "complete",
      metadata: {
        sourceType: topValue.type,
        persisted: true,
        createdAt: Date.now(),
      },
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add to stack cells
    const newCells = [...stack.cells, cellId];
    await ctx.db.patch(args.stackId, {
      cells: newCells,
    });

    // Remove from computational stack and replace with cell reference
    const newCompStack = [...compStack.slice(0, -1), {
      type: "cell" as const,
      value: cellId,
      ephemeral: false,
    }];
    await ctx.db.patch(args.stackId, {
      computationalStack: newCompStack,
    });

    return cellId;
  },
});

// Execute an RPN operation
export const executeOperation = mutation({
  args: {
    stackId: v.id("stacks"),
    operation: v.string(),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    const compStack = stack.computationalStack || [];
    
    // This is a simplified version - in the real implementation,
    // we'll need to handle all operations properly
    // For now, let's handle basic arithmetic
    
    switch (args.operation) {
      case '+': {
        if (compStack.length < 2) throw new Error("Stack underflow");
        const b = compStack[compStack.length - 1];
        const a = compStack[compStack.length - 2];
        if (a.type !== 'number' || b.type !== 'number') {
          throw new Error("Type error: + requires numbers");
        }
        const result = {
          type: 'number' as const,
          value: a.value + b.value,
          ephemeral: true,
        };
        const newStack = [...compStack.slice(0, -2), result];
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      case '-': {
        if (compStack.length < 2) throw new Error("Stack underflow");
        const b = compStack[compStack.length - 1];
        const a = compStack[compStack.length - 2];
        if (a.type !== 'number' || b.type !== 'number') {
          throw new Error("Type error: - requires numbers");
        }
        const result = {
          type: 'number' as const,
          value: a.value - b.value,
          ephemeral: true,
        };
        const newStack = [...compStack.slice(0, -2), result];
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      case '*': {
        if (compStack.length < 2) throw new Error("Stack underflow");
        const b = compStack[compStack.length - 1];
        const a = compStack[compStack.length - 2];
        if (a.type !== 'number' || b.type !== 'number') {
          throw new Error("Type error: * requires numbers");
        }
        const result = {
          type: 'number' as const,
          value: a.value * b.value,
          ephemeral: true,
        };
        const newStack = [...compStack.slice(0, -2), result];
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      case '/': {
        if (compStack.length < 2) throw new Error("Stack underflow");
        const b = compStack[compStack.length - 1];
        const a = compStack[compStack.length - 2];
        if (a.type !== 'number' || b.type !== 'number') {
          throw new Error("Type error: / requires numbers");
        }
        if (b.value === 0) throw new Error("Division by zero");
        const result = {
          type: 'number' as const,
          value: a.value / b.value,
          ephemeral: true,
        };
        const newStack = [...compStack.slice(0, -2), result];
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      case 'dup': {
        if (compStack.length < 1) throw new Error("Stack underflow");
        const top = compStack[compStack.length - 1];
        const newStack = [...compStack, { ...top }];
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      case 'drop': {
        if (compStack.length < 1) throw new Error("Stack underflow");
        const newStack = compStack.slice(0, -1);
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      case 'swap': {
        if (compStack.length < 2) throw new Error("Stack underflow");
        const a = compStack[compStack.length - 2];
        const b = compStack[compStack.length - 1];
        const newStack = [...compStack.slice(0, -2), b, a];
        await ctx.db.patch(args.stackId, {
          computationalStack: newStack,
        });
        break;
      }
      
      default:
        throw new Error(`Unknown operation: ${args.operation}`);
    }
  },
});