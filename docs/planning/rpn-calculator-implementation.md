# RPN Calculator Implementation Plan

## Overview

This document details the implementation approach for adding a basic RPN calculator to Forgepad as the first step toward full Forth-like semantics. The calculator will coexist with the LLM cell system, providing immediate computational capabilities.

## Core Design Decisions

### 1. Dual Stack Architecture

**Computational Stack** (new)
- Lightweight, in-memory values
- Numbers, strings, arrays, booleans
- Instant operations without database writes
- Ephemeral by default (can be persisted)

**Cell Stack** (existing)
- Persistent, database-backed cells
- LLM prompts and responses
- Rich metadata and history
- Collaborative and versioned

### 2. Unified Interface

Users see ONE stack interface that shows both:
```
┌──────────────────────────────────┐
│ 5  │ 42            │ number      │  ← Computational value
│ 4  │ "Hello"       │ string      │  ← Computational value  
│ 3  │ @analysis     │ cell        │  ← LLM cell reference
│ 2  │ [1, 2, 3]     │ array       │  ← Computational value
│ 1  │ @summary      │ cell        │  ← LLM cell
└──────────────────────────────────┘
```

### 3. Mode Switching

**Smart Mode Detection**:
- Numbers → RPN mode
- Text starting with quotes → RPN string mode
- Other text → LLM prompt mode
- Operations (`+`, `-`, etc.) → RPN mode

**Explicit Mode Switch**:
- `Esc` → RPN mode (like vi normal mode)
- `i` → LLM prompt mode (like vi insert mode)
- Visual indicator shows current mode

## Implementation Phases

### Phase 1A: Basic Calculator (MVP)

**Features**:
- Numbers only
- Basic math: `+`, `-`, `*`, `/`
- Stack ops: `dup`, `drop`, `swap`
- Visual stack display
- Keyboard input

**Components**:
```typescript
// New state store
interface ComputationalState {
  stack: ComputationalValue[];
  history: Operation[];
  mode: 'rpn' | 'llm';
}

// Computational value type
interface ComputationalValue {
  type: 'number' | 'string' | 'array' | 'boolean';
  value: any;
  ephemeral: boolean;  // true = not in database
}
```

### Phase 1B: Integration Points

**Bridge Operations**:
- `persist` - Save computational value as cell
- `fetch` - Load cell content to computational stack
- `apply` - Use top value as LLM prompt

**Example Flow**:
```
> 10 20 +              Stack: [30]
> persist calc-result  Saves 30 as named cell
> "double this: " @calc-result concat apply
                      Triggers LLM with "double this: 30"
```

### Phase 1C: Enhanced UI

**Stack Visualization**:
- Ephemeral values in lighter color
- Cell references show preview on hover
- Animations for stack operations
- Type badges for clarity

**Input Area Enhancement**:
```typescript
interface InputState {
  mode: 'rpn' | 'llm';
  buffer: string;
  cursorPosition: number;
  autoCompleteOptions: string[];
}
```

## Technical Architecture

### State Management

**Option 1: Local State + Sync**
```typescript
// Local Zustand store for computational stack
const useComputationalStack = create((set) => ({
  stack: [],
  push: (value) => set(state => ({ 
    stack: [...state.stack, value] 
  })),
  pop: () => set(state => ({
    stack: state.stack.slice(0, -1)
  })),
  // Sync to Convex when needed
  persist: async (name?: string) => {
    const value = get().stack[get().stack.length - 1];
    await convex.mutation(api.cells.createFromValue, {
      value: value.value,
      type: value.type,
      name
    });
  }
}));
```

**Option 2: Hybrid Convex**
```typescript
// Convex schema addition
export const computationalValues = defineTable({
  workspaceId: v.id("workspaces"),
  position: v.number(),
  type: v.string(),
  value: v.any(),
  ephemeral: v.boolean(),
  sessionId: v.string(),  // Clean up on disconnect
});
```

### Parser Implementation

**Simple Tokenizer**:
```typescript
class RPNTokenizer {
  tokenize(input: string): Token[] {
    const patterns = [
      { regex: /^-?\d+(\.\d+)?/, type: 'number' },
      { regex: /^"[^"]*"/, type: 'string' },
      { regex: /^(true|false)/, type: 'boolean' },
      { regex: /^[+\-*/]/, type: 'operator' },
      { regex: /^[a-zA-Z_]\w*/, type: 'word' },
      { regex: /^\s+/, type: 'whitespace' },
    ];
    
    const tokens: Token[] = [];
    let remaining = input;
    
    while (remaining.length > 0) {
      let matched = false;
      
      for (const pattern of patterns) {
        const match = remaining.match(pattern.regex);
        if (match) {
          if (pattern.type !== 'whitespace') {
            tokens.push({
              type: pattern.type,
              value: match[0],
              position: input.length - remaining.length
            });
          }
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        throw new Error(`Unknown token at position ${input.length - remaining.length}`);
      }
    }
    
    return tokens;
  }
}
```

