# Accessible Component Usage Guide

Quick reference for using accessible components in the trading app.

---

## 📦 Available Components

### 1. AccessibleAlertDialog

**Use for:** Confirmations, warnings, errors, success messages

```typescript
import { AccessibleAlertDialog } from '@/components/accessible/AccessibleAlertDialog';

// Example: Trade confirmation
<AccessibleAlertDialog
  visible={showDialog}
  onClose={() => setShowDialog(false)}
  type="warning"
  title="Confirm Trade"
  message="You are about to buy 10 shares of AAPL for $1,234.56"
  actions={[
    {
      label: 'Cancel',
      onPress: () => console.log('Cancelled'),
      style: 'default',
    },
    {
      label: 'Confirm Purchase',
      onPress: handleTrade,
      style: 'primary',
      accessibilityHint: 'Executes the trade immediately',
    },
  ]}
/>

// Example: Error alert
<AccessibleAlertDialog
  visible={showError}
  onClose={() => setShowError(false)}
  type="error"
  title="Trade Failed"
  message="Insufficient funds to complete this transaction"
  actions={[
    {
      label: 'Deposit Funds',
      onPress: () => navigation.navigate('Deposit'),
      style: 'primary',
    },
    {
      label: 'Close',
      onPress: () => setShowError(false),
      style: 'default',
    },
  ]}
  dismissible={false}
/>
```

**Props:**
- `visible` (boolean): Controls visibility
- `onClose` (function): Called when dismissed
- `type` ('info' | 'success' | 'warning' | 'error'): Alert style
- `title` (string): Dialog title
- `message` (string): Description text
- `actions` (array): Action buttons
- `dismissible` (boolean): Can be dismissed by tapping outside
- `announcementDelay` (number): Delay before screen reader announcement

---

### 2. AccessibleCarousel

**Use for:** Image galleries, featured content, news items

```typescript
import { AccessibleCarousel } from '@/components/accessible/AccessibleCarousel';

<AccessibleCarousel
  data={newsItems}
  renderItem={(item, index) => <NewsCard article={item} />}
  keyExtractor={(item) => item.id}
  showPagination={true}
  showNavButtons={true}
  accessibilityLabel="Featured market news"
  accessibilityHint="Swipe or use arrow buttons to browse articles"
/>
```

**Features:**
- ✅ Keyboard navigation buttons
- ✅ Pagination dots (clickable)
- ✅ Screen reader announcements
- ✅ Haptic feedback
- ✅ Auto-announces current item

---

### 3. AccessibleInfiniteScroll

**Use for:** Long lists, feeds, search results

```typescript
import { AccessibleInfiniteScroll } from '@/components/accessible/AccessibleInfiniteScroll';

<AccessibleInfiniteScroll
  data={stocks}
  renderItem={(stock) => <StockRow data={stock} />}
  keyExtractor={(stock) => stock.symbol}
  onLoadMore={fetchMoreStocks}
  hasMore={hasMoreData}
  loading={isLoading}
  usePagination={true}  // Enables pagination controls
  itemsPerPage={20}
  emptyMessage="No stocks found"
/>
```

**Modes:**
- **Infinite Scroll**: Auto-loads on scroll (default)
- **Pagination**: Manual "Load More" button
- **Hybrid**: Pagination with explicit controls

---

### 4. AccessibleSelect

**Use for:** Dropdowns, picker menus, filter options

```typescript
import { AccessibleSelect } from '@/components/accessible/AccessibleSelect';

<AccessibleSelect
  label="Order Type"
  options={[
    { label: 'Market Order', value: 'market', description: 'Execute immediately at current price' },
    { label: 'Limit Order', value: 'limit', description: 'Execute only at specified price' },
    { label: 'Stop Loss', value: 'stop', description: 'Sell when price falls below threshold' },
  ]}
  value={orderType}
  onChange={setOrderType}
  searchable={true}
  placeholder="Select order type"
  required={true}
/>
```

**Features:**
- ✅ Search functionality
- ✅ Multi-select support
- ✅ Custom icons
- ✅ Disabled states
- ✅ Error validation
- ✅ Keyboard navigation

---

### 5. SmartInput

**Use for:** All form inputs with auto-formatting

```typescript
import { SmartInput } from '@/components/ui/SmartInput';

// Email input
<SmartInput
  label="Email"
  type="email"
  value={email}
  onChangeText={setEmail}
  required={true}
  autoValidate={true}
  error={emailError}
/>

// Phone number (auto-formatted)
<SmartInput
  label="Phone Number"
  type="phone"
  value={phone}
  onChangeText={setPhone}
  hint="10-digit US number"
/>

// Currency amount
<SmartInput
  label="Amount"
  type="amount"
  value={amount}
  onChangeText={setAmount}
  icon={DollarSign}
  required={true}
/>

// Password with toggle
<SmartInput
  label="Password"
  type="password"
  value={password}
  onChangeText={setPassword}
  required={true}
  showValidIcon={false}
/>
```

