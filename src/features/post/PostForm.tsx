/**
 * Posting an event.
 *
 * `BUILD-PLAN.md` §4.5 specified four steps. This is one scrolling form with sections
 * instead, deliberately: a four-step wizard hides the total ask behind a Next button,
 * and the single loudest risk in this product is that people do not post. Showing the
 * whole (short) form up front is the honest version — you can see it is six fields
 * before you start, rather than discovering step three exists.
 *
 * Validation runs on blur and never disables the submit button. A disabled button that
 * does not say why is hostile; pressing it scrolls to the first problem instead.
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { strings } from '@/copy/strings';
import { Button, Chip, Divider, Text } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, space, type as typeScale } from '@/design/tokens';
import { TOWNS, type Town } from '@/lib/towns';
import type { DraftEvent } from '@/lib/myEventsStore';
import {
  CATEGORY_LABELS,
  EVENT_CATEGORIES,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  type EventCategory,
} from '@/types/event';

const MAX_TITLE = 80;
const MAX_SUMMARY = 120;
const MAX_DESCRIPTION = 2000;
const DEFAULT_DURATION_MIN = 120;

export type PostFormProps = {
  defaultTown: Town;
  onSubmit: (draft: DraftEvent) => void;
  onCancel: () => void;
};

type Errors = Partial<Record<'title' | 'summary' | 'category' | 'date' | 'time', string>>;

/** `YYYY-MM-DD` plus `HH:MM`, parsed in local time rather than as UTC. */
function parseLocalDateTime(date: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;

  const [, y, m, d] = dateMatch;
  const [, hh, mm] = timeMatch;
  const hours = Number(hh);
  const minutes = Number(mm);
  if (hours > 23 || minutes > 59) return null;

  const parsed = new Date(Number(y), Number(m) - 1, Number(d), hours, minutes, 0, 0);
  // Rejects 2026-02-31, which the Date constructor would silently roll to March.
  if (parsed.getMonth() !== Number(m) - 1 || parsed.getDate() !== Number(d)) return null;
  return parsed;
}

