# Accessibility Implementation Examples

## Complete Page Example

Here's how to build a fully accessible screen:

```typescript
import { ScrollView, View, Text } from 'react-native';
import { useRef } from 'react';
import { AccessibleCarousel } from '@/components/accessible/AccessibleCarousel';
import { AccessibleInfiniteScroll } from '@/components/accessible/AccessibleInfiniteScroll';
import { InclusiveButton } from '@/components/accessible/InclusiveButton';
import { SkipLink } from '@/components/accessible/SkipLink';
import { StatusMessage } from '@/components/accessible/LiveRegion';
import { useAccessibilityPreferences } from '@/utils/progressive-enhancement';

export default function AccessibleScreen() {
  const mainContentRef = useRef<ScrollView>(null);
  const { reduceMotion, screenReaderEnabled } = useAccessibilityPreferences();

  return (
    <View style={{ flex: 1 }}>
      {/* Skip navigation for keyboard users */}
      <SkipLink
        targetRef={mainContentRef}
        label="Skip to main content"
      />

      {/* Main content with proper ref */}
      <ScrollView
        ref={mainContentRef}
        accessible={false}
        accessibilityLabel="Main content area"
      >
        {/* Page header with semantic structure */}
        <View
          accessible={true}
          accessibilityRole="header"
        >
          <Text
            style={styles.heading}
            accessible={true}
            accessibilityRole="text"
            accessibilityLevel={1}
          >
            Welcome to Our App
          </Text>
        </View>

        {/* Featured content carousel */}
        <View style={styles.section}>
          <Text
            style={styles.sectionHeading}
            accessible={true}
            accessibilityRole="text"
            accessibilityLevel={2}
          >
            Featured Items
          </Text>

          <AccessibleCarousel
            data={featuredItems}
            renderItem={(item) => <FeaturedCard item={item} />}
            keyExtractor={(item) => item.id}
            showPagination={true}
            showNavButtons={true}
            autoplay={false}
            accessibilityLabel="Featured items carousel"
          />
        </View>

        {/* Infinite scroll list with pagination */}
        <View style={styles.section}>
          <Text
            style={styles.sectionHeading}
            accessible={true}
            accessibilityRole="text"
            accessibilityLevel={2}
          >
            All Items
          </Text>

          <AccessibleInfiniteScroll
            data={items}
            renderItem={(item) => <ItemCard item={item} />}
            keyExtractor={(item) => item.id}
            onLoadMore={loadMoreItems}
            hasMore={hasMore}
            loading={loading}
            usePagination={true}
            itemsPerPage={20}
          />
        </View>

        {/* Status messages */}
        <StatusMessage
          status="success"
          message="Your changes have been saved"
          visible={showSuccess}
          onDismiss={() => setShowSuccess(false)}
        />
      </ScrollView>
    </View>
  );
}
```

## Form with Full Accessibility