**Supported Types:**
- `text`, `email`, `phone`, `password`
- `card-number`, `card-expiry`, `cvv`
- `amount`, `percentage`
- `ssn`, `zip`, `routing`, `account`

---

### 6. FocusTrap

**Use for:** Modal dialogs, drawers, overlays

```typescript
import { FocusTrap } from '@/components/ui/FocusTrap';

<Modal visible={visible}>
  <FocusTrap active={visible}>
    {/* Modal content - focus stays trapped inside */}
    <View>
      <TextInput placeholder="First field" />
      <TextInput placeholder="Second field" />
      <Button onPress={handleSave}>Save</Button>
    </View>
  </FocusTrap>
</Modal>
```

**What it does:**
- Traps Tab/Shift+Tab navigation
- Returns focus on close
- Works only on web platform
- Automatically manages focus order

---

## 🎯 Common Patterns

### Pattern 1: Accessible Modal

```typescript
function MyModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Settings dialog"
    >
      <FocusTrap active={visible}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close settings"
          >
            <X size={24} />
          </TouchableOpacity>

          {/* Modal content */}
        </View>
      </FocusTrap>
    </Modal>
  );
}
```

---

### Pattern 2: Accessible Form

```typescript
function TradeForm() {
  return (
    <View accessible={false}>
      <SmartInput
        label="Symbol"
        type="text"
        value={symbol}
        onChangeText={setSymbol}
        required={true}
        error={symbolError}
      />

      <SmartInput
        label="Quantity"
        type="amount"
        value={quantity}
        onChangeText={setQuantity}
        required={true}
      />

      <AccessibleSelect
        label="Order Type"
        options={orderTypes}
        value={orderType}
        onChange={setOrderType}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Place order"
        accessibilityState={{ disabled: !isValid }}
      >
        <Text>Submit Trade</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### Pattern 3: Accessible List Item

```typescript
function StockListItem({ stock, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => onPress(stock)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${stock.symbol}, ${stock.name}`}
      accessibilityHint={`Current price ${stock.price}, ${stock.change > 0 ? 'up' : 'down'} ${stock.changePercent}%`}
      accessibilityValue={{ text: stock.price }}
    >
      <View>
        <Text>{stock.symbol}</Text>
        <Text>{stock.name}</Text>
        <Text>{stock.price}</Text>
      </View>
    </TouchableOpacity>
  );
}
```

---

### Pattern 4: Status Announcement

```typescript
function TradeStatus() {
  const [status, setStatus] = useState('');

  return (
    <>
      <View
        accessible={true}
        accessibilityLiveRegion="polite"
        accessibilityRole="status"
      >
        <Text>{status}</Text>
      </View>

      <Button
        onPress={() => {
          executeTrade();
          setStatus('Trade executed successfully');
        }}
      />
    </>
  );
}
```

---

## ⚡ Quick Tips

### DO ✅
- Use `accessibilityLabel` for meaningful descriptions
- Add `accessibilityHint` for context
- Wrap error messages in `accessibilityRole="alert"`
- Set `accessibilityLiveRegion` for dynamic updates
- Test with VoiceOver/TalkBack

### DON'T ❌
- Use generic labels like "Button" or "Input"
- Forget to announce loading/error states
- Nest too many accessible elements
- Use images without descriptions
- Skip keyboard testing

---

## 🔍 Testing Commands

### iOS Simulator
```bash
# Enable VoiceOver
xcrun simctl spawn booted launchctl setenv SIMULATOR_ACCESSIBILITY_ENABLED 1

# Test specific gestures
# - Two-finger swipe up: Read from top
# - Two-finger tap: Toggle speech
# - Swipe right/left: Navigate elements
```

### Android Emulator
```bash
# Enable TalkBack
adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService

# Test navigation
# - Swipe right/left: Navigate
# - Double-tap: Activate
# - Two-finger swipe: Scroll
```

---

## 📚 Additional Resources

- **Main Guide**: `/docs/ACCESSIBILITY-IMPROVEMENTS-2025.md`
- **Audit Report**: `/docs/ACCESSIBILITY-AUDIT-REPORT.md`
- **Examples**: `/docs/ACCESSIBILITY-EXAMPLES.md`
- **Design Guide**: `/docs/INCLUSIVE-DESIGN-GUIDE.md`

---

**Last Updated:** January 2025
