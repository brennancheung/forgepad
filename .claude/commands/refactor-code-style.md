# Refactor Code Style

This workflow helps refactor code to match the project's coding standards.

## Purpose
Automatically refactor code to follow these conventions:
1. No semicolons
2. No switch/case statements - use helper functions with object lookups
3. No else/else if - use early return pattern
4. Single-line if statements without braces when possible
5. No `any` in TypeScript
6. Break functions into smaller composable functions.
7. Move functions that don't need to be inside of the React components body outside the body

## Steps

### 1. Remove Semicolons
Manually remove all semicolons at end of lines. The coding assistant should handle this during code editing.

### 2. Replace Switch/Case with Helper Functions
Transform switch statements into object lookups:

**Before:**
```typescript
switch (command.type) {
  case 'MOVE_UP':
    moveStackPosition(-1)
    break
  case 'MOVE_DOWN':
    moveStackPosition(1)
    break
  default:
    console.log('Unknown command')
}
```

**After:**
```typescript
const commandHandlers = {
  'MOVE_UP': () => moveStackPosition(-1),
  'MOVE_DOWN': () => moveStackPosition(1)
}

const handler = commandHandlers[command.type]
if (handler) handler()
```

### 3. Replace If/Else with Early Return
Transform if/else chains to early returns:

**Before:**
```typescript
if (isActive) {
  requestFocus()
} else {
  releaseFocus()
}
```

**After:**
```typescript
if (isActive) return requestFocus()
releaseFocus()
```

### 4. Simplify If Statements
Remove braces for single-line if statements:

**Before:**
```typescript
if (handler) {
  handler()
}
```

**After:**
```typescript
if (handler) handler()
```

## Manual Review Checklist

During refactoring, manually review for:

- [ ] Complex switch statements that need custom transformation
- [ ] Nested if/else that need early return pattern
- [ ] Any remaining `else if` statements
- [ ] TypeScript `any` types that need proper typing
- [ ] Multi-line statements that could be simplified
- [ ] Large functions that should be broken into smaller composable functions
- [ ] Functions inside React components that don't use state/props and should be moved outside
- [ ] Decompose large functions into smaller functions here possible

## Common Patterns

### Pattern 1: Error Handling with Early Return
```typescript
// Instead of:
if (error) {
  handleError(error)
} else {
  processData(data)
}

// Use:
if (error) return handleError(error)
processData(data)
```

### Pattern 2: Default Values
```typescript
// Instead of:
let value
if (input) {
  value = input
} else {
  value = defaultValue
}

// Use:
const value = input || defaultValue
```

### Pattern 3: Guard Clauses
```typescript
// Instead of:
function process(data) {
  if (data) {
    if (data.isValid) {
      // process
    }
  }
}

// Use:
function process(data) {
  if (!data) return
  if (!data.isValid) return
  // process
}
```

### Pattern 4: Replace For Loops with Array Methods
```typescript
// Instead of:
const activeUsers = []
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i])
  }
}

// Use:
const activeUsers = users.filter(user => user.isActive)

// Instead of:
const names = []
for (let i = 0; i < users.length; i++) {
  names.push(users[i].name)
}

// Use:
const names = users.map(user => user.name)

// Instead of:
const results = []
for (let i = 0; i < items.length; i++) {
  if (items[i].isValid) {
    results.push(processItem(items[i]))
  }
}

// Use:
const results = items
  .filter(item => item.isValid)
  .map(processItem)
```

### Pattern 5: Reduce for Accumulation
```typescript
// Instead of:
let total = 0
for (const item of items) {
  total += item.price * item.quantity
}

// Use:
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

// Instead of: Building an object
const groupedByCategory = {}
for (const product of products) {
  if (!groupedByCategory[product.category]) {
    groupedByCategory[product.category] = []
  }
  groupedByCategory[product.category].push(product)
}

// Use:
const groupedByCategory = products.reduce((groups, product) => {
  if (!groups[product.category]) groups[product.category] = []
  groups[product.category].push(product)
  return groups
}, {})

// Or even cleaner with nullish coalescing:
const groupedByCategory = products.reduce((groups, product) => ({
  ...groups,
  [product.category]: [...(groups[product.category] ?? []), product]
}), {})

// Instead of: Finding min/max
let maxPrice = -Infinity
for (const product of products) {
  if (product.price > maxPrice) {
    maxPrice = product.price
  }
}

// Use:
const maxPrice = products.reduce((max, product) => 
  Math.max(max, product.price), -Infinity)
```