```typescript
import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { AccessibleSelect } from '@/components/accessible/AccessibleSelect';
import { InclusiveButton } from '@/components/accessible/InclusiveButton';
import { LoadingAnnouncer } from '@/components/accessible/LiveRegion';
import { useAccessibilityPreferences } from '@/utils/progressive-enhancement';

export function AccessibleForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { boldText } = useAccessibilityPreferences();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Submit logic
    setIsSubmitting(false);
  };

  return (
    <View style={styles.form}>
      {/* Form title */}
      <Text
        style={[styles.title, boldText && styles.boldText]}
        accessible={true}
        accessibilityRole="header"
        accessibilityLevel={1}
      >
        Registration Form
      </Text>

      {/* Name input */}
      <View style={styles.fieldGroup}>
        <Text
          style={styles.label}
          accessible={true}
          accessibilityRole="text"
        >
          Full Name
          <Text style={styles.required}> *</Text>
        </Text>

        <TextInput
          style={[
            styles.input,
            errors.name && styles.inputError,
          ]}
          value={formData.name}
          onChangeText={(name) => setFormData({ ...formData, name })}
          placeholder="Enter your full name"
          accessible={true}
          accessibilityLabel="Full name"
          accessibilityHint="Enter your full name"
          accessibilityRequired={true}
          accessibilityInvalid={!!errors.name}
          autoComplete="name"
        />

        {errors.name && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {errors.name}
          </Text>
        )}
      </View>

      {/* Email input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Email Address
          <Text style={styles.required}> *</Text>
        </Text>

        <TextInput
          style={[
            styles.input,
            errors.email && styles.inputError,
          ]}
          value={formData.email}
          onChangeText={(email) => setFormData({ ...formData, email })}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessible={true}
          accessibilityLabel="Email address"
          accessibilityHint="Enter your email address"
          accessibilityRequired={true}
          accessibilityInvalid={!!errors.email}
        />

        {errors.email && (
          <Text
            style={styles.errorText}
            accessible={true}
            accessibilityRole="alert"
          >
            {errors.email}
          </Text>
        )}
      </View>

      {/* Accessible select */}
      <AccessibleSelect
        label="Country"
        options={countryOptions}
        value={formData.country}
        onChange={(country) => setFormData({ ...formData, country })}
        placeholder="Select your country"
        searchable={true}
        required={true}
        error={errors.country}
        accessibilityLabel="Select your country"
        accessibilityHint="Choose your country of residence"
      />

      {/* Loading announcer for screen readers */}
      <LoadingAnnouncer
        loading={isSubmitting}
        loadingMessage="Submitting your registration"
        completedMessage="Registration submitted successfully"
      />

      {/* Submit button */}
      <InclusiveButton
        onPress={handleSubmit}
        variant="primary"
        size="large"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        accessibilityLabel="Submit registration form"
        accessibilityHint="Double tap to submit your registration"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Registration'}
      </InclusiveButton>
    </View>
  );
}
```

## Accessible Modal Dialog

```typescript
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';
import { InclusiveButton } from '@/components/accessible/InclusiveButton';
import { X } from 'lucide-react-native';

interface AccessibleModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({
  visible,
  onClose,
  title,
  children,
}: AccessibleModalProps) {
  const firstFocusableRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Focus first element when modal opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);

      // Announce modal opened
      AccessibilityInfo.announceForAccessibility(
        `${title} dialog opened`
      );
    }
  }, [visible, title]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessible={false}
    >
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessible={true}
        accessibilityLabel="Close dialog"
        accessibilityRole="button"
      >
        {/* Modal content */}
        <TouchableOpacity
          activeOpacity={1}
          accessible={false}
        >
          <View
            style={styles.modal}
            accessible={true}
            accessibilityRole="dialog"
            accessibilityLabel={title}
            accessibilityViewIsModal={true}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text
                style={styles.title}
                accessible={true}
                accessibilityRole="header"
                accessibilityLevel={1}
              >
                {title}
              </Text>

              <TouchableOpacity
                ref={firstFocusableRef}
                onPress={onClose}
                style={styles.closeButton}
                accessible={true}
                accessibilityLabel="Close dialog"
                accessibilityRole="button"
                accessibilityHint="Closes the dialog and returns to previous screen"
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {children}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <InclusiveButton
                onPress={onClose}
                variant="secondary"
                accessibilityLabel="Cancel and close dialog"
              >
                Cancel
              </InclusiveButton>

              <InclusiveButton
                onPress={() => {
                  // Action
                  onClose();
                }}
                variant="primary"
                accessibilityLabel="Confirm action"
              >
                Confirm
              </InclusiveButton>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
```

## Accessible Data Table

