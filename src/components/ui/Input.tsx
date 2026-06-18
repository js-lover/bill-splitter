import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.neutral[400]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[1],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: spacing[4],
    fontSize: fontSize.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: colors.danger[500],
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.danger[500],
  },
});
