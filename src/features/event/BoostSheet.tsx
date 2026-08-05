/**
 * Boosting your own event, after it is live.
 *
 * The case this exists for: something you posted is doing better than you expected, and
 * you would put a dollar behind it to get it in front of more people. That is a
 * different moment from posting, and it wants a different surface — you already know
 * the event works, you are only choosing how far to push it.
 *
 * **Nothing here takes a payment.** Eventr never processes money for events, and it does
 * not process money for boosts either yet. This records what the poster asked for and
 * says so in plain language. A flow that mimed a checkout and then quietly did nothing
 * would be worse than no flow at all, and "we'll bill you later" printed next to a
 * price is the kind of thing people remember.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { strings } from '@/copy/strings';
import { Button, Press, Sheet, Text } from '@/design/primitives';
import { useTheme } from '@/design/theme';
import { border, radius, space } from '@/design/tokens';
import type { BoostReach, BoostRequest } from '@/lib/myEvents';

const OPTIONS: readonly {
  reach: BoostReach;
  price: string;
  title: string;
  detail: string;
}[] = [
  {
    reach: 'town',
    price: '$1',
    title: 'This town',
    // The honest pitch for the cheap option: most people who will actually come are
    // already nearby, so the small buy is usually the right one.
    detail: 'Top of the feed for people searching your town. Most of who turns up anyway.',
  },
  {
    reach: 'region',
    price: '$3',
    title: 'Within 50 miles',
    detail: 'Everyone in range, whichever town they searched from. Worth it for something rare.',
  },
];

export type BoostSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The request already on file, if there is one. */
  current: BoostRequest | null;
  onRequest: (reach: BoostReach) => void;
  onCancel: () => void;
};

export function BoostSheet({ visible, onClose, current, onRequest, onCancel }: BoostSheetProps) {
  const theme = useTheme();
  const [chosen, setChosen] = useState<BoostReach>(current?.reach ?? 'town');

  return (
    <Sheet visible={visible} onClose={onClose} title={strings.boost.title}>
      <Text variant="body" color="textSecondary">
        {strings.boost.intro}
      </Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = option.reach === chosen;
          return (
            <Press
              key={option.reach}
              onPress={() => setChosen(option.reach)}
              feedback="select"
              scaleOnPress={false}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${option.title}, ${option.price}. ${option.detail}`}
              style={[
                styles.option,
                {
                  borderColor: selected ? theme.color.brand : theme.color.border,
                  borderWidth: selected ? border.strong : border.hairline,
                },
              ]}
            >
              <View style={styles.optionHead}>
                <Text variant="title" color={selected ? 'brand' : 'textPrimary'}>
                  {option.title}
                </Text>
                <Text variant="title" color={selected ? 'brand' : 'textPrimary'}>
                  {option.price}
                </Text>
              </View>
              <Text variant="meta" color="textSecondary">
                {option.detail}
              </Text>
            </Press>
          );
        })}
      </View>

      {/*
        Said before the button, not after it. Anyone who taps Boost should already know
        that no card is being charged and that review still applies.
      */}
      <View style={[styles.notice, { borderColor: theme.color.borderStrong }]}>
        <Text variant="meta" color="textSecondary">
          {strings.boost.noBilling}
        </Text>
      </View>

      <View style={styles.actions}>
        {current ? (
          <Button
            label={strings.boost.cancel}
            variant="ghost"
            onPress={() => {
              onCancel();
              onClose();
            }}
          />
        ) : null}
        <Button
          label={current ? strings.boost.update : strings.boost.confirm}
          onPress={() => {
            onRequest(chosen);
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: space.sm,
    marginTop: space.md,
  },
  option: {
    padding: space.md,
    borderRadius: radius.base,
    gap: space.xs,
  },
  optionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notice: {
    marginTop: space.md,
    padding: space.sm,
    borderWidth: border.hairline,
    borderRadius: radius.base,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
    marginTop: space.lg,
  },
});