### Operation Execution

**Operation Registry**:
```typescript
class OperationRegistry {
  private operations = new Map<string, Operation>();
  
  register(op: Operation) {
    this.operations.set(op.symbol, op);
  }
  
  execute(symbol: string, stack: ComputationalStack) {
    const op = this.operations.get(symbol);
    if (!op) throw new Error(`Unknown operation: ${symbol}`);
    
    if (stack.depth() < op.arity) {
      throw new Error(`Stack underflow: ${symbol} requires ${op.arity} items`);
    }
    
    op.execute(stack);
  }
}

// Register basic operations
registry.register({
  symbol: '+',
  arity: 2,
  execute: (stack) => {
    const b = stack.popNumber();
    const a = stack.popNumber();
    stack.pushNumber(a + b);
  }
});
```

## UI Components

### Computational Stack Display

```tsx
export function ComputationalStackDisplay() {
  const { stack } = useComputationalStack();
  
  return (
    <div className="space-y-1">
      {stack.map((item, index) => (
        <motion.div
          key={`${index}-${item.value}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={cn(
            "flex items-center gap-2 p-2 rounded",
            item.ephemeral ? "bg-muted/50" : "bg-muted"
          )}
        >
          <span className="text-xs text-muted-foreground w-8">
            {stack.length - index}
          </span>
          <span className="flex-1 font-mono">
            {formatValue(item)}
          </span>
          <Badge variant="outline" className="text-xs">
            {item.type}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}
```

### Smart Input Component

```tsx
export function SmartInput() {
  const [mode, setMode] = useState<'rpn' | 'llm'>('llm');
  const [input, setInput] = useState('');
  const { push } = useComputationalStack();
  
  const handleSubmit = () => {
    if (mode === 'rpn') {
      const tokens = tokenizer.tokenize(input);
      tokens.forEach(token => {
        if (token.type === 'number') {
          push({ type: 'number', value: parseFloat(token.value), ephemeral: true });
        } else if (token.type === 'operator') {
          registry.execute(token.value, computationalStack);
        }
        // ... handle other token types
      });
    } else {
      // Existing LLM prompt handling
      generateWithAI({ prompt: input, ... });
    }
    setInput('');
  };
  
  // Auto-detect mode based on input
  useEffect(() => {
    const startsWithNumber = /^-?\d/.test(input);
    const startsWithQuote = /^"/.test(input);
    const isOperator = /^[+\-*/]/.test(input.trim());
    
    if (startsWithNumber || startsWithQuote || isOperator) {
      setMode('rpn');
    }
  }, [input]);
  
  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <Badge variant={mode === 'rpn' ? 'default' : 'secondary'}>
          {mode.toUpperCase()}
        </Badge>
      </div>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === 'Escape') {
            setMode('rpn');
          }
        }}
        placeholder={mode === 'rpn' ? 'Enter numbers or operations...' : 'Enter a prompt...'}
      />
    </div>
  );
}
```

## Benefits Over Pure Implementation

1. **Immediate Feedback**: No database round-trip for calculations
2. **Familiar Interface**: RPN users feel at home
3. **Seamless Integration**: Mix calculations with AI operations
4. **Progressive Complexity**: Start simple, add features gradually
5. **Performance**: Computational operations are instant

## Challenges and Mitigations

### Challenge: Stack Persistence
**Solution**: Opt-in persistence with `persist` command

### Challenge: Type Confusion  
**Solution**: Clear visual indicators and type badges

### Challenge: Mode Confusion
**Solution**: Prominent mode indicator, smart auto-detection

### Challenge: Error Recovery
**Solution**: Undo stack for all operations

## Testing Strategy

### Unit Tests
```typescript
describe('RPN Calculator', () => {
  it('performs basic arithmetic', () => {
    const stack = new ComputationalStack();
    stack.pushNumber(10);
    stack.pushNumber(20);
    operations.execute('+', stack);
    expect(stack.peek()).toEqual({ type: 'number', value: 30 });
  });
  
  it('handles type errors gracefully', () => {
    const stack = new ComputationalStack();
    stack.pushString("hello");
    stack.pushNumber(20);
    expect(() => operations.execute('+', stack)).toThrow('Type mismatch');
  });
});
```

### Integration Tests
- Test mode switching
- Test persistence to Convex
- Test LLM integration
- Test keyboard shortcuts

## Migration Path

1. **Week 1**: Basic number stack and arithmetic
2. **Week 2**: Integration with existing UI
3. **Week 3**: Persistence and cell bridging  
4. **Week 4**: Polish and testing

## Success Metrics

- Operations execute in <10ms
- Zero computational state loss
- Intuitive mode switching (<5min learning curve)
- 90% of calculations don't need LLM

## Next Steps

1. **Decide on state management approach**
2. **Create proof-of-concept UI**
3. **Implement basic tokenizer**
4. **Build operation registry**
5. **Test with real users**