### Pattern 6: Object.fromEntries with Reduce
```typescript
// Instead of: Transforming object keys and values
const normalized = {}
for (const key in data) {
  if (data.hasOwnProperty(key)) {
    normalized[key.toLowerCase()] = data[key].trim()
  }
}

// Use:
const normalized = Object.fromEntries(
  Object.entries(data).map(([key, value]) => 
    [key.toLowerCase(), value.trim()]
  )
)

// Instead of: Converting array to object with computed keys
const lookup = {}
for (const item of items) {
  const key = `${item.category}_${item.type}`
  lookup[key] = item
}

// Use:
const lookup = Object.fromEntries(
  items.map(item => [`${item.category}_${item.type}`, item])
)

// Or with reduce when you need more control:
const lookup = items.reduce((acc, item) => ({
  ...acc,
  [`${item.category}_${item.type}`]: item
}), {})
```

### Pattern 7: Breaking Functions into Smaller Composable Functions
```typescript
// Instead of:
function processOrder(order) {
  // Validate order
  if (!order.items || order.items.length === 0) return { error: 'No items' }
  if (!order.customerId) return { error: 'No customer' }
  
  // Calculate totals
  let subtotal = 0
  let tax = 0
  for (const item of order.items) {
    subtotal += item.price * item.quantity
  }
  tax = subtotal * 0.08
  const total = subtotal + tax
  
  // Apply discounts
  let discount = 0
  if (total > 100) discount = total * 0.1
  const finalTotal = total - discount
  
  // Create invoice
  const invoice = {
    orderId: order.id,
    customerId: order.customerId,
    subtotal,
    tax,
    discount,
    total: finalTotal,
    date: new Date()
  }
  
  return { success: true, invoice }
}

// Use:
const validateOrder = (order) => {
  if (!order.items || order.items.length === 0) return { error: 'No items' }
  if (!order.customerId) return { error: 'No customer' }
  return null
}

const calculateSubtotal = (items) => 
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)

const calculateTax = (subtotal, rate = 0.08) => subtotal * rate

const calculateDiscount = (total, threshold = 100, rate = 0.1) => 
  total > threshold ? total * rate : 0

const createInvoice = (order, calculations) => ({
  orderId: order.id,
  customerId: order.customerId,
  ...calculations,
  date: new Date()
})

function processOrder(order) {
  const validationError = validateOrder(order)
  if (validationError) return validationError
  
  const subtotal = calculateSubtotal(order.items)
  const tax = calculateTax(subtotal)
  const total = subtotal + tax
  const discount = calculateDiscount(total)
  const finalTotal = total - discount
  
  const invoice = createInvoice(order, {
    subtotal,
    tax,
    discount,
    total: finalTotal
  })
  
  return { success: true, invoice }
}
```

### Pattern 8: Moving Functions Outside React Components
```typescript
// Instead of:
function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1)
  
  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`
  }
  
  const calculateDiscount = (price, discountPercent) => {
    return price * (1 - discountPercent / 100)
  }
  
  const isInStock = (inventory) => {
    return inventory > 0
  }
  
  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }
  
  const handleAddToCart = () => {
    addToCart(product.id, quantity)
  }
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{truncateDescription(product.description)}</p>
      <p>{formatPrice(calculateDiscount(product.price, product.discount))}</p>
      <p>{isInStock(product.inventory) ? 'In Stock' : 'Out of Stock'}</p>
      <input 
        type="number" 
        value={quantity} 
        onChange={e => setQuantity(e.target.value)}
      />
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  )
}

// Use:
// Pure utility functions moved outside
const formatPrice = (price) => `$${price.toFixed(2)}`

const calculateDiscount = (price, discountPercent) => 
  price * (1 - discountPercent / 100)

const isInStock = (inventory) => inventory > 0

const truncateDescription = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1)
  
  const handleAddToCart = () => {
    addToCart(product.id, quantity)
  }
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{truncateDescription(product.description)}</p>
      <p>{formatPrice(calculateDiscount(product.price, product.discount))}</p>
      <p>{isInStock(product.inventory) ? 'In Stock' : 'Out of Stock'}</p>
      <input 
        type="number" 
        value={quantity} 
        onChange={e => setQuantity(e.target.value)}
      />
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  )
}
```