```typescript
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react-native';

interface AccessibleTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  onRowPress?: (item: T) => void;
}

export function AccessibleTable<T extends Record<string, any>>({
  data,
  columns,
  onRowPress,
}: AccessibleTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: keyof T) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }

    AccessibilityInfo.announceForAccessibility(
      `Table sorted by ${String(columnKey)} in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`
    );
  };

  const sortedData = sortColumn
    ? [...data].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        return aVal > bVal ? modifier : -modifier;
      })
    : data;

  return (
    <View
      style={styles.tableContainer}
      accessible={true}
      accessibilityRole="grid"
      accessibilityLabel={`Data table with ${data.length} rows`}
    >
      <ScrollView horizontal>
        <View>
          {/* Header */}
          <View
            style={styles.tableHeader}
            accessible={true}
            accessibilityRole="rowheader"
          >
            {columns.map((column) => (
              <TouchableOpacity
                key={String(column.key)}
                style={styles.headerCell}
                onPress={() => column.sortable && handleSort(column.key)}
                disabled={!column.sortable}
                accessible={true}
                accessibilityRole="columnheader"
                accessibilityLabel={`${column.label}${column.sortable ? ', sortable' : ''}`}
                accessibilityHint={
                  column.sortable
                    ? `Double tap to sort by ${column.label}`
                    : undefined
                }
                accessibilityState={{
                  selected: sortColumn === column.key,
                }}
              >
                <Text style={styles.headerText}>{column.label}</Text>
                {column.sortable && sortColumn === column.key && (
                  sortDirection === 'asc' ? (
                    <ChevronUp size={16} color="#FFFFFF" />
                  ) : (
                    <ChevronDown size={16} color="#FFFFFF" />
                  )
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Body */}
          {sortedData.map((item, rowIndex) => (
            <TouchableOpacity
              key={rowIndex}
              style={styles.tableRow}
              onPress={() => onRowPress?.(item)}
              disabled={!onRowPress}
              accessible={true}
              accessibilityRole="row"
              accessibilityLabel={`Row ${rowIndex + 1} of ${data.length}`}
            >
              {columns.map((column) => (
                <View
                  key={String(column.key)}
                  style={styles.cell}
                  accessible={true}
                  accessibilityRole="gridcell"
                  accessibilityLabel={`${column.label}: ${item[column.key]}`}
                >
                  {column.render ? (
                    column.render(item[column.key], item)
                  ) : (
                    <Text style={styles.cellText}>{item[column.key]}</Text>
                  )}
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
```

## Progressive Enhancement Example

```typescript
import { useAccessibilityPreferences, getAnimationDuration } from '@/utils/progressive-enhancement';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export function ProgressiveComponent() {
  const {
    reduceMotion,
    screenReaderEnabled,
    boldText,
    invertColors,
  } = useAccessibilityPreferences();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, {
      duration: getAnimationDuration(300, reduceMotion),
    }),
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text
        style={[
          styles.text,
          boldText && styles.boldText,
          invertColors && styles.highContrast,
        ]}
      >
        {screenReaderEnabled
          ? 'Detailed description for screen readers'
          : 'Brief visual description'}
      </Text>

      {/* Show simplified UI for screen reader users */}
      {screenReaderEnabled ? (
        <SimpleList />
      ) : (
        <VisualGrid />
      )}
    </Animated.View>
  );
}
```

## Testing Utilities

```typescript
// Test accessibility in your components
import { render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

describe('Accessible Component Tests', () => {
  it('should have proper accessibility labels', () => {
    const { getByA11yRole, getByA11yLabel } = render(
      <MyComponent />
    );

    expect(getByA11yRole('button')).toBeTruthy();
    expect(getByA11yLabel('Submit form')).toBeTruthy();
  });

  it('should announce changes to screen readers', async () => {
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');

    const { getByText } = render(<MyComponent />);
    fireEvent.press(getByText('Load More'));

    expect(announceSpy).toHaveBeenCalledWith('Loading more items');
  });

  it('should respect reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);

    const { getByTestId } = render(<AnimatedComponent />);

    // Verify animations are disabled
  });
});
```
