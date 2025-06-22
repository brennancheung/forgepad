# Forth-like Semantics for Forgepad

## Overview

This document explores adding Forth-inspired concatenative programming semantics to Forgepad, starting with basic RPN calculator operations and expanding to strings and arrays. The goal is to create a powerful, composable system that integrates naturally with the existing LLM-based cell architecture.

## Core Design Principles

1. **Hybrid Stack Model**: Combine traditional Forth data stack with Forgepad's cell-based stack
2. **Type Awareness**: Unlike pure Forth, maintain type information for better LLM integration
3. **Progressive Enhancement**: Start simple (numbers), expand to complex types (strings, arrays, cells)
4. **Keyboard-First**: All operations accessible via single keystrokes or short commands
5. **LLM Integration**: Seamless mixing of computational and AI operations

## Phase 1: Basic RPN Calculator

### Data Types
```typescript
type StackValue = 
  | { type: 'number', value: number }
  | { type: 'string', value: string }
  | { type: 'array', value: StackValue[] }
  | { type: 'cell', value: CellReference }
  | { type: 'boolean', value: boolean }
```

### Arithmetic Operations

#### Basic Math
- `+` - Add top two numbers: `3 4 + → 7`
- `-` - Subtract: `10 3 - → 7`
- `*` - Multiply: `4 5 * → 20`
- `/` - Divide: `20 4 / → 5`
- `%` - Modulo: `10 3 % → 1`
- `**` - Power: `2 8 ** → 256`
- `sqrt` - Square root: `16 sqrt → 4`
- `neg` - Negate: `5 neg → -5`

#### Stack Operations (Already planned, but essential for RPN)
- `dup` - Duplicate top: `3 dup → 3 3`
- `drop` - Remove top: `3 4 drop → 3`
- `swap` - Swap top two: `3 4 swap → 4 3`
- `over` - Copy second to top: `3 4 over → 3 4 3`
- `rot` - Rotate top three: `1 2 3 rot → 2 3 1`
- `pick` - Copy nth item: `1 2 3 4 2 pick → 1 2 3 4 2`
- `roll` - Move nth item to top: `1 2 3 4 2 roll → 1 3 4 2`
- `depth` - Push stack depth: `1 2 3 depth → 1 2 3 3`
- `clear` - Clear entire stack

#### Comparison Operations
- `=` - Equal: `3 3 = → true`
- `!=` - Not equal: `3 4 != → true`
- `<` - Less than: `3 4 < → true`
- `>` - Greater than: `4 3 > → true`
- `<=` - Less or equal: `3 3 <= → true`
- `>=` - Greater or equal: `4 4 >= → true`

#### Logical Operations
- `and` - Logical AND: `true false and → false`
- `or` - Logical OR: `true false or → true`
- `not` - Logical NOT: `true not → false`

### Input Modes

#### Immediate Mode (Default)
- Numbers typed directly push to stack: `42 [Enter] → pushes 42`
- Operations execute immediately: `3 4 + → 7`

#### Command Mode (`:`)
- `:add3 3 + ;` - Define new word
- `:square dup * ;` - Square function

### Example Session
```
> 10                    Stack: [10]
> 20                    Stack: [10, 20]
> +                     Stack: [30]
> 5                     Stack: [30, 5]
> *                     Stack: [150]
> sqrt                  Stack: [12.247...]
> dup                   Stack: [12.247..., 12.247...]
> *                     Stack: [150]
```

## Phase 2: String Operations

### String Literals
- `"hello"` - Push string to stack
- Strings preserve spaces and special characters

### String Operations
- `concat` or `.` - Concatenate: `"Hello" " World" concat → "Hello World"`
- `len` - Length: `"Hello" len → 5`
- `upper` - Uppercase: `"hello" upper → "HELLO"`
- `lower` - Lowercase: `"HELLO" lower → "hello"`
- `split` - Split by delimiter: `"a,b,c" "," split → ["a", "b", "c"]`
- `join` - Join array: `["a", "b", "c"] "," join → "a,b,c"`
- `substr` - Substring: `"hello" 1 3 substr → "ell"`
- `contains` - Check substring: `"hello" "ell" contains → true`
- `replace` - Replace substring: `"hello" "l" "L" replace → "heLLo"`

