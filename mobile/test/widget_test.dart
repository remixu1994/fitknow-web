import 'package:fitknow_mobile/fitknow_theme.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('FitKnow theme uses the product accent', () {
    final theme = fitKnowTheme();
    expect(theme.colorScheme.primary, FitColors.accent);
    expect(theme.scaffoldBackgroundColor, FitColors.background);
  });
}
