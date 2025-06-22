/**
 * Display component for the computational stack
 * Shows ephemeral values and cell references with type indicators
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StackValue } from "@/lib/rpn/rpnTypes";
// import { motion, AnimatePresence } from "framer-motion";

interface ComputationalStackDisplayProps {
  stack: StackValue[];
  className?: string;
}

export function ComputationalStackDisplay({ 
  stack, 
  className 
}: ComputationalStackDisplayProps) {
  // Format value for display
  const formatValue = (item: StackValue): string => {
    switch (item.type) {
      case 'number':
        // Format numbers nicely
        const num = item.value;
        if (Number.isInteger(num)) {
          return num.toString();
        }
        // Limit decimal places
        return num.toFixed(Math.min(6, (num.toString().split('.')[1] || '').length));
      
      case 'string':
        // Show strings with quotes
        return `"${item.value}"`;
      
      case 'boolean':
        return item.value ? 'true' : 'false';
      
      case 'array':
        // Show array preview
        const arr = item.value as StackValue[];
        if (arr.length === 0) return '[]';
        if (arr.length <= 3) {
          return `[${arr.map(v => formatValue(v)).join(', ')}]`;
        }
        return `[${formatValue(arr[0])}, ... ${arr.length} items]`;
      
      case 'cell':
        // Show cell reference
        return typeof item.value === 'string' && item.value.startsWith('@') 
          ? item.value 
          : `#cell`;
      
      default:
        return JSON.stringify(item.value);
    }
  };

  // Get type color
  const getTypeColor = (type: StackValue['type']) => {
    switch (type) {
      case 'number': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'string': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'boolean': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'array': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'cell': return 'bg-pink-500/10 text-pink-700 dark:text-pink-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  if (stack.length === 0) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="text-center text-sm text-muted-foreground">
          Computational stack is empty
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Computational Stack</h3>
          <span className="text-xs text-muted-foreground">
            {stack.length} {stack.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {stack.map((item, index) => {
              const position = stack.length - index;
              return (
                <div
                  key={`${index}-${item.type}-${item.value}`}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md",
                    item.ephemeral 
                      ? "bg-muted/50 border border-dashed border-muted-foreground/20" 
                      : "bg-muted"
                  )}
                >
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {position}
                  </span>
                  <span className="flex-1 font-mono text-sm truncate">
                    {formatValue(item)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getTypeColor(item.type))}
                  >
                    {item.type}
                  </Badge>
                  {item.ephemeral && (
                    <span className="text-xs text-muted-foreground">
                      temp
                    </span>
                  )}
                </div>
              );
            }).reverse()} {/* Reverse to show top of stack at top */}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}