### String/Number Conversion
- `str` - Convert to string: `42 str → "42"`
- `num` - Parse to number: `"42" num → 42`

### Example
```
> "Hello"               Stack: ["Hello"]
> " World"              Stack: ["Hello", " World"]
> concat                Stack: ["Hello World"]
> dup                   Stack: ["Hello World", "Hello World"]
> len                   Stack: ["Hello World", 11]
> "!" concat            Stack: ["Hello World!"]
```

## Phase 3: Array Operations

### Array Literals
- `[ 1 2 3 ]` - Create array with values
- `[]` - Empty array
- Arrays can be heterogeneous: `[ 42 "hello" true ]`

### Array Operations
- `push` - Add to end: `[1 2] 3 push → [1 2 3]`
- `pop` - Remove from end: `[1 2 3] pop → [1 2] 3`
- `unshift` - Add to start: `[2 3] 1 unshift → [1 2 3]`
- `shift` - Remove from start: `[1 2 3] shift → 1 [2 3]`
- `get` - Get by index: `[10 20 30] 1 get → 20`
- `set` - Set by index: `[10 20 30] 1 99 set → [10 99 30]`
- `len` - Array length: `[1 2 3] len → 3`
- `reverse` - Reverse array: `[1 2 3] reverse → [3 2 1]`
- `sort` - Sort array: `[3 1 2] sort → [1 2 3]`
- `map` - Apply operation: `[1 2 3] [2 *] map → [2 4 6]`
- `filter` - Filter elements: `[1 2 3 4] [2 >] filter → [3 4]`
- `reduce` - Reduce to value: `[1 2 3 4] 0 [+] reduce → 10`
- `flatten` - Flatten nested: `[[1 2] [3 4]] flatten → [1 2 3 4]`

### Array/Stack Conversion
- `pack` - Pack n items into array: `1 2 3 3 pack → [1 2 3]`
- `unpack` - Unpack array to stack: `[1 2 3] unpack → 1 2 3`

### Example
```
> [ 1 2 3 ]            Stack: [[1, 2, 3]]
> 4 push               Stack: [[1, 2, 3, 4]]
> dup                  Stack: [[1, 2, 3, 4], [1, 2, 3, 4]]
> [2 *] map            Stack: [[1, 2, 3, 4], [2, 4, 6, 8]]
> 0 [+] reduce         Stack: [[1, 2, 3, 4], 20]
```

## Phase 4: Integration with LLM Cells

### Cell References as Values
- Cells can be pushed to the computational stack
- `@summary` - Push named cell reference
- `#3` - Push cell at position 3

### Mixed Operations
```
> @data                 Stack: [<cell: customer_data>]
> "Analyze for trends" query
                       Stack: [<cell: analysis_result>]
> "Summary: " swap concat
                       Stack: ["Summary: <analysis_text>"]
> save-cell summary    (Saves to named cell)
```

### Type Coercion with Cells
- When a cell is used where a string is expected, use its content
- When a cell is used where a number is expected, attempt to parse

### Cell Operations
- `content` - Extract cell content as string
- `metadata` - Get cell metadata as object
- `execute` - Re-run a prompt cell

## Implementation Architecture

### Stack Manager
```typescript
class ComputationalStack {
  private stack: StackValue[] = [];
  
  push(value: StackValue): void {
    this.stack.push(value);
    this.notifyUpdate();
  }
  
  pop(): StackValue | undefined {
    const value = this.stack.pop();
    this.notifyUpdate();
    return value;
  }
  
  // Type-safe operations
  popNumber(): number {
    const value = this.pop();
    if (value?.type !== 'number') {
      throw new Error('Expected number');
    }
    return value.value;
  }
  
  popString(): string {
    const value = this.pop();
    if (value?.type === 'string') return value.value;
    if (value?.type === 'cell') return this.getCellContent(value.value);
    throw new Error('Expected string or cell');
  }
}
```

