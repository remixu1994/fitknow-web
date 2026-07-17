import 'package:flutter/material.dart';

abstract final class FitColors {
  static const background = Color(0xFF090B0B);
  static const surface = Color(0xFF111515);
  static const raised = Color(0xFF191E1D);
  static const line = Color(0xFF29302F);
  static const text = Color(0xFFF3F6EF);
  static const muted = Color(0xFF8C9691);
  static const accent = Color(0xFFD7FF3F);
  static const accentDark = Color(0xFF172000);
}

ThemeData fitKnowTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: FitColors.accent,
    brightness: Brightness.dark,
    surface: FitColors.surface,
  );
  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: FitColors.background,
    colorScheme: scheme.copyWith(
      primary: FitColors.accent,
      onPrimary: FitColors.background,
      surface: FitColors.surface,
      onSurface: FitColors.text,
      outline: FitColors.line,
    ),
    useMaterial3: true,
    fontFamilyFallback: const [
      'Noto Sans CJK SC',
      'Microsoft YaHei',
      'sans-serif',
    ],
    dividerColor: FitColors.line,
    splashColor: FitColors.accent.withValues(alpha: .08),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: FitColors.surface,
      indicatorColor: FitColors.accentDark,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
      ),
      height: 68,
    ),
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: FitColors.surface,
      hintStyle: TextStyle(color: FitColors.muted),
      border: OutlineInputBorder(borderSide: BorderSide(color: FitColors.line)),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(color: FitColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(color: FitColors.accent),
      ),
    ),
  );
}
