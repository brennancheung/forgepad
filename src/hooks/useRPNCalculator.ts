/**
 * React hook for RPN calculator functionality
 * Provides an interface to the computational stack with local execution
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useCallback, useState } from "react";
import { parse, looksLikeRPN } from "@/lib/rpn/rpnParser";
import { getOperation, execute } from "@/lib/rpn/rpnOperations";
import { push, pushCell } from "@/lib/rpn/rpnStack";
import { StackValue } from "@/lib/rpn/rpnTypes";

interface UseRPNCalculatorProps {
  stackId: Id<"stacks">;
}

export function useRPNCalculator({ stackId }: UseRPNCalculatorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Convex queries and mutations
  const computationalStack = useQuery(api.computationalStack.getStack, { stackId });
  const pushMutation = useMutation(api.computationalStack.push);
  const updateStackMutation = useMutation(api.computationalStack.updateStack);
  const persistMutation = useMutation(api.computationalStack.persist);
  const clearMutation = useMutation(api.computationalStack.clear);

  // Process RPN input
  const processInput = useCallback(async (input: string) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Check if input looks like RPN
      if (!looksLikeRPN(input)) {
        // Not RPN input, return false to let parent handle as LLM prompt
        setIsProcessing(false);
        return false;
      }

      // Parse the input
      const elements = parse(input);
      
      // Start with current stack state (make a copy since operations mutate)
      const workingStack: StackValue[] = [...(computationalStack || [])];

      // Process each element
      for (const element of elements) {
        switch (element.type) {
          case 'literal':
            // Push literal values
            const value: StackValue = {
              type: element.dataType,
              value: element.value,
              ephemeral: true,
            };
            push(workingStack, value);
            break;

          case 'operation':
            // Execute operation
            const operation = getOperation(element.symbol);
            if (!operation) {
              throw new Error(`Unknown operation: ${element.symbol}`);
            }
            operation.execute(workingStack);
            break;

          case 'cellref':
            // Push cell reference
            pushCell(workingStack, element.ref);
            break;

          case 'word':
            // For now, treat unknown words as errors
            // In future, this could be user-defined words
            throw new Error(`Unknown word: ${element.name}`);
        }
      }

      // Update the database with the new stack state
      await updateStackMutation({
        stackId,
        stack: workingStack,
      });

      setIsProcessing(false);
      return true; // Successfully processed as RPN
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsProcessing(false);
      return false;
    }
  }, [stackId, computationalStack, updateStackMutation]);

  // Execute a single operation
  const executeOperation = useCallback(async (operation: string) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Start with current stack (make a copy since operations mutate)
      const workingStack = [...(computationalStack || [])];

      // Execute the operation (mutates workingStack)
      execute(operation, workingStack);

      // Update the database
      await updateStackMutation({
        stackId,
        stack: workingStack,
      });

      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsProcessing(false);
    }
  }, [stackId, computationalStack, updateStackMutation]);

  // Push a single value
  const pushValue = useCallback(async (value: StackValue) => {
    setError(null);
    try {
      await pushMutation({ stackId, value });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [stackId, pushMutation]);

  // Persist top value as a cell
  const persist = useCallback(async (name?: string) => {
    setError(null);
    try {
      const cellId = await persistMutation({ stackId, name });
      return cellId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [stackId, persistMutation]);

  // Clear the stack
  const clear = useCallback(async () => {
    setError(null);
    try {
      await clearMutation({ stackId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [stackId, clearMutation]);

  // Get stack depth
  const depth = computationalStack?.length || 0;

  // Get top value (for display)
  const topValue = computationalStack?.[computationalStack.length - 1];

  return {
    stack: computationalStack || [],
    depth,
    topValue,
    error,
    isProcessing,
    processInput,
    executeOperation,
    pushValue,
    persist,
    clear,
  };
}