### Operation Registry
```typescript
interface Operation {
  name: string;
  minArity: number;  // Minimum stack items required
  execute: (stack: ComputationalStack) => void;
  types?: StackValueType[];  // Expected types
}

const operations = new Map<string, Operation>([
  ['+', {
    name: 'add',
    minArity: 2,
    types: ['number', 'number'],
    execute: (stack) => {
      const b = stack.popNumber();
      const a = stack.popNumber();
      stack.push({ type: 'number', value: a + b });
    }
  }],
  // ... more operations
]);
```

### Parser Integration
```typescript
class ForthParser {
  parse(input: string): ParsedElement[] {
    const tokens = this.tokenize(input);
    return tokens.map(token => {
      if (this.isNumber(token)) {
        return { type: 'literal', dataType: 'number', value: parseFloat(token) };
      }
      if (this.isString(token)) {
        return { type: 'literal', dataType: 'string', value: this.parseString(token) };
      }
      if (this.isArray(token)) {
        return { type: 'literal', dataType: 'array', value: this.parseArray(token) };
      }
      if (operations.has(token)) {
        return { type: 'operation', name: token };
      }
      // Handle cell references, word definitions, etc.
    });
  }
}
```

## UI/UX Considerations

### Visual Stack Display
```
┌─────────────────────────┐
│ Computational Stack     │
├─────────────────────────┤
│ 3: [1, 2, 3]    array  │
│ 2: "Hello"      string │
│ 1: 42           number │
└─────────────────────────┘
```

### Input Area Modes
1. **RPN Mode** (default): Direct number/operation input
2. **Cell Mode**: LLM prompt input (current behavior)
3. **Mixed Mode**: Detect intent, auto-switch

### Keyboard Shortcuts
- `Tab` - Toggle between RPN and Cell mode
- `Ctrl+S` - Show computational stack
- `Ctrl+D` - Drop from computational stack
- `Ctrl+U` - Undo last operation

### Error Handling
- Type mismatches shown inline
- Stack underflow prevented
- Undo for all operations

## Benefits of This Approach

1. **Computational Power**: Quick calculations without LLM calls
2. **Data Manipulation**: Transform data before/after LLM processing
3. **Composability**: Build complex operations from simple ones
4. **Learning Curve**: Start with calculator, grow to programming
5. **Efficiency**: Reduce LLM calls for simple operations

## Challenges & Solutions

### Challenge: Two Different Stacks
**Solution**: Unified stack view with type indicators. Computational values are "lightweight cells"

### Challenge: Type Safety
**Solution**: Runtime type checking with clear error messages

### Challenge: Parser Complexity
**Solution**: Start with simple tokenizer, evolve to full parser

### Challenge: User Confusion
**Solution**: Clear mode indicators, progressive disclosure

## Future Extensions

1. **Variables**: `: pi 3.14159 ; pi 2 * → 6.28318`
2. **Control Flow**: `if-then-else`, loops
3. **Custom Types**: Define structured data types
4. **Modules**: Import operation libraries
5. **Persistence**: Save/load computational state

## Integration Examples

### Data Analysis Workflow
```
> @sales_data content    Stack: ["[{product: 'A', sales: 100}, ...]"]
> parse-json            Stack: [<array of objects>]
> ["sales"] pluck       Stack: [[100, 200, 150, ...]]
> 0 [+] reduce         Stack: [450]
> "Total sales: " swap concat
                       Stack: ["Total sales: 450"]
> "What insights can you draw?" concat query
                       Stack: [<cell: ai_analysis>]
```

### Text Processing
```
> @document content     Stack: ["Long document text..."]
> " " split            Stack: [["Long", "document", "text", ...]]
> len                  Stack: [1523]  (word count)
> "Word count: " swap concat str concat
                       Stack: ["Word count: 1523"]
```

## Next Steps

1. **Prototype**: Build basic RPN calculator in isolation
2. **Integrate**: Add computational stack to existing UI
3. **Parser**: Implement tokenizer and basic parser
4. **Operations**: Implement core operations incrementally
5. **Testing**: Ensure type safety and error handling
6. **Documentation**: Create interactive tutorial
7. **Iterate**: Gather feedback, refine UX