function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function PostForm({ defaultTown, onSubmit, onCancel }: PostFormProps) {
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [tags, setTags] = useState<readonly string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [date, setDate] = useState(toDateInput(new Date()));
  const [time, setTime] = useState('18:30');
  const [town, setTown] = useState<Town>(defaultTown);
  const [venueName, setVenueName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceLabel, setPriceLabel] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const next: Errors = {};
    if (title.trim().length < 3) next.title = 'Give it a name people will recognise.';
    if (summary.trim().length < 3) next.summary = 'One sentence, so people know what it is.';
    if (!category) next.category = 'Pick one, so it shows up in the right filter.';
    const startsAt = parseLocalDateTime(date, time);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) next.date = 'Use YYYY-MM-DD.';
    else if (!startsAt) next.date = "That date doesn't exist.";
    if (!/^\d{1,2}:\d{2}$/.test(time.trim())) next.time = 'Use a 24-hour time like 18:30.';
    return next;
  };

  const addTag = () => {
    const cleaned = tagDraft.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH);
    if (cleaned.length === 0) return;
    if (tags.includes(cleaned) || tags.length >= MAX_TAGS) {
      setTagDraft('');
      return;
    }
    setTags([...tags, cleaned]);
    setTagDraft('');
  };

  const submit = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const startsAt = parseLocalDateTime(date, time);
    if (!startsAt || !category) return;
    const endsAt = new Date(startsAt.getTime() + DEFAULT_DURATION_MIN * 60_000);

    const parsedPrice = Number(priceLabel.replace(/[^0-9.]/g, ''));

    onSubmit({
      // Timestamp plus randomness: two posts in the same millisecond is unlikely, but
      // a collision would silently overwrite someone's event.
      id: `mine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim().slice(0, MAX_TITLE),
      summary: summary.trim().slice(0, MAX_SUMMARY),
      description: description.trim().slice(0, MAX_DESCRIPTION),
      category,
      tags,
      priceTier: isFree ? 'free' : 'paid',
      priceLabel: isFree ? 'Free' : priceLabel.trim() || 'Paid',
      priceFrom: isFree || Number.isNaN(parsedPrice) || parsedPrice === 0 ? null : parsedPrice,
      venueName: venueName.trim(),
      addressLine: addressLine.trim(),
      town: town.name,
      latitude: town.latitude,
      longitude: town.longitude,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      contactEmail: contactEmail.trim(),
      createdAt: new Date().toISOString(),
    });
  };

  const field = (value: string, limit: number) => ({
    borderColor: theme.color.borderStrong,
    backgroundColor: theme.color.surface,
    // Counter only appears near the limit — always-on counters nag.
    showCount: value.length > limit - 20,
  });

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section label="What is it">
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          onBlur={() => setErrors((e) => ({ ...e, title: validate().title }))}
          placeholder="Wakefield Farmers Market"
          maxLength={MAX_TITLE}
          error={errors.title}
          counter={field(title, MAX_TITLE).showCount ? `${MAX_TITLE - title.length}` : undefined}
        />
        <Field
          label="One line"
          value={summary}
          onChangeText={setSummary}
          onBlur={() => setErrors((e) => ({ ...e, summary: validate().summary }))}
          placeholder="Twenty-two vendors on the common, every Saturday."
          maxLength={MAX_SUMMARY}
          error={errors.summary}
          counter={
            field(summary, MAX_SUMMARY).showCount ? `${MAX_SUMMARY - summary.length}` : undefined
          }
        />
        <Field
          label="Details"
          value={description}
          onChangeText={setDescription}
          placeholder="Parking, what to bring, who to ask. Anything someone would want to know before showing up."
          maxLength={MAX_DESCRIPTION}
          multiline
        />
      </Section>

      <Divider />

      <Section label="Category" error={errors.category}>
        <View style={styles.chips}>
          {EVENT_CATEGORIES.map((option) => (
            <Chip
              key={option}
              label={CATEGORY_LABELS[option]}
              selected={category === option}
              onPress={() => {
                setCategory(option);
                setErrors((e) => ({ ...e, category: undefined }));
              }}
            />
          ))}
        </View>
      </Section>

      <Section
        label="Tags"
        hint={`Optional. Your own words — "sourdough", "dog friendly", "u12". Up to ${MAX_TAGS}.`}
      >
        {tags.length > 0 ? (
          <View style={styles.chips}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                removable
                selected
                onPress={() => setTags(tags.filter((t) => t !== tag))}
                accessibilityHint="Removes this tag"
              />
            ))}
          </View>
        ) : null}
        {tags.length < MAX_TAGS ? (
          <View style={styles.tagRow}>
            <View style={styles.tagInput}>
              <Field
                label=""
                value={tagDraft}
                onChangeText={setTagDraft}
                onSubmitEditing={addTag}
                placeholder="Add a tag"
                maxLength={MAX_TAG_LENGTH}
                returnKeyType="done"
              />
            </View>
            <Button label="Add" variant="secondary" onPress={addTag} />
          </View>
        ) : null}
      </Section>

      <Divider />

      <Section label="When" error={errors.date ?? errors.time}>
        <View style={styles.chips}>
          <Chip label="Today" onPress={() => setDate(toDateInput(new Date()))} />
          <Chip
            label="Tomorrow"
            onPress={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setDate(toDateInput(d));
            }}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.grow}>
            <Field label="Date" value={date} onChangeText={setDate} placeholder="2026-08-15" />
          </View>
          <View style={styles.grow}>
            <Field label="Start" value={time} onChangeText={setTime} placeholder="18:30" />
          </View>
        </View>
      </Section>

      <Divider />

      <Section label="Where">
        <View style={styles.chips}>
          {TOWNS.slice(0, 10).map((option) => (
            <Chip
              key={option.name}
              label={option.name}
              selected={option.name === town.name}
              onPress={() => setTown(option)}
            />
          ))}
        </View>
        <Field
          label="Venue"
          value={venueName}
          onChangeText={setVenueName}
          placeholder="Hall Park"
        />
        <Field
          label="Address"
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="Church St"
        />
      </Section>

      <Divider />

      <Section label="Price">
        <View style={styles.chips}>
          <Chip label="Free" selected={isFree} onPress={() => setIsFree(true)} />
          <Chip label="Costs money" selected={!isFree} onPress={() => setIsFree(false)} />
        </View>
        {!isFree ? (
          <Field
            label="What it costs"
            value={priceLabel}
            onChangeText={setPriceLabel}
            placeholder="$5 general / $20 sideline"
          />
        ) : null}
      </Section>

      <Section label="How people reach you" hint="Optional, shown on the event.">
        <Field
          label="Email"
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="rec@example.org"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Section>

      <View style={[styles.notice, { borderColor: theme.color.border }]}>
        <Text variant="meta" color="textSecondary">
          {strings.post.firstPostNotice}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
        <Button label="Post event" variant="primary" block onPress={submit} />
      </View>
    </ScrollView>
  );
}

function Section({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {label.length > 0 ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}
      {hint ? (
        <Text variant="meta" color="textSecondary">
          {hint}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text variant="meta" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function Field({
  label,
  error,
  counter,
  multiline,
  ...input
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  counter?: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      {label.length > 0 ? (
        <View style={styles.fieldHead}>
          <Text variant="meta" color="textSecondary">
            {label}
          </Text>
          {counter ? (
            <Text variant="meta" color={Number(counter) <= 10 ? 'danger' : 'textSecondary'}>
              {counter}
            </Text>
          ) : null}
        </View>
      ) : null}
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={label || input.placeholder}
        placeholderTextColor={theme.color.textSecondary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.color.textPrimary,
            borderColor: error ? theme.color.danger : theme.color.borderStrong,
            backgroundColor: theme.color.surface,
          },
        ]}
      />
      {error ? (
        <Text variant="meta" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl * 2,
    gap: space.md,
  },
  section: {
    gap: space.sm,
    paddingVertical: space.sm,
  },
  field: {
    gap: space.xs,
  },
  fieldHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: border.hairline,
    borderRadius: radius.base,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  grow: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
  },
  tagInput: {
    flex: 1,
  },
  notice: {
    borderWidth: border.hairline,
    borderRadius: radius.base,
    padding: space.md,
    marginTop: space.